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
const [showEditModal, setShowEditModal] = useState(false)
const [editingProduct, setEditingProduct] = useState(null)


  const [newProduct, setNewProduct] = useState({
    Name: "",
    Author: "",
    Description: "",
    SubGenre: 1,
    Published: ""
  })

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

    loadAdminData()
  }, [navigate])

  const loadAdminData = () => {
    fetch("/api/inft3050/Product?limit=1000")
      .then((res) => res.json())
      .then((data) => setProducts(data.list || []))
      .catch((err) => console.log(err))

    fetch("/api/inft3050/User?limit=1000")
      .then((res) => res.json())
      .then((data) => setUsers(data.list || []))
      .catch((err) => console.log(err))

    fetch("/api/inft3050/Stocktake?limit=1000")
      .then((res) => res.json())
      .then((data) => setStocktake(data.list || []))
      .catch((err) => console.log(err))

    fetch("/api/inft3050/Orders?limit=1000")
      .then((res) => res.json())
      .then((data) => setOrders(data.list || []))
      .catch((err) => console.log(err))
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const handleDeleteProduct = async (productID) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete product #${productID}?`
    )

    if (!confirmDelete) return

    try {
      const response = await fetch(`/api/inft3050/Product/${productID}`, {
        method: "DELETE",
        credentials: "include"
      })

      if (!response.ok) {
        const errorText = await response.text()
        alert(errorText || "Failed to delete product")
        return
      }

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.ID !== productID)
      )

      alert("Product deleted successfully")
    } catch (error) {
      console.error(error)
      alert("Delete failed. Check browser console.")
    }
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

const handleAddProduct = async (e) => {
  e.preventDefault()

  try {
    const response = await fetch("/api-add-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Name: newProduct.Name,
        Author: newProduct.Author,
        Description: newProduct.Description,
        SubGenre: Number(newProduct.SubGenre),
        Published: newProduct.Published,
        LastUpdatedBy: username,
        LastUpdated: new Date().toISOString().split("T")[0]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      alert(errorText || "Failed to create product")
      return
    }

    setNewProduct({
      Name: "",
      Author: "",
      Description: "",
      SubGenre: 1,
      Published: ""
    })

    alert("Product created successfully")
    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Create failed")
  }
}


const handleEditProduct = (product) => {
  setEditingProduct({
    ID: product.ID,
    Name: product.Name || "",
    Author: product.Author || "",
    Description: product.Description || "",
    SubGenre: product.SubGenre || 1,
    Published: product.Published
      ? product.Published.split("T")[0]
      : ""
  })

  setShowEditModal(true)
}

const handleUpdateProduct = async () => {
  try {
    const response = await fetch(`/api-edit-product/${editingProduct.ID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Name: editingProduct.Name,
        Author: editingProduct.Author,
        Description: editingProduct.Description,
        SubGenre: Number(editingProduct.SubGenre),
        Published: editingProduct.Published,
        LastUpdatedBy: username,
        LastUpdated: new Date().toISOString().split("T")[0]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      alert(errorText || "Failed to update product")
      return
    }

    alert("Product updated successfully")
    setShowEditModal(false)
    setEditingProduct(null)
    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Update failed")
  }
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

              <form
                className="admin-product-form"
                onSubmit={handleAddProduct}
                >
                <input
                    type="text"
                    placeholder="Product Name"
                    value={newProduct.Name}
                    onChange={(e) =>
                    setNewProduct({
                        ...newProduct,
                        Name: e.target.value
                    })
                    }
                    required
                />

                <input
                    type="text"
                    placeholder="Author"
                    value={newProduct.Author}
                    onChange={(e) =>
                    setNewProduct({
                        ...newProduct,
                        Author: e.target.value
                    })
                    }
                    required
                />

                <input
                    type="number"
                    placeholder="SubGenre ID"
                    value={newProduct.SubGenre}
                    onChange={(e) =>
                    setNewProduct({
                        ...newProduct,
                        SubGenre: e.target.value
                    })
                    }
                    required
                />

                <input
                    type="date"
                    value={newProduct.Published}
                    onChange={(e) =>
                    setNewProduct({
                        ...newProduct,
                        Published: e.target.value
                    })
                    }
                    required
                />

                <textarea
                    placeholder="Description"
                    value={newProduct.Description}
                    onChange={(e) =>
                    setNewProduct({
                        ...newProduct,
                        Description: e.target.value
                    })
                    }
                />

                <button
                    type="submit"
                    className="admin-add-btn"
                >
                    Add Product
                </button>
              </form>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Author</th>
                    <th>Genre</th>
                    <th>Sub Genre</th>
                    <th>ID</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.slice().reverse().map((product) => (
                    <tr key={product.ID}>
                      <td>{safeText(product.Name)}</td>
                      <td>{safeText(product.Author)}</td>
                      <td>{safeText(product.Genre)}</td>
                      <td>{safeText(product.SubGenre)}</td>
                      <td>#{safeText(product.ID)}</td>
                      <td>
                        <button
                            className="admin-edit-btn"
                            onClick={() => handleEditProduct(product)}
                        >
                            Edit
                        </button>

                        <button
                            className="admin-delete-btn"
                            onClick={() => handleDeleteProduct(product.ID)}
                        >
                            Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <p className="profile-empty">No products found.</p>
              )}
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

      {showEditModal && editingProduct && (
        <div className="modal-overlay">
            <div className="modal">
            <h3>Edit Product</h3>

            <input
                value={editingProduct.Name}
                onChange={(e) =>
                setEditingProduct({
                    ...editingProduct,
                    Name: e.target.value
                })
                }
            />

            <input
                value={editingProduct.Author}
                onChange={(e) =>
                setEditingProduct({
                    ...editingProduct,
                    Author: e.target.value
                })
                }
            />

            <input
                type="number"
                value={editingProduct.SubGenre}
                onChange={(e) =>
                setEditingProduct({
                    ...editingProduct,
                    SubGenre: e.target.value
                })
                }
            />

            <input
                type="date"
                value={editingProduct.Published}
                onChange={(e) =>
                setEditingProduct({
                    ...editingProduct,
                    Published: e.target.value
                })
                }
            />

            <textarea
                value={editingProduct.Description}
                onChange={(e) =>
                setEditingProduct({
                    ...editingProduct,
                    Description: e.target.value
                })
                }
            />

            <button onClick={handleUpdateProduct}>
                Save
            </button>

            <button
                onClick={() => {
                setShowEditModal(false)
                setEditingProduct(null)
                }}
            >
                Cancel
            </button>
            </div>
        </div>
        )}
    </div>
  )
}



export default Admin