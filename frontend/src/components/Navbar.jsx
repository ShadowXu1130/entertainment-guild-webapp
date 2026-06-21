import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoggedIn(
        localStorage.getItem("isLoggedIn") === "true"
      )
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="top-bar">
        <Link to="/cart">Shopping Cart</Link>

        <h2>Entertainment Guild</h2>

        {isLoggedIn ? (
          <Link to="/profile">Profile</Link>
        ) : (
          <Link to="/login">Login</Link>
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