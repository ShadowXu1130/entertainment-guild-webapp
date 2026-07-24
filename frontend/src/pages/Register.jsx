import { useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Customer registration page for creating a new application account.
 *
 * The form sends the user's account details to the backend registration
 * endpoint and redirects to the login page after successful registration.
 */
function Register() {
  const navigate = useNavigate()
  // ======================================================
  // State and navigation
  // ======================================================
  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  // ======================================================
  // Registration
  // ======================================================

  /**
   * Submits the completed registration form to the backend.
   *
   * Backend validation errors are displayed to the user, while a
   * successful registration redirects the customer to the login page.
   */
  const handleRegister = async (e) => {
    e.preventDefault()
    setMessage("")
      // Send the customer account details to the backend registration
      // endpoint for validation and account creation.
    try {
      const response = await fetch("/api-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          name,
          email,
          password
        })
      })

      const text = await response.text()
      // Convert known backend duplicate-account errors into a clearer
      // message for the registration form.
      if (!response.ok) {
        if (text.includes("duplicate")) {
          setMessage("Username already exists")
        } else {
          setMessage(text || "Registration failed")
        }
        return
      }

      setMessage("Registration successful. Redirecting to login...")
      // Briefly display the success message before returning the
      // customer to the login page.
      setTimeout(() => {
        navigate("/login")
      }, 1000)
    } catch (error) {
      console.error(error)
      setMessage("Connection failed. Check browser console.")
    }
  }

  // ======================================================
  // Registration page rendering
  // ======================================================

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

        <label className="login-input-label">Email</label>

        <input
          className="login-input"
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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