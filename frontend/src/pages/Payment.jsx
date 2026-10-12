
import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/v1";

function Payment() {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [booking, setBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const getToken = () => localStorage.getItem("token");

  const authHeaders = () => {
    const token = getToken();

    if (!token) {
      throw new Error("Student login nahi mila. Please login again.");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = getToken();
        if (!token) return;

        // Purani hard-coded booking/payment IDs hata di gayi hain.
        // Status check successful order/verification ke baad hoga.
      } catch (error) {
        setErrorMessage(error.message);
      }
    };

    checkStatus();
  }, []);

  const handlePayment = async () => {
    if (loading || paymentStatus === "PAID") return;

    setLoading(true);
    setErrorMessage("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Student token nahi mila. Logout karke login karo.");
      }

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const studentId = user._id || user.id || user.userId;

      if (!studentId) {
        throw new Error("Student ID nahi mila. Please dobara login karo.");
      }

      /*
       * IMPORTANT:
       * Neeche mentorId ko apne actual mentor selection se lena chahiye.
       * Abhi purane database record ka mentor ID diya hai.
       * Agar ye current mentor nahi hai, payment mat karo.
       */
       const mentorId = "6acc1483bfb9b885560c74cd";
      const response = await fetch(`${API}/payments/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId,
          mentorId,
          sessionDate: "2026-10-20T10:00:00.000Z",
          amountPaise: 100000,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Order create nahi hua.");
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
              headers: authHeaders(),
              body: JSON.stringify(paymentResponse),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message || "Payment verification failed."
              );
            }

            setPaymentStatus("PAID");
            setBooking(verifyData.booking || null);
            setErrorMessage("");
          } catch (error) {
            setErrorMessage(error.message || "Verification failed.");
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
        setErrorMessage("Payment failed. Dobara status check karo.");
        setLoading(false);
      });

      checkout.open();
    } catch (error) {
      setErrorMessage(error.message || "Payment setup failed.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 24,
        fontFamily: "Arial",
        textAlign: "center",
        border: "1px solid #ddd",
        borderRadius: 12,
      }}
    >
      <h1>THRONE8</h1>
      <h2>Mentorship Booking</h2>
      <p>Session Amount: ₹1,000</p>

      {paymentStatus === "PAID" && (
        <div style={{ color: "green" }}>
          <h3>Payment Successful!</h3>
          <p>Payment Status: PAID</p>
          {booking && <p>Booking Status: {booking.status}</p>}
        </div>
      )}

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {paymentStatus !== "PAID" && (
        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            padding: "12px 24px",
            background: loading ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 6,
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
