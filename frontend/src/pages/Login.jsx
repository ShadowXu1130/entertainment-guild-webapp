import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login() {
  const navigate = useNavigate()

  const [userType, setUserType] = useState("customer")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const cleanName = (name) => {
    return String(name || "")
      .replace(/\s+employee$/i, "")
      .replace(/\s+admin$/i, "")
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage("")

    try {
      const response = await fetch("/api-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      if (!response.ok) {
        setMessage("Invalid username or password")
        return
      }

      const loginUser = await response.json()

      const profileResponse = await fetch(
        `/api-profile-user/${loginUser.username}`
      )

      if (!profileResponse.ok) {
        setMessage("Login succeeded, but profile loading failed.")
        return
      }

      const profileUser = await profileResponse.json()

      const isAdmin = loginUser.isAdmin === true
      const isEmployee =
        !isAdmin &&
        String(profileUser.Name || "")
          .toLowerCase()
          .endsWith(" employee")

      if (userType === "admin" && !isAdmin) {
        setMessage("This account is not an Admin account.")
        return
      }

      if (userType === "employee" && !isEmployee) {
        setMessage("This account is not an Employee account.")
        return
      }

      if (userType === "customer" && (isAdmin || isEmployee)) {
        setMessage("This account is not a Customer account.")
        return
      }

      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("userID", loginUser.id)
      localStorage.setItem("username", loginUser.username)
      localStorage.setItem("name", cleanName(profileUser.Name))
      localStorage.setItem("email", profileUser.Email || "")
      localStorage.setItem("userType", userType)
      localStorage.setItem("isAdmin", isAdmin)

      if (userType === "admin") {
        navigate("/admin")
      } else if (userType === "employee") {
        navigate("/employee")
      } else {
        navigate("/")
      }
    } catch (error) {
      console.error(error)
      setMessage("Connection failed. Check browser console.")
    }
  }

  return (
    <div className="login-page">
      <div className="login-icon">
        <span>👤</span>
      </div>

      <h1 className="login-title">Sign In</h1>

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
            className={userType === "employee" ? "active" : ""}
            onClick={() => setUserType("employee")}
          >
            Employee
          </button>

          <button
            type="button"
            className={userType === "admin" ? "active" : ""}
            onClick={() => setUserType("admin")}
          >
            Admin
          </button>
        </div>

        <label className="login-input-label">Username</label>

        <input
          className="login-input"
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <label className="login-input-label">Password</label>

        <input
          className="login-input"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="login-submit">
          Sign In
        </button>

        {userType === "customer" && (
          <button
            type="button"
            className="login-submit secondary-login-btn"
            onClick={() => navigate("/register")}
          >
            Create Customer Account
          </button>
        )}

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}

export default Login