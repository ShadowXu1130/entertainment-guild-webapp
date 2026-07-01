import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  )

  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoggedIn(
        localStorage.getItem("isLoggedIn") === "true"
      )

      setIsAdmin(
        localStorage.getItem("isAdmin") === "true"
      )
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const getProfilePath = () => {
    if (!isLoggedIn) {
      return "/login"
    }

    if (isAdmin) {
      return "/admin"
    }

    return "/profile"
  }

  return (
    <div>
      <div className="top-bar">
        <Link to="/cart">Shopping Cart</Link>

        <h2>Entertainment Guild</h2>

        {isLoggedIn ? (
          <Link to={getProfilePath()}>
            Profile
          </Link>
        ) : (
          <Link to="/login">
            Login
          </Link>
        )}
      </div>

      <div className="menu-bar">
        <Link to="/">Home</Link>
        <Link to="/movies">Movies</Link>
        <Link to="/games">Games</Link>
        <Link to="/products">Books</Link>
      </div>
    </div>
  )
}

export default Navbar