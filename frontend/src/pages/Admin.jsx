import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Admin() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState("products")

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    const isAdmin = localStorage.getItem("isAdmin") === "true"

    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (!isAdmin) {
      navigate("/")
      return
    }

    fetch("/api/inft3050/Product?limit=300")
      .then((res) => res.json())
      .then((data) => setProducts(data.list || []))
      .catch((err) => console.log(err))

    fetch("/api/inft3050/User?limit=300")
      .then((res) => res.json())
      .then((data) => setUsers(data.list || []))
      .catch((err) => console.log(err))
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">AD</div>
        <div>
          <h1>Admin Dashboard</h1>
          <p>@{localStorage.getItem("username")}</p>
        </div>
      </div>

      <div className="profile-info-grid">
        <div className="profile-info-card">
          <p>Total Products</p>
          <h3>{products.length}</h3>
        </div>

        <div className="profile-info-card">
          <p>Total Users</p>
          <h3>{users.length}</h3>
        </div>
      </div>

      <div className="profile-list-card">
        <h2>Admin Controls</h2>

        <div className="admin-tabs">
          <button
            className={activeTab === "products" ? "active" : ""}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>

          <button
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <div className="profile-list-card">
          <h2>Product Management</h2>

          {products.slice(0, 30).map((product) => (
            <div className="profile-list-row" key={product.ID}>
              <span>{product.Name}</span>
              <span>#{product.ID}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "users" && (
        <div className="profile-list-card">
          <h2>User Management</h2>

          {users.map((user) => (
            <div className="profile-list-row" key={user.UserID}>
              <span>{user.UserName}</span>
              <span>{user.IsAdmin ? "Admin" : "Customer"}</span>
            </div>
          ))}
        </div>
      )}

      <button className="profile-logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  )
}

export default Admin