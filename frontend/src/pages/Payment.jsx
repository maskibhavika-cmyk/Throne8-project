
import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/v1";
const AMOUNT_PAISE = 100000;

function loadRazorpay() {
  return new Promise((resolve) => {
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
}

function Payment() {
  const [mentors, setMentors] = useState([]);
  const [mentorId, setMentorId] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");

  const minSessionDate = (() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 2);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  })();

  useEffect(() => {
    async function loadMentors() {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");

        if (!token || user?.role !== "student") {
          throw new Error("Student account se login karo.");
        }

        const response = await fetch(`${API}/bookings/mentors`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Mentors load nahi hue.");
        }

        setMentors(data.mentors || []);
      } catch (error) {
        setErrorMessage(error.message || "Mentors load nahi hue.");
      }
    }

    loadMentors();
  }, []);

  async function handlePayment() {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!token || user?.role !== "student") {
        throw new Error("Student account se dobara login karo.");
      }

      if (!mentorId) {
        throw new Error("Mentor select karo.");
      }

      if (!sessionDate || new Date(sessionDate) <= new Date()) {
        throw new Error("Future session date aur time select karo.");
      }

      // Step 1: Backend par booking aur Razorpay order create karo
      const response = await fetch(`${API}/payments/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: user._id || user.id,
          mentorId,
          sessionDate: new Date(sessionDate).toISOString(),
          amountPaise: AMOUNT_PAISE,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Booking order create nahi hua.");
      }

      if (!data.keyId || !data.order?.id) {
        throw new Error("Razorpay key ya order ID response mein nahi mili.");
      }

      // Step 2: Razorpay Checkout load karo
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error("Razorpay Checkout load nahi hua. Internet check karo.");
      }

      // Step 3: Payment verify karne ke liye Checkout kholo
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || "INR",
        name: "THRONE8",
        description: "Mentorship Session",
        order_id: data.order.id,

        handler: async function (paymentResponse) {
          setLoading(true);
          setErrorMessage("");
          setMessage("Payment mila hai. Backend verification ho rahi hai...");

          try {
            const verifyResponse = await fetch(`${API}/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message ||
                  "Payment verify nahi hua. Payment status check karo."
              );
            }

            setMessage(
              "Payment successfully verified! THRONE8 mentorship booking confirm ho gayi."
            );
          } catch (error) {
            setErrorMessage(error.message || "Payment verification failed.");
            setMessage("");
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setMessage("Checkout band hua. Payment status backend se check karna.");
            setLoading(false);
          },
        },

        prefill: {
          name: user.name || "",
          email: user.email || "",
        },

        theme: {
          color: "#6d28d9",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (failure) {
        setErrorMessage(
          failure.error?.description || "Payment failed. Dobara try karo."
        );
        setMessage("");
        setLoading(false);
      });

      checkout.open();
    } catch (error) {
      setErrorMessage(error.message || "Booking/payment failed.");
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
      <div style={styles.logo}>
  THRONE<span style={styles.logoAccent}>8</span>
</div>
        <p style={styles.tagline}>YOUR GROWTH. YOUR MENTOR.</p>

        <h1 style={styles.heading}>Book a Mentorship Session</h1>
        <p style={styles.subtitle}>
          Choose your mentor and schedule your session.
        </p>

        <div style={styles.priceBox}>
          <div>
            <p style={styles.priceLabel}>SESSION FEE</p>
            <h2 style={styles.price}>₹1,000</h2>
          </div>
          <span style={styles.secure}>🔒 Secure checkout</span>
        </div>

        <label style={styles.label} htmlFor="mentor">
          Select verified mentor
        </label>
        <select
          id="mentor"
          value={mentorId}
          onChange={(event) => setMentorId(event.target.value)}
          style={styles.input}
        >
          <option value="">Choose a mentor</option>
          {mentors.map((mentor) => (
            <option key={mentor._id} value={mentor._id}>
              {mentor.name} ({mentor.email})
            </option>
          ))}
        </select>

        <label style={styles.label} htmlFor="sessionDate">
          Session date and time
        </label>
        <input
          id="sessionDate"
          type="datetime-local"
          value={sessionDate}
          min={minSessionDate}
          onChange={(event) => setSessionDate(event.target.value)}
          style={styles.input}
        />

        {errorMessage && (
          <div style={styles.error}>{errorMessage}</div>
        )}

        {message && (
          <div style={styles.success}>{message}</div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.65 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Please wait..." : "Proceed to Secure Payment →"}
        </button>

        <p style={styles.footer}>
          Razorpay Test Mode · No real payment should be made
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px 16px",
    background: "linear-gradient(135deg, #080b16 0%, #15132b 55%, #241447 100%)",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    boxSizing: "border-box",
    padding: "36px",
    background: "linear-gradient(145deg, #191d2e, #111421)",
    border: "1px solid #34314e",
    borderRadius: "22px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
    color: "#f8fafc",
  },
  logo: {
    fontSize: "30px",
    fontWeight: 900,
    letterSpacing: "4px",
    color: "#ffffff",
  },
  logoAccent: {
    color: "#a78bfa",
  },
  tagline: {
    marginTop: "7px",
    marginBottom: "32px",
    fontSize: "10px",
    letterSpacing: "3px",
    color: "#a78bfa",
    fontWeight: 700,
  },
  heading: {
    margin: "0 0 10px",
    fontSize: "27px",
    lineHeight: 1.3,
    color: "#ffffff",
  },
  subtitle: {
    margin: "0 0 26px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#a6aec2",
  },
  priceBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "20px",
    marginBottom: "28px",
    background: "linear-gradient(120deg, #292044, #201b35)",
    border: "1px solid #514071",
    borderRadius: "14px",
  },
  priceLabel: {
    margin: 0,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "2px",
    color: "#c4b5fd",
  },
  price: {
    margin: "8px 0 0",
    fontSize: "34px",
    fontWeight: 800,
    color: "#ffffff",
  },
  secure: {
    fontSize: "11px",
    color: "#c4b5fd",
    textAlign: "right",
  },
  label: {
    display: "block",
    marginBottom: "9px",
    fontSize: "13px",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    padding: "14px",
    marginBottom: "22px",
    border: "1px solid #3a4055",
    borderRadius: "10px",
    background: "#0e1220",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    colorScheme: "dark",
  },
  button: {
    width: "100%",
    padding: "16px",
    marginTop: "4px",
    border: "1px solid #a78bfa",
    borderRadius: "11px",
    background: "linear-gradient(100deg, #7c3aed, #6d28d9)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
    transition: "all 0.2s ease",
  },
  error: {
    marginBottom: "16px",
    padding: "13px",
    border: "1px solid #7f1d1d",
    borderRadius: "9px",
    background: "#35151d",
    color: "#fca5a5",
    fontSize: "13px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  success: {
    marginBottom: "16px",
    padding: "13px",
    border: "1px solid #166534",
    borderRadius: "9px",
    background: "#102a22",
    color: "#86efac",
    fontSize: "13px",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },
  footer: {
    margin: "20px 0 0",
    textAlign: "center",
    fontSize: "11px",
    lineHeight: 1.6,
    color: "#929bb0",
  },
};
export default Payment;