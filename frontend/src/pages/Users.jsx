
import { useEffect, useState } from "react";
import axios from "axios";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/v1/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => setUsers(res.data.users))
      .catch((err) =>
        setError(
          err.response?.data?.message || "Users load nahi hue"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <p className="users-message">Loading users...</p>;
  if (error) return <p className="users-error">{error}</p>;

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

          <input
            className="users-search"
            type="text"
            placeholder="Search name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                      <strong>{user.name}</strong>
                    </div>
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
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
                    No users found.
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