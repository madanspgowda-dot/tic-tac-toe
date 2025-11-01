import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import "./Admin.css";

function Admin() {
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const db = getDatabase();

    // Fetch users
    const usersRef = ref(db, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.entries(data).map(([id, details]) => ({
          id,
          ...details,
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    });

    // Fetch feedbacks
    const feedbackRef = ref(db, "feedbacks");
    onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const feedbackList = Object.entries(data).map(([id, details]) => ({
          id,
          ...details,
        }));
        setFeedbacks(feedbackList);
      } else {
        setFeedbacks([]);
      }
    });
  }, []);

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      {/* Registered Users Table */}
      <div className="table-section">
        <h2>Registered Users</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Password</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || "—"}</td>
                  <td>{user.email}</td>
                  <td>{user.password || "Hidden"}</td>
                  <td>{user.createdAt || "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Feedback Table */}
      <div className="table-section">
        <h2>Feedback Details</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Phone</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.length > 0 ? (
              feedbacks.map((fb) => (
                <tr key={fb.id}>
                  <td>{fb.email}</td>
                  <td>{fb.phone}</td>
                  <td>{fb.feedback}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No feedback found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;
