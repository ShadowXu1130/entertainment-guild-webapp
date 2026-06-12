import { Link } from "react-router-dom"

function Navbar() {
  return (
    <div>
      <div className="top-bar">
        <Link to="/cart">Shopping Cart</Link>

        <h2>Entertainment Guild</h2>

        <Link to="/login">Login / Settings</Link>
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