// import { useEffect, useState } from "react";
// import "./Bookings.css";

// const Bookings = () => {
//   const [bookings, setBookings] = useState([]);
//   const [filter, setFilter] = useState("All");
//   const [loading, setLoading] = useState(true);
//   const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

//   useEffect(() => {
//     const fetchBookings = async () => {
//       try {
//         const res = await fetch(`${API}/bookings/my`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         const data = await res.json();
//         if (data.success) {
//           setBookings(data.bookings || []);
//         }
//       } catch (err) {
//         console.error("Booking fetch error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchBookings();
//   }, [API]);

//   const filteredBookings =
//     filter === "All" ? bookings : bookings.filter((b) => b.status === filter);

//   if (loading) {
//     return <div className="booking-page"><p className="empty-msg">Loading bookings...</p></div>;
//   }

//   return (
//     <div className="booking-page">
//       <h1 className="booking-title">My Bookings</h1>
//       <p className="booking-subtitle">Track, manage and join your sessions</p>

//       <div className="stats-row">
//         <div className="stat-box">
//           <h3>{bookings.length}</h3>
//           <p>Total Bookings</p>
//         </div>
//         <div className="stat-box">
//           <h3>{bookings.filter((b) => b.status === "Confirmed").length}</h3>
//           <p>Upcoming</p>
//         </div>
//         <div className="stat-box">
//           <h3>{bookings.filter((b) => b.status === "Completed").length}</h3>
//           <p>Completed</p>
//         </div>
//       </div>

//       <div className="filter-row">
//         {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map((f) => (
//           <button
//             key={f}
//             className={`filter-btn ${filter === f ? "active" : ""}`}
//             onClick={() => setFilter(f)}
//           >
//             {f}
//           </button>
//         ))}
//       </div>

//       {filteredBookings.length === 0 ? (
//         <div className="empty-msg">No bookings found for "{filter}"</div>
//       ) : (
//         <div className="booking-list">
//           {filteredBookings.map((b) => (
//             <div key={b._id} className="booking-card">
//               <div className="card-header">
//                 <div>
//                   <h3>{b.mentorName || b.mentor?.name || "Mentor Session"}</h3>
//                   <span className="service">{b.service || b.sessionType || "1:1 Session"}</span>
//                 </div>
//                 <span className={`status-badge ${b.status?.toLowerCase()}`}>
//                   {b.status}
//                 </span>
//               </div>

//               <div className="card-details">
//                 <span>Date: {b.date ? new Date(b.date).toLocaleDateString() : "-"}</span>
//                 <span>Time: {b.time || "-"}</span>
//                 <span>Payment: {b.paymentStatus || "Paid"}</span>
//               </div>

//               <div className="card-actions">
//                 {b.status === "Confirmed" && (
//                   <button className="btn-join">Join Session</button>
//                 )}
//                 {b.status === "Pending" && (
//                   <button className="btn-pay">Complete Payment</button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Bookings;