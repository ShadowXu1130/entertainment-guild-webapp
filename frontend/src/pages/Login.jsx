import { useState } from "react";
import { useNavigate } from "react-router-dom"

function Login() {
  const [userType, setUserType] = useState("customer");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessage(errorText || "Invalid username or password");
        return;
      }

      const user = await response.json();

      const selectedIsAdmin = userType === "admin";

      if (user.isAdmin !== selectedIsAdmin) {
        setMessage(
          `This account is ${
            user.isAdmin ? "Admin" : "Customer"
          }, not ${userType}`
        );
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userID", user.id);
      localStorage.setItem("username", user.username);
      localStorage.setItem("userType", userType);
      localStorage.setItem("isAdmin", user.isAdmin);

      setMessage(`Welcome ${user.username}`);

      // Redirect after successful login
      window.location.href = "/"
    } catch (error) {
      console.error(error);
      setMessage("Connection failed. Check browser console.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-icon">
        <span>👤</span>
      </div>

      <h1 className="login-title">Sign in</h1>

      <p className="login-subtitle">
        Choose your account type and enter your credentials
      </p>

      <form className="login-card" onSubmit={handleLogin}>
        <label className="login-section-label">
          ACCOUNT TYPE
        </label>

        <div className="login-switch">
          <button
            type="button"
            className={userType === "customer" ? "active" : ""}
            onClick={() => setUserType("customer")}
          >
            Customer
          </button>

          <button
            type="button"
            className={userType === "admin" ? "active" : ""}
            onClick={() => setUserType("admin")}
          >
            Admin
          </button>
        </div>

        <label className="login-input-label">
          Username
        </label>

        <input
          className="login-input"
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="login-input-label">
          Password
        </label>

        <input
          className="login-input"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="login-submit"
        >
          Sign In
        </button>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default Login;