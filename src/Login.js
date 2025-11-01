import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminPopup, setAdminPopup] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      navigate("/game");
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  const handleAdminLogin = () => {
    if (adminUser === "madangowdasp" && adminPass === "Madan@123") {
      alert("Admin Login Successful!");
      navigate("/admin");
    } else {
      alert("Invalid Admin Credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Player Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>

        <p>
          New here? <span onClick={() => navigate("/signup")}>Sign up</span>
        </p>
      </div>

      {/* Side Admin Button */}
      <button className="admin-side-btn" onClick={() => setAdminPopup(true)}>
        Admin
      </button>

      {/* Admin Popup */}
      {adminPopup && (
        <div className="admin-popup">
          <div className="admin-popup-content">
            <h3>Admin Login</h3>
            <input
              type="text"
              placeholder="Admin Username"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
            />
            <input
              type="password"
              placeholder="Admin Password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
            />
            <div className="admin-btns">
              <button onClick={handleAdminLogin}>Login</button>
              <button onClick={() => setAdminPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
