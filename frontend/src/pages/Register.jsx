import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage("")

    try {
      const response = await fetch("/api-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          name,
          password
        })
      })

      const text = await response.text()

      if (!response.ok) {
        if (text.includes("duplicate")) {
          setMessage("Username already exists")
        } else {
          setMessage(text || "Registration failed")
        }
        return
      }

      setMessage("Registration successful. Redirecting to login...")

      setTimeout(() => {
        navigate("/login")
      }, 1000)
    } catch (error) {
      console.error(error)
      setMessage("Connection failed. Check browser console.")
    }
  }

  return (
    <div className="login-page">
      <div className="login-icon">
        <span>📝</span>
      </div>

      <h1 className="login-title">Create Account</h1>

      <p className="login-subtitle">
        Register as a customer to start shopping
      </p>

      <form className="login-card" onSubmit={handleRegister}>
        <label className="login-input-label">Name</label>

        <input
          className="login-input"
          type="text"
          placeholder="Enter full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          Register
        </button>

        <button
          type="button"
          className="login-submit secondary-login-btn"
          onClick={() => navigate("/login")}
        >
          Back to Sign In
        </button>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}

export default Register