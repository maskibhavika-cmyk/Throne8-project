
const crypto = require("crypto");
const WebhookEvent = require("../models/WebhookEvent");
const Payment = require("../models/Payment");
const Booking = require("../models/Booking");

const receiveWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature configuration missing",
      });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Raw webhook body is not configured",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    const received = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const eventType = event.event;

    console.log("Razorpay webhook event:", eventType, eventId);

    if (!eventId || !eventType) {
      return res.status(400).json({
        success: false,
        message: "Webhook event details missing",
      });
    }

    let storedEvent;

    try {
      storedEvent = await WebhookEvent.create({
        eventId,
        eventType,
        payload: event,
        processed: false,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(200).json({
          success: true,
          message: "Webhook event already received",
        });
      }
      throw error;
    }

    if (eventType === "payment.captured") {
      const entity = event.payload?.payment?.entity;

      if (!entity?.order_id || !entity?.id) {
        return res.status(400).json({
          success: false,
          message: "Captured payment details missing",
        });
      }

      const payment = await Payment.findOne({
        razorpayOrderId: entity.order_id,
      });

      if (!payment) {
        console.error("Payment record not found:", entity.order_id);
        return res.status(200).json({
          success: true,
          message: "Payment record not found; reconciliation required",
        });
      }

      if (
        entity.amount !== payment.amountPaise ||
        entity.currency !== payment.currency
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment amount or currency mismatch",
        });
      }

      const booking = await Booking.findById(payment.booking);

      if (!booking) {
        return res.status(200).json({
          success: true,
          message: "Booking not found; reconciliation required",
        });
      }

      if (
        String(booking.student) !== String(payment.student) ||
        booking.amountPaise !== payment.amountPaise
      ) {
        return res.status(400).json({
          success: false,
          message: "Booking and payment do not match",
        });
      }

      if (
        payment.status === "PAID" &&
        booking.paymentStatus === "PAID"
      ) {
        storedEvent.processed = true;
        await storedEvent.save();

        return res.status(200).json({
          success: true,
          message: "Payment already processed",
        });
      }

      if (
        payment.status !== "CREATED" ||
        booking.paymentStatus !== "PENDING" ||
        booking.status !== "PENDING"
      ) {
        return res.status(200).json({
          success: true,
          message: "Event stored for reconciliation",
        });
      }

      payment.razorpayPaymentId = entity.id;
      payment.status = "PAID";
      payment.paidAt = new Date();
      await payment.save();

      booking.paymentStatus = "PAID";
      booking.status = "CONFIRMED";
      await booking.save();
    }

    storedEvent.processed = true;
    await storedEvent.save();

    return res.status(200).json({
      success: true,
      message: "Webhook verified and processed",
    });
  } catch (error) {
    console.error("Webhook processing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

module.exports = { receiveWebhook };
