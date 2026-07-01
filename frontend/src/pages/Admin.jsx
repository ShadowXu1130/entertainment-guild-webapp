import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Admin() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [stocktake, setStocktake] = useState([])
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState("users")
  const [search, setSearch] = useState("")

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A"
    if (typeof value === "object") {
      return value.Name || value.name || value.ID || value.id || "N/A"
    }
    return String(value)
  }

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

    fetch("/api/inft3050/Stocktake?limit=300")
      .then((res) => res.json())
      .then((data) => setStocktake(data.list || []))
      .catch((err) => console.log(err))

    fetch("/api/inft3050/Orders?limit=300")
      .then((res) => res.json())
      .then((data) => setOrders(data.list || []))
      .catch((err) => console.log(err))
  }, [navigate])

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const matchesSearch = (values) =>
    values.some((value) =>
      safeText(value).toLowerCase().includes(search.toLowerCase())
    )

  const filteredProducts = products.filter((product) =>
    matchesSearch([
      product.ID,
      product.Name,
      product.Author,
      product.Genre,
      product.SubGenre
    ])
  )

  const filteredUsers = users.filter((user) =>
    matchesSearch([user.UserID, user.UserName, user.Name, user.Email])
  )

  const filteredStocktake = stocktake.filter((item) =>
    matchesSearch([
      item.ItemId,
      item.ItemID,
      item.ProductId,
      item.ProductID,
      item.Quantity,
      item.Price
    ])
  )

  const filteredOrders = orders.filter((order, index) =>
    matchesSearch([
      order.orderID,
      order.OrderID,
      index + 1,
      order.customer,
      order.Customer,
      order.Suburb,
      order.State
    ])
  )

  const changeTab = (tab) => {
    setActiveTab(tab)
    setSearch("")
  }

  const username = localStorage.getItem("username") || "admin"

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">EG</div>
          <div>
            <h2>Entertainment Guild</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className={activeTab === "users" ? "active" : ""} onClick={() => changeTab("users")}>Users</button>
          <button className={activeTab === "products" ? "active" : ""} onClick={() => changeTab("products")}>Products</button>
          <button className={activeTab === "stocktake" ? "active" : ""} onClick={() => changeTab("stocktake")}>Stocktake</button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => changeTab("orders")}>Orders</button>
        </nav>

        <button className="admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {username}</p>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">AD</div>
            <div>
              <strong>{username}</strong>
              <p>Administrator</p>
            </div>
          </div>
        </header>

        <section className="admin-cards">
          <div className="admin-card">
            <p>Total Products</p>
            <h2>{products.length}</h2>
            <span>Items in catalog</span>
          </div>

          <div className="admin-card">
            <p>Total Users</p>
            <h2>{users.length}</h2>
            <span>Registered users</span>
          </div>

          <div className="admin-card">
            <p>Stock Records</p>
            <h2>{stocktake.length}</h2>
            <span>Inventory records</span>
          </div>

          <div className="admin-card">
            <p>Total Orders</p>
            <h2>{orders.length}</h2>
            <span>Customer orders</span>
          </div>
        </section>

        <section className="admin-table-card">
          <div className="admin-table-header">
            <div className="admin-tabs-clean">
              <button className={activeTab === "users" ? "active" : ""} onClick={() => changeTab("users")}>Users</button>
              <button className={activeTab === "products" ? "active" : ""} onClick={() => changeTab("products")}>Products</button>
              <button className={activeTab === "stocktake" ? "active" : ""} onClick={() => changeTab("stocktake")}>Stocktake</button>
              <button className={activeTab === "orders" ? "active" : ""} onClick={() => changeTab("orders")}>Orders</button>
            </div>

            <input
              className="admin-search"
              type="text"
              placeholder="Search current section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === "users" && (
            <div>
              <h2>User Management</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.UserID}>
                      <td>{safeText(user.UserName)}</td>
                      <td>{safeText(user.Name)}</td>
                      <td>
                        <span className={user.IsAdmin ? "badge admin" : "badge"}>
                          {user.IsAdmin ? "Admin" : "Customer"}
                        </span>
                      </td>
                      <td>#{safeText(user.UserID)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "products" && (
            <div>
              <h2>Product Management</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Sub Genre</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.slice(0, 50).map((product) => (
                    <tr key={product.ID}>
                      <td>{safeText(product.Name)}</td>
                      <td>{safeText(product.Author)}</td>
                      <td>{safeText(product.Genre)}</td>
                      <td>{safeText(product.SubGenre)}</td>
                      <td>#{safeText(product.ID)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "stocktake" && (
            <div>
              <h2>Inventory / Stocktake</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Product ID</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocktake.slice(0, 50).map((item, index) => (
                    <tr key={index}>
                      <td>#{safeText(item.ItemId || item.ItemID)}</td>
                      <td>{safeText(item.ProductId || item.ProductID)}</td>
                      <td>{safeText(item.Quantity)}</td>
                      <td>S${safeText(item.Price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h2>Order Management</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={index}>
                      <td>#{safeText(order.orderID || order.OrderID || index + 1)}</td>
                      <td>{safeText(order.customer || order.Customer)}</td>
                      <td>{safeText(order.StreetAddress || order.streetAddress)}</td>
                      <td>{safeText(order.State || order.state)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Admin