
import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/v1";

const BOOKING_ID = "6acb3832aeb9619ba1f19be8";
const PAYMENT_ID = "6acb3832aeb9619ba1f19be9";

function Payment() {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [booking, setBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Existing payment aur booking status check
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [paymentResponse, bookingResponse] = await Promise.all([
          fetch(`${API}/payments/${PAYMENT_ID}`),
          fetch(`${API}/bookings/${BOOKING_ID}`),
        ]);

        const paymentData = await paymentResponse.json();
        const bookingData = await bookingResponse.json();

        if (bookingResponse.ok && bookingData.success) {
          setBooking(bookingData.booking);
        }

        if (
          paymentResponse.ok &&
          paymentData.success &&
          paymentData.paymentStatus === "PAID"
        ) {
          setPaymentStatus("PAID");
        }
      } catch (error) {
        console.error("Status check failed:", error);
        setErrorMessage(
          "Status load nahi hua. Backend server check karo."
        );
      }
    };

    checkStatus();
  }, []);

  const handlePayment = async () => {
    if (loading || paymentStatus === "PAID") return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API}/payments/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "6aca1a32cbb00b681cd82868",
          mentorId: "6acb2433dfc297275d444c81",
          sessionDate: "2026-10-20T10:00:00.000Z",
          amountPaise: 100000,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Order creation failed");
      }

      const scriptLoaded = await new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        throw new Error("Razorpay Checkout load nahi hua.");
      }

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "THRONE8",
        description: "Mentorship Session",
        order_id: data.order.id,

        handler: async (paymentResponse) => {
          try {
            const verifyResponse = await fetch(`${API}/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message || "Payment verification failed"
              );
            }

            setPaymentStatus("PAID");

            // Booking details dobara load karo
            const bookingResponse = await fetch(
              `${API}/bookings/${BOOKING_ID}`
            );
            const bookingData = await bookingResponse.json();

            if (bookingResponse.ok && bookingData.success) {
              setBooking(bookingData.booking);
            }

            setErrorMessage("");
          } catch (error) {
            setErrorMessage(error.message);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },

        theme: { color: "#2563eb" },
      });

      checkout.on("payment.failed", () => {
        setErrorMessage("Payment failed. Server status verify karo.");
        setLoading(false);
      });

      checkout.open();
    } catch (error) {
      setErrorMessage(error.message || "Payment setup failed.");
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

  return (
    <div style={{
      maxWidth: "520px",
      margin: "40px auto",
      padding: "24px",
      fontFamily: "Arial",
      textAlign: "center",
      border: "1px solid #ddd",
      borderRadius: "12px",
    }}>
      <h1>THRONE8</h1>
      <h2>Mentorship Booking</h2>
      <p>Session Amount: ₹1,000</p>

      {paymentStatus === "PAID" && booking && (
        <div style={{
          color: "#166534",
          margin: "20px 0",
          padding: "18px",
          background: "#f0fff4",
          borderRadius: "8px",
          textAlign: "left",
        }}>
          <h3 style={{ textAlign: "center" }}>
            ✓ Payment Successful!
          </h3>
          <p>Payment Status: <strong>PAID</strong></p>
          <p>Booking Status: <strong>{booking.status}</strong></p>
          <p>Mentor: {booking.mentor?.name || "Mentor"}</p>
          <p>Mentor Email: {booking.mentor?.email || "Not available"}</p>
          <p>Session Date: {formatDate(booking.sessionDate)}</p>
          <p>Amount: ₹{(booking.amountPaise / 100).toLocaleString("en-IN")}</p>
          <p>Booking ID: {booking._id}</p>
        </div>
      )}

      {paymentStatus === "PAID" && !booking && (
        <p>Payment PAID hai. Booking details load ho rahi hain.</p>
      )}

      {errorMessage && (
        <p style={{ color: "red" }}>{errorMessage}</p>
      )}

      {paymentStatus !== "PAID" && (
        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: loading ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Please wait..." : "Pay ₹1,000"}
        </button>
      )}
    </div>
  );
}

export default Payment;
