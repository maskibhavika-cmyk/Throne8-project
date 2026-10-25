import { useEffect, useState } from "react";

export default function Payouts() {
  const [summary, setSummary] = useState({ availableBalance: 0, totalPaidOut: 0, pendingCount: 0, pendingAmount: 0 });
  const [history, setHistory] = useState([]);
  const mentorId = localStorage.getItem("mentorId");

  useEffect(() => {
    const loadData = async () => {
      if (!mentorId) return;
      const sRes = await fetch(`http://localhost:5000/api/payouts/summary?mentorId=${mentorId}`);
      setSummary(await sRes.json());
      const hRes = await fetch(`http://localhost:5000/api/payouts?mentorId=${mentorId}`);
      const hData = await hRes.json();
      setHistory(Array.isArray(hData) ? hData : []);
    };
    loadData();
  }, [mentorId]);

  const load = async () => {
    const sRes = await fetch(`http://localhost:5000/api/payouts/summary?mentorId=${mentorId}`);
    setSummary(await sRes.json());
    const hRes = await fetch(`http://localhost:5000/api/payouts?mentorId=${mentorId}`);
    const hData = await hRes.json();
    setHistory(Array.isArray(hData) ? hData : []);
  };

  const requestPayout = async () => {
    await fetch(`http://localhost:5000/api/payouts/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId })
    });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">MENTOR FINANCE</h1>
        <button onClick={load} className="border px-4 py-2 rounded">↻ Refresh</button>
      </div>
      <p className="text-gray-500 mb-6">Track your earnings and payout activity in one place.</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Available balance</p>
          <p className="text-3xl font-bold">₹{summary.availableBalance.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Currently available</p>
        </div>
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Total paid out ↗</p>
          <p className="text-3xl font-bold">₹{summary.totalPaidOut.toFixed(2)}</p>
          <p className="text-xs text-gray-400">Based on listed payout records</p>
        </div>
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Payout activity ◷</p>
          <p className="text-3xl font-bold">{summary.pendingCount}</p>
          <p className="text-xs text-gray-400">Pending or processing (₹{summary.pendingAmount})</p>
        </div>
      </div>

      <button onClick={requestPayout} className="bg-black text-white px-6 py-3 rounded-lg mb-6">
        Request Payout
      </button>

      <h2 className="font-semibold mb-2">Payout history</h2>
      <p className="text-sm text-gray-500 mb-4">Your recorded payout transactions</p>

      {history.length === 0 ? (
        <div className="border rounded-xl p-10 text-center text-gray-500">
          <p className="text-4xl mb-2">₹</p>
          <p>No payouts yet</p>
          <p className="text-sm">Your payout transactions will appear here once they are recorded.</p>
        </div>
      ) : (
        <table className="w-full border rounded-xl">
          <thead><tr className="text-left text-gray-500 text-sm">
            <th className="p-3">Date</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">UTR</th>
          </tr></thead>
          <tbody>
            {history.map(p => (
              <tr key={p._id} className="border-t">
                <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-3 font-bold">₹{(p.amountPaise/100).toFixed(2)}</td>
                <td className="p-3"><span className="border px-2 py-1 rounded-full text-xs">{p.status}</span></td>
                <td className="p-3">{p.providerPayoutId || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-center text-xs text-gray-400 mt-6">THRONE8 · Mentor dashboard<br/>Amounts displayed in INR</p>
    </div>
  );
}