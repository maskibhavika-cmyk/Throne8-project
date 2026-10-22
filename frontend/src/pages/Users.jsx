
// import { useEffect, useState } from "react";
// import axios from "axios";
// import "./Users.css";

// function Users() {
//   const [users, setUsers] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState("all");

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       setError("Please login to access users.");
//       setLoading(false);
//       return;
//     }

//     axios
//       .get("http://localhost:5000/api/v1/admin/users", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       })
//       .then((res) => {
//         setUsers(Array.isArray(res.data.users) ? res.data.users : []);
//       })
//       .catch((err) => {
//         setError(
//           err.response?.data?.message || "Users load nahi hue."
//         );
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   const filteredUsers = users.filter((user) => {
//     const name = user.name || "";
//     const email = user.email || "";
//     const role = user.role || "";

//     const matchesSearch = `${name} ${email} ${role}`
//       .toLowerCase()
//       .includes(search.trim().toLowerCase());

//     const matchesRole =
//       roleFilter === "all" || role.toLowerCase() === roleFilter;

//     return matchesSearch && matchesRole;
//   });

//   if (loading) {
//     return <p className="users-message">Loading users...</p>;
//   }

//   if (error) {
//     return <p className="users-error">{error}</p>;
//   }

//   return (
//     <div className="users-page">
//       <header className="users-header">
//         <div>
//           <span className="users-eyebrow">THRONE8 / ADMIN</span>
//           <h1>Users Management</h1>
//           <p>View and manage registered platform users.</p>
//         </div>

//         <div className="users-total">
//           <span>👥</span>
//           <div>
//             <small>Total Users</small>
//             <h2>{users.length}</h2>
//           </div>
//         </div>
//       </header>

//       <section className="users-panel">
//         <div className="users-panel-heading">
//           <div>
//             <h2>All Users</h2>
//             <p>Registered accounts on THRONE8</p>
//           </div>

//           <div className="users-filters">
//             <input
//               className="users-search"
//               type="search"
//               placeholder="Search name, email or role..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               aria-label="Search users"
//             />

//             <select
//               className="users-role-filter"
//               value={roleFilter}
//               onChange={(e) => setRoleFilter(e.target.value)}
//               aria-label="Filter users by role"
//             >
//               <option value="all">All Roles</option>
//               <option value="student">Student</option>
//               <option value="mentor">Mentor</option>
//               <option value="admin">Admin</option>
//             </select>
//           </div>
//         </div>

//         <div className="users-table-wrap">
//           <table className="users-table">
//             <thead>
//               <tr>
//                 <th>USER</th>
//                 <th>EMAIL ADDRESS</th>
//                 <th>ROLE</th>
//                 <th>STATUS</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filteredUsers.map((user) => (
//                 <tr key={user._id}>
//                   <td>
//                     <div className="user-name-cell">
//                       <div className="user-avatar">
//                         {(user.name || "U").charAt(0).toUpperCase()}
//                       </div>
//                       <strong>{user.name || "Unknown User"}</strong>
//                     </div>
//                   </td>

//                   <td>{user.email || "N/A"}</td>

//                   <td>
//                     <span
//                       className={`role-badge ${(user.role || "unknown")
//                         .toLowerCase()
//                         .replace(/[^a-z0-9_-]/g, "")}`}
//                     >
//                       {user.role || "Unknown"}
//                     </span>
//                   </td>

//                   <td>
//                     <span className="user-status">
//                       <span className="status-dot"></span>
//                       Registered
//                     </span>
//                   </td>
//                 </tr>
//               ))}

//               {filteredUsers.length === 0 && (
//                 <tr>
//                   <td colSpan="4" className="users-empty">
//                     No users match your search or selected role.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="users-table-footer">
//           Showing {filteredUsers.length} of {users.length} users
//         </div>
//       </section>
//     </div>
//   );
// }

// export default Users;
import { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");

   if (!token) {
  window.location.href = "/login";
  return;
}

    axios
      .get("http://localhost:5000/api/v1/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        if (active) {
          setUsers(Array.isArray(res.data.users) ? res.data.users : []);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || "Users load nahi hue."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = users.filter((user) => {
    const name = user.name || "";
    const email = user.email || "";
    const role = user.role || "";

    const matchesSearch = `${name} ${email} ${role}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesRole =
      roleFilter === "all" || role.toLowerCase() === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <p className="users-message">Loading users...</p>;
  }

  if (error) {
    return <p className="users-error">{error}</p>;
  }

  return (
    <div className="users-page">
      <header className="users-header">
        <div>
          <span className="users-eyebrow">THRONE8 / ADMIN</span>
          <h1>Users Management</h1>
          <p>View and manage registered platform users.</p>
        </div>

        <div className="users-total">
          <span>👥</span>
          <div>
            <small>Total Users</small>
            <h2>{users.length}</h2>
          </div>
        </div>
      </header>

      <section className="users-panel">
        <div className="users-panel-heading">
          <div>
            <h2>All Users</h2>
            <p>Registered accounts on THRONE8</p>
          </div>

          <div className="users-filters">
            <input
              className="users-search"
              type="search"
              placeholder="Search name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users"
            />

            <select
              className="users-role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter users by role"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>EMAIL ADDRESS</th>
                <th>ROLE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <strong>{user.name || "Unknown User"}</strong>
                    </div>
                  </td>

                  <td>{user.email || "N/A"}</td>

                  <td>
                    <span
                      className={`role-badge ${(user.role || "unknown")
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, "")}`}
                    >
                      {user.role || "Unknown"}
                    </span>
                  </td>

                  <td>
                    <span className="user-status">
                      <span className="status-dot"></span>
                      Registered
                    </span>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="users-empty">
                    No users match your search or selected role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="users-table-footer">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </section>
    </div>
  );
}

export default Users;