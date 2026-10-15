
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/v1/payments";

function formatRupees(paise = 0) {
  return (Number(paise || 0) / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export default function Earnings() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const mentorId = user?._id || user?.id || user?.userId;

  useEffect(() => {
    let active = true;

    async function loadEarnings() {
      try {
        const token = localStorage.getItem("token");

        if (!token || !mentorId) {
          throw new Error("Please login again to view your earnings.");
        }

        const response = await axios.get(
          `${API}/earnings/${mentorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (active) setData(response.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Earnings load nahi hui."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEarnings();

    return () => {
      active = false;
    };
  }, [mentorId]);

  if (loading) {
    return (
      <div style={styles.page}>
        <p>Loading earnings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <h2>My Earnings</h2>
        <p style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  const totals = data?.totalByStatus || {};

  // Recorded mentor earnings are the amount after platform commission.
  const mentorSharePaise = Object.values(totals).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  // At a 20% platform commission, mentor share is 80%.
  const platformCommissionPaise = Math.round(
    (mentorSharePaise * 20) / 80
  );

  const commissionCards = [
    {
      title: "Platform Commission (20%)",
      amount: platformCommissionPaise,
      color: "#fbbf24",
    },
    {
      title: "Mentor Share (80%)",
      amount: mentorSharePaise,
      color: "#34d399",
    },
  ];

  const cards = [
    {
      title: "Pending",
      amount: totals.pendingPaise,
      color: "#fbbf24",
    },
    {
      title: "On Hold",
      amount: totals.onHoldPaise,
      color: "#fb923c",
    },
    {
      title: "Eligible",
      amount: totals.eligiblePaise,
      color: "#34d399",
    },
    {
      title: "Paid Out",
      amount: totals.paidPaise,
      color: "#60a5fa",
    },
    {
      title: "Reversed",
      amount: totals.reversedPaise,
      color: "#f87171",
    },
  ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>THRONE8 MENTOR PORTAL</p>
          <h1 style={styles.heading}>My Earnings</h1>
          <p style={styles.subtitle}>
            Track your mentorship earnings and payout status.
          </p>
        </div>

        <button
          style={styles.button}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </header>

      <h2 style={styles.sectionHeading}>Commission Overview</h2>

      <section style={{ ...styles.grid, marginBottom: "28px" }}>
        {commissionCards.map((card) => (
          <article key={card.title} style={styles.card}>
            <p style={styles.cardTitle}>{card.title}</p>
            <h2 style={{ ...styles.amount, color: card.color }}>
              {formatRupees(card.amount)}
            </h2>
          </article>
        ))}
      </section>

      <h2 style={styles.sectionHeading}>Earnings Status</h2>

      <section style={styles.grid}>
        {cards.map((card) => (
          <article key={card.title} style={styles.card}>
            <p style={styles.cardTitle}>{card.title}</p>
            <h2 style={{ ...styles.amount, color: card.color }}>
              {formatRupees(card.amount)}
            </h2>
          </article>
        ))}
      </section>

      <section style={styles.panel}>
        <h2 style={styles.sectionHeading}>Earning Summary</h2>
        <p style={styles.subtitle}>
          Status-wise recorded mentor earnings after platform commission.
        </p>

        {cards.every((card) => Number(card.amount || 0) === 0) ? (
          <p style={styles.empty}>
            No earnings recorded yet. A verified payment and linked
            booking are required before earnings appear here.
          </p>
        ) : (
          <div style={styles.summary}>
            {cards.map((card) => (
              <div key={card.title} style={styles.row}>
                <span>{card.title}</span>
                <strong>{formatRupees(card.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={styles.note}>
        Final earnings and payouts depend on verified payments,
        booking completion, and refund checks.
      </p>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a1020",
    color: "#e5edf7",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "28px",
  },
  eyebrow: {
    color: "#60a5fa",
    fontSize: "12px",
    letterSpacing: "2px",
  },
  heading: {
    fontSize: "32px",
    margin: "8px 0",
  },
  subtitle: {
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  button: {
    background: "#2563eb",
    color: "white",
    border: 0,
    borderRadius: "8px",
    padding: "12px 18px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#111b30",
    border: "1px solid #25334c",
    borderRadius: "12px",
    padding: "20px",
    minWidth: 0,
    boxSizing: "border-box",
  },
  cardTitle: {
    color: "#94a3b8",
    margin: 0,
  },
  amount: {
    fontSize: "24px",
    overflowWrap: "anywhere",
  },
  sectionHeading: {
    marginTop: "0",
    marginBottom: "16px",
  },
  panel: {
    marginTop: "28px",
    padding: "24px",
    background: "#111b30",
    border: "1px solid #25334c",
    borderRadius: "12px",
  },
  empty: {
    padding: "18px 0",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  summary: {
    marginTop: "20px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "14px 0",
    borderBottom: "1px solid #25334c",
  },
  note: {
    marginTop: "20px",
    color: "#94a3b8",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};
