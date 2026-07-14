import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Admin() {
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [stocktake, setStocktake] = useState([])
  const [orders, setOrders] = useState([])
  const [sources, setSources] = useState([])
  const [activeTab, setActiveTab] = useState("users")
  const [search, setSearch] = useState("")
const [showEditModal, setShowEditModal] = useState(false)
const [editingProduct, setEditingProduct] = useState(null)
const [showUserModal, setShowUserModal] = useState(false)
const [editingUser, setEditingUser] = useState(null)
const [showStockModal, setShowStockModal] = useState(false)
const [editingStock, setEditingStock] = useState(null)
const [genres, setGenres] = useState([])
const [gameGenres, setGameGenres] = useState([])
const [movieGenres, setMovieGenres] = useState([])
const [bookGenres, setBookGenres] = useState([])
const [productPage, setProductPage] = useState(1)
const productsPerPage = 25
const [stockPage, setStockPage] = useState(1)
const stockPerPage = 25
const [userPage, setUserPage] = useState(1)
const usersPerPage = 25
const [orderPage, setOrderPage] = useState(1)
const ordersPerPage = 25



  const [newProduct, setNewProduct] = useState({
  Name: "",
  Author: "",
  Description: "",
  Genre: "",
  SubGenre: "",
  Published: ""
})

const [newProductImage, setNewProductImage] = useState(null)
const [newProductImagePreview, setNewProductImagePreview] = useState("")

const [newStock, setNewStock] = useState({
  SourceId: "",
  ProductId: "",
  Quantity: "",
  Price: ""
})

const [newStaff, setNewStaff] = useState({
  role: "employee",
  name: "",
  username: "",
  email: "",
  password: ""
})

const [staffMessage, setStaffMessage] = useState("")

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A"

    if (typeof value === "object") {
      return value.Name || value.name || value.ID || value.id || "N/A"
    }

    return String(value)
  }

  const getDisplayName = (name) => {
    return safeText(name)
      .replace(/\s+employee$/i, "")
      .replace(/\s+admin$/i, "")
  }

  const getUserRole = (user) => {
    if (user.IsAdmin) return "Admin"

    if (safeText(user.Name).toLowerCase().endsWith(" employee")) {
      return "Employee"
    }

    return "Customer"
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

    fetch("/api/inft3050/Source?limit=1000")
        .then((res) => res.json())
        .then((data) => setSources(data.list || []))
        .catch((err) => console.log(err))

    fetch("/api/inft3050/Orders?limit=1000")
      .then((res) => res.json())
      .then((data) => setOrders(data.list || []))
      .catch((err) => console.log(err))

    fetch("/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000")
        .then((res) => res.json())
        .then((data) => setGenres(data.list || []))
        .catch((err) => console.log(err))
    fetch("/api/inft3050/GameGenre")
    .then((res) => res.json())
    .then((data) => setGameGenres(data.list || []))

    fetch("/api/inft3050/MovieGenre")
    .then((res) => res.json())
    .then((data) => setMovieGenres(data.list || []))

    fetch("/api/inft3050/BookGenre")
    .then((res) => res.json())
    .then((data) => setBookGenres(data.list || []))
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
      const response = await fetch(
        `http://localhost:5050/api-delete-product/${productID}`,
        {
            method: "DELETE"
        }
        )

      if (!response.ok) {
        const errorText = await response.text()
        alert(errorText || "Failed to delete product")
        return
      }

      setProducts((prevProducts) =>
        prevProducts.filter(
            (product) => Number(product.ID) !== Number(productID)
        )
        )

      alert("Product deleted successfully")
    } catch (error) {
      console.error(error)
      alert("Delete failed. Check browser console.")
    }
  }


const getProductNameByID = (productID) => {
  const found = products.find(
    (product) => Number(product.ID) === Number(productID)
  )

  return found ? found.Name : "N/A"
}

const getSourceNameByID = (sourceID) => {
  const found = sources.find(
    (source) =>
      Number(source.Sourceid || source.SourceId || source.SourceID) ===
      Number(sourceID)
  )

  return found
    ? safeText(found.Source_name || found.SourceName || found.Name)
    : "N/A"
}



  const matchesSearch = (values) => {
  const searchText = search.trim().toLowerCase()

  if (!searchText) {
    return true
  }

  return values.some((value) =>
    safeText(value)
      .trim()
      .toLowerCase()
      .includes(searchText)
  )
}

  const filteredProducts = products.filter((product) =>
    matchesSearch([
      product.ID,
      product.Name,
      product.Author,
      product.Genre,
      product.SubGenre
    ])
  )

  const sortedProducts = filteredProducts
  .slice()
  .sort((a, b) => Number(a.ID) - Number(b.ID))

const totalProductPages = Math.max(
  1,
  Math.ceil(sortedProducts.length / productsPerPage)
)

const paginatedProducts = sortedProducts.slice(
  (productPage - 1) * productsPerPage,
  productPage * productsPerPage
)

  const filteredUsers = users.filter((user) =>
    matchesSearch([user.UserID, user.UserName, getDisplayName(user.Name), user.Email, getUserRole(user)])
  )

  const sortedUsers = filteredUsers
  .slice()
  .sort((a, b) => Number(a.UserID) - Number(b.UserID))

const totalUserPages = Math.max(
  1,
  Math.ceil(sortedUsers.length / usersPerPage)
)

const paginatedUsers = sortedUsers.slice(
  (userPage - 1) * usersPerPage,
  userPage * usersPerPage
)

  const filteredStocktake = stocktake.filter((item) => {
  const itemID = item.ItemId || item.ItemID

  const sourceID =
    item.Sourceid ||
    item.SourceId ||
    item.SourceID

  const productID =
    item.ProductId ||
    item.ProductID ||
    item.Productid

  const sourceName = getSourceNameByID(sourceID)
  const productName = getProductNameByID(productID)

  return matchesSearch([
    itemID,
    `#${itemID}`,
    sourceID,
    sourceName,
    productID,
    productName,
    item.Quantity,
    item.Price,
    `S$${item.Price}`
  ])
})

    const sortedStocktake = filteredStocktake
    .slice()
    .sort(
        (a, b) =>
        Number(a.ItemId || a.ItemID) - Number(b.ItemId || b.ItemID)
    )

    const totalStockPages = Math.max(
  1,
  Math.ceil(sortedStocktake.length / stockPerPage)
)

    const paginatedStocktake = sortedStocktake.slice(
    (stockPage - 1) * stockPerPage,
    stockPage * stockPerPage
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

  const sortedOrders = filteredOrders
  .slice()
  .sort((a, b) => Number(a.OrderID) - Number(b.OrderID))

const totalOrderPages = Math.max(
  1,
  Math.ceil(sortedOrders.length / ordersPerPage)
)

const paginatedOrders = sortedOrders.slice(
  (orderPage - 1) * ordersPerPage,
  orderPage * ordersPerPage
)

const handleProductImageChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) {
    setNewProductImage(null)
    setNewProductImagePreview("")
    return
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ]

  if (!allowedTypes.includes(file.type)) {
    alert("Please select a JPEG, PNG or WebP image")
    event.target.value = ""
    setNewProductImage(null)
    setNewProductImagePreview("")
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Image must be smaller than 5MB")
    event.target.value = ""
    setNewProductImage(null)
    setNewProductImagePreview("")
    return
  }

  if (newProductImagePreview) {
  URL.revokeObjectURL(newProductImagePreview)
}

setNewProductImage(file)
setNewProductImagePreview(URL.createObjectURL(file))
}

const handleAddProduct = async (e) => {
  e.preventDefault()

  const duplicateProduct = products.find(
    (product) =>
      safeText(product.Name).toLowerCase() ===
        newProduct.Name.trim().toLowerCase() &&
      safeText(product.Author).toLowerCase() ===
        newProduct.Author.trim().toLowerCase() &&
      getProductGenreName(product.ID, product.Genre) ===
        newProduct.Genre &&
      Number(product.SubGenre) === Number(newProduct.SubGenre)
  )

  if (duplicateProduct) {
    alert("This product already exists")
    return
  }

  if (!newProductImage) {
    alert("Please select a product image")
    return
  }

  const formData = new FormData()

  formData.append("Name", newProduct.Name.trim())
  formData.append("Author", newProduct.Author.trim())
  formData.append("Description", newProduct.Description.trim())
  formData.append(
    "Genre",
    String(getGenreIDByName(newProduct.Genre))
  )
  formData.append("SubGenre", String(newProduct.SubGenre))
  formData.append("Published", newProduct.Published)
  formData.append("LastUpdatedBy", username)
  formData.append(
    "LastUpdated",
    new Date().toISOString().split("T")[0]
  )
  formData.append("Image", newProductImage)

  try {
    const response = await fetch(
  "http://localhost:5050/api-add-product",
  {
    method: "POST",
    body: formData
  }
)

    const responseText = await response.text()

    if (!response.ok) {
      alert(responseText || "Failed to create product")
      return
    }

    setNewProduct({
      Name: "",
      Author: "",
      Description: "",
      Genre: "",
      SubGenre: "",
      Published: ""
    })

    setNewProductImage(null)

    if (newProductImagePreview) {
      URL.revokeObjectURL(newProductImagePreview)
    }

    setNewProductImagePreview("")

    const imageInput = document.getElementById(
      "new-product-image"
    )

    if (imageInput) {
      imageInput.value = ""
    }

    alert("Product and image created successfully")
    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Create failed")
  }
}


const handleEditProduct = (product) => {
  const genreName = getProductGenreName(product.ID, product.Genre)

  setEditingProduct({
    ID: product.ID,
    Name: product.Name || "",
    Author: product.Author || "",
    Description: product.Description || "",
    Genre: genreName,
    SubGenre: product.SubGenre || "",
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
        Genre: getGenreIDByName(editingProduct.Genre),
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

const handleCreateStaffAccount = async (e) => {
  e.preventDefault()
  setStaffMessage("")

  const cleanName = newStaff.name.trim()
  const cleanUsername = newStaff.username.trim()
  const cleanPassword = newStaff.password
  const cleanEmail = (newStaff.email || "").trim()

  if (!cleanName || !cleanUsername || !cleanPassword) {
    setStaffMessage("Please complete all staff account fields")
    return
  }

  const duplicateUser = users.find(
    (user) => safeText(user.UserName).toLowerCase() === cleanUsername.toLowerCase()
  )

  if (duplicateUser) {
    setStaffMessage("Username already exists")
    return
  }

  const roleTag = newStaff.role === "admin" ? "admin" : "employee"
  const storedName = `${cleanName} ${roleTag}`

  try {
    const response = await fetch("/api-register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: cleanUsername,
        name: storedName,
        email: newStaff.email || null,
        password: cleanPassword
      })
    })

    const text = await response.text()

    if (!response.ok) {
      setStaffMessage(text || "Failed to create staff account")
      return
    }

    if (newStaff.role === "admin") {
      const usersResponse = await fetch("/api/inft3050/User?limit=1000")
      const usersData = await usersResponse.json()

      const createdUser = usersData.list?.find(
        (user) => safeText(user.UserName).toLowerCase() === cleanUsername.toLowerCase()
      )

      if (createdUser) {
        const updateResponse = await fetch(`/api-edit-user/${createdUser.UserID}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            IsAdmin: 1
          })
        })

        if (!updateResponse.ok) {
          setStaffMessage("Account created, but failed to set admin role")
          loadAdminData()
          return
        }
      }
    }

    setNewStaff({
      role: "employee",
      name: "",
      username: "",
      email: "",
      password: ""
    })

    setStaffMessage(
      newStaff.role === "admin"
        ? "New admin account created successfully"
        : "New employee account created successfully"
    )

    loadAdminData()
  } catch (error) {
    console.error(error)
    setStaffMessage("Create account failed")
  }
}

const handleEditUser = (user) => {
  const role = getUserRole(user)
  const cleanName = getDisplayName(user.Name)

  setEditingUser({
    UserID: user.UserID,
    UserName: user.UserName,
    Name: cleanName,
    Role: role
  })

  setShowUserModal(true)
}

const handleUpdateUser = async () => {
  const cleanName = getDisplayName(editingUser.Name).trim()
  let storedName = cleanName
  let isAdmin = 0

  if (editingUser.Role === "Employee") {
    storedName = `${cleanName} employee`
  }

  if (editingUser.Role === "Admin") {
    storedName = `${cleanName} admin`
    isAdmin = 1
  }

  try {
    const response = await fetch(
      `/api-edit-user/${editingUser.UserID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Name: storedName,
          IsAdmin: isAdmin
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      alert(errorText || "Failed to update user")
      return
    }

    alert("User updated successfully")

    setShowUserModal(false)
    setEditingUser(null)

    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Update failed")
  }
}

const handleDeleteUser = async (userID) => {
  const confirmed = window.confirm(
    `Delete user #${userID}?`
  )

  if (!confirmed) return

  try {
    const response = await fetch(
      `/api-delete-user/${userID}`,
      {
        method: "DELETE"
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      alert(errorText)
      return
    }

    alert("User deleted successfully")
    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Delete failed")
  }
}

const handleEditStock = (item) => {
  const sourceID = item.Sourceid || item.SourceId || item.SourceID
  const productID = item.ProductId || item.ProductID || item.Productid

  setEditingStock({
    ItemId: item.ItemId || item.ItemID,
    SourceName: getSourceNameByID(sourceID),
    ProductName: getProductNameByID(productID),
    Quantity: item.Quantity,
    Price: item.Price
  })

  setShowStockModal(true)
}

const handleUpdateStock = async () => {
  try {
    const response = await fetch(
      `/api-edit-stocktake/${editingStock.ItemId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Quantity: Number(editingStock.Quantity),
          Price: Number(editingStock.Price)
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      alert(errorText)
      return
    }

    alert("Stock updated successfully")

    setShowStockModal(false)
    setEditingStock(null)

    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Update failed")
  }
}

const handleDeleteStock = async (itemID) => {
  const confirmed = window.confirm(`Delete stocktake #${itemID}?`)
  if (!confirmed) return

  try {
    const response = await fetch(`/api-delete-stocktake/${itemID}`, {
      method: "DELETE"
    })

    if (!response.ok) {
      const errorText = await response.text()
      alert(errorText || "Failed to delete stocktake")
      return
    }

    alert("Stocktake deleted successfully")
    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Delete failed")
  }
}

const handleAddStock = async (e) => {
  e.preventDefault()

  const duplicateStock = stocktake.find((item) => {
    const itemSourceId = item.Sourceid || item.SourceId || item.SourceID
    const itemProductId = item.ProductId || item.ProductID || item.Productid

    return (
      Number(itemSourceId) === Number(newStock.SourceId) &&
      Number(itemProductId) === Number(newStock.ProductId)
    )
  })

  if (duplicateStock) {
    alert("This stocktake record already exists")
    return
  }

  try {
    const response = await fetch("/api-add-stocktake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        SourceId: Number(newStock.SourceId),
        ProductId: Number(newStock.ProductId),
        Quantity: Number(newStock.Quantity),
        Price: Number(newStock.Price)
      })
    })

    if (!response.ok) {
      alert(await response.text())
      return
    }

    setNewStock({
      SourceId: "",
      ProductId: "",
      Quantity: "",
      Price: ""
    })

    alert("Stocktake created successfully")
    loadAdminData()
  } catch (error) {
    console.error(error)
    alert("Create stocktake failed")
  }
}

const getGenreIDByName = (genreName) => {
  const found = genres.find((genre) => genre.Name === genreName)
  return found ? found.GenreID : null
}

const getProductGenreName = (productID, productGenreID = null) => {
  if (productGenreID) {
    const found = genres.find(
      (genre) => Number(genre.GenreID) === Number(productGenreID)
    )

    if (found) return found.Name
  }

  for (const genre of genres) {
    const productList = genre["Product List"] || []

    const found = productList.find(
      (product) => Number(product.ID) === Number(productID)
    )

    if (found) {
      return genre.Name
    }
  }

  return "N/A"
}

const getSubGenreName = (product) => {
  const subGenreId = Number(product.SubGenre)

  if (getProductGenreName(product.ID) === "Games") {
    return (
      gameGenres.find(
        (genre) => Number(genre.SubGenreID) === subGenreId
      )?.Name || subGenreId
    )
  }

  if (getProductGenreName(product.ID) === "Movies") {
    return (
      movieGenres.find(
        (genre) => Number(genre.SubGenreID) === subGenreId
      )?.Name || subGenreId
    )
  }

  if (getProductGenreName(product.ID) === "Books") {
    return (
      bookGenres.find(
        (genre) => Number(genre.SubGenreID) === subGenreId
      )?.Name || subGenreId
    )
  }

  return subGenreId
}



const changeTab = (tab) => {
  setActiveTab(tab)
  setSearch("")
  setProductPage(1)
  setStockPage(1)
  setUserPage(1)
  setOrderPage(1)
}

  const username = localStorage.getItem("username") || "admin"

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-header">
            <div className="admin-logo">EG</div>
            <div className="admin-header-text">
            <h2>Entertainment Guild</h2>
            <p>Admin Panel</p>
          </div>
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
            

            <input
            className="admin-search"
            type="text"
            placeholder="Search current section..."
            value={search}
            onChange={(e) => {
                setSearch(e.target.value)
                setProductPage(1)
                setStockPage(1)
                setUserPage(1)
                setOrderPage(1)
                }}
            />
          </div>

          {activeTab === "users" && (
            <div>
              <div className="admin-register-box">
                <h2>Register New Staff</h2>

                <form
                  className="admin-register-form"
                  onSubmit={handleCreateStaffAccount}
                >
                  <div className="admin-register-field">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          name: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="admin-register-field">
                    <label>Username</label>
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={newStaff.username}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          username: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="admin-register-field">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter email"
                      value={newStaff.email}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          email: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="admin-register-field">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={newStaff.password}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          password: e.target.value
                        })
                      }
                      required
                    />
                  </div>

                  <div className="admin-register-field">
                    <label>Role</label>
                    <select
                      value={newStaff.role}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          role: e.target.value
                        })
                      }
                      required
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button type="submit" className="admin-register-submit">
                    Create {newStaff.role === "admin" ? "Admin" : "Employee"}
                  </button>
                </form>

                {staffMessage && (
                  <p className="admin-register-message">
                    {staffMessage}
                  </p>
                )}
              </div>

              <h2>User Management</h2>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Role</th>
                    <th>User ID</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.UserID}>
                      <td>{safeText(user.UserName)}</td>
                      <td>{getDisplayName(user.Name)}</td>
                      <td>
                        <span
                          className={
                            getUserRole(user) === "Admin"
                              ? "badge admin"
                              : getUserRole(user) === "Employee"
                                ? "badge employee"
                                : "badge"
                          }
                        >
                          {getUserRole(user)}
                        </span>
                      </td>
                      <td>#{safeText(user.UserID)}</td>

                      <td>
                        <div className="action-buttons">
                          <button
                            className="admin-edit-btn"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>

                          <button
                            className="admin-delete-btn"
                            onClick={() => handleDeleteUser(user.UserID)}
                            disabled={String(user.UserName) === String(username)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                  disabled={userPage === 1}
                >
                  Previous
                </button>

                <span>
                  Page {userPage} of {totalUserPages}
                </span>

                <button
                  onClick={() =>
                    setUserPage((prev) => Math.min(prev + 1, totalUserPages))
                  }
                  disabled={userPage === totalUserPages}
                >
                  Next
                </button>
              </div>
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

                <select
                    value={newProduct.Genre}
                    onChange={(e) =>
                        setNewProduct({
                        ...newProduct,
                        Genre: e.target.value,
                        SubGenre: ""
                        })
                    }
                    required
                    >
                    <option value="">Select Genre</option>
                    <option value="Books">Books</option>
                    <option value="Movies">Movies</option>
                    <option value="Games">Games</option>
                    </select>

                    <select
                    value={newProduct.SubGenre}
                    onChange={(e) =>
                        setNewProduct({
                        ...newProduct,
                        SubGenre: e.target.value
                        })
                    }
                    required
                    >
                    <option value="">Select Sub Genre</option>

                    {newProduct.Genre === "Books" &&
                        bookGenres.map((genre) => (
                        <option key={genre.SubGenreID} value={genre.SubGenreID}>
                            {genre.Name}
                        </option>
                        ))}

                    {newProduct.Genre === "Movies" &&
                        movieGenres.map((genre) => (
                        <option key={genre.SubGenreID} value={genre.SubGenreID}>
                            {genre.Name}
                        </option>
                        ))}

                    {newProduct.Genre === "Games" &&
                        gameGenres.map((genre) => (
                        <option key={genre.SubGenreID} value={genre.SubGenreID}>
                            {genre.Name}
                        </option>
                        ))}
                    </select>

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

                <div className="admin-product-image-field">
                <label htmlFor="new-product-image">
                    Product Image
                </label>

                <input
                    id="new-product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProductImageChange}
                    required
                />
                </div>

                {newProductImagePreview && (
                    <div className="admin-product-image-preview">
                        <img
                        src={newProductImagePreview}
                        alt="New product preview"
                        />

                        <button
                        type="button"
                        onClick={() => {
                            if (newProductImagePreview) {
                            URL.revokeObjectURL(newProductImagePreview)
                            }

                            setNewProductImage(null)
                            setNewProductImagePreview("")

                            const imageInput = document.getElementById(
                            "new-product-image"
                            )

                            if (imageInput) {
                            imageInput.value = ""
                            }
                        }}
                        >
                        Remove Image
                        </button>
                    </div>
                    )}

                <textarea
                placeholder="Description"
                value={newProduct.Description}
                onChange={(e) =>
                    setNewProduct({
                    ...newProduct,
                    Description: e.target.value
                    })
                }
                required
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
                  {paginatedProducts.map((product) => (
                    <tr key={product.ID}>
                      <td>{safeText(product.Name)}</td>
                      <td>{safeText(product.Author)}</td>
                      <td>{getProductGenreName(product.ID, product.Genre)}</td>
                      <td>{getSubGenreName(product)}</td>
                      <td>#{safeText(product.ID)}</td>
                      <td>
                        <div className="action-buttons">
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
                        </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>



                <div className="pagination">
                <button
                    onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))}
                    disabled={productPage === 1}
                >
                    Previous
                </button>

                <span>
                    Page {productPage} of {totalProductPages}
                </span>

                <button
                    onClick={() =>
                    setProductPage((prev) => Math.min(prev + 1, totalProductPages))
                    }
                    disabled={productPage === totalProductPages}
                >
                    Next
                </button>
                </div>

                {filteredProducts.length === 0 && (
                <p className="profile-empty">No products found.</p>
                )}
            </div>
          )}

          {activeTab === "stocktake" && (
            <div>
              <h2>Inventory / Stocktake</h2>

              <form className="stocktake-form" onSubmit={handleAddStock}>
                <select
                    value={newStock.SourceId}
                    onChange={(e) =>
                    setNewStock({ ...newStock, SourceId: e.target.value })
                    }
                    required
                >
                    <option value="">Select Source</option>
                    {sources.map((source) => (
                    <option
                        key={source.Sourceid || source.SourceID}
                        value={source.Sourceid || source.SourceID}
                    >
                        {source.Source_name || source.SourceName || source.Name}
                    </option>
                    ))}
                </select>

                <select
                    value={newStock.ProductId}
                    onChange={(e) =>
                    setNewStock({ ...newStock, ProductId: e.target.value })
                    }
                    required
                >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                    <option key={product.ID} value={product.ID}>
                        #{product.ID} - {product.Name}
                    </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Quantity"
                    value={newStock.Quantity}
                    onChange={(e) =>
                    setNewStock({ ...newStock, Quantity: e.target.value })
                    }
                    required
                />

                <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newStock.Price}
                    onChange={(e) =>
                    setNewStock({ ...newStock, Price: e.target.value })
                    }
                    required
                />

                <button type="submit" className="stocktake-add-btn">
                    Add Stocktake
                </button>
                </form>

              <table className="admin-table">
                <thead>
                <tr>
                    <th>Item ID</th>
                    <th>Source</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Action</th>
                </tr>
                </thead>

                <tbody>
                  {paginatedStocktake.map((item, index) => (
                    <tr key={index}>
                      <td>#{safeText(item.ItemId || item.ItemID)}</td>
                      <td>
                        {getSourceNameByID(
                        item.Sourceid || item.SourceId || item.SourceID
                        )}
                        </td>

                        <td>
                        {getProductNameByID(
                        item.ProductId || item.ProductID || item.Productid
                        )}
                        </td>

                        <td>{safeText(item.Quantity)}</td>

                        <td>
                        S${safeText(item.Price)}
                        </td>

                        <td>
                            <div className="action-buttons">
                                <button
                                className="admin-edit-btn"
                                onClick={() => handleEditStock(item)}
                                >
                                Edit
                                </button>

                                <button
                                className="admin-delete-btn"
                                onClick={() =>
                                    handleDeleteStock(item.ItemId || item.ItemID)
                                }
                                >
                                Delete
                                </button>
                            </div>
                            </td>
                    </tr>
                  ))}
                </tbody>
              </table>



                <div className="pagination">
                <button
                    onClick={() => setStockPage((prev) => Math.max(prev - 1, 1))}
                    disabled={stockPage === 1}
                >
                    Previous
                </button>

                <span>
                    Page {stockPage} of {totalStockPages}
                </span>

                <button
                    onClick={() =>
                    setStockPage((prev) => Math.min(prev + 1, totalStockPages))
                    }
                    disabled={stockPage === totalStockPages}
                >
                    Next
                </button>
                </div>



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
                        <th>Suburb</th>
                        <th>State</th>
                        <th>Post Code</th>
                        <th>Items</th>
                    </tr>
                    </thead>

                    <tbody>
                    {paginatedOrders.map((order) => (
                        <tr key={order.OrderID}>
                        <td>#{order.OrderID}</td>

                        <td>
                            #{order.Customer}
                        </td>

                        <td>
                            {order.StreetAddress}
                        </td>

                        <td>
                            {order.Suburb}
                        </td>

                        <td>
                            {order.State}
                        </td>

                        <td>
                            {order.PostCode}
                        </td>

                        <td>
                            {order["ProductsInOrders List"]?.length || 0}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="pagination">
                    <button
                        onClick={() =>
                        setOrderPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={orderPage === 1}
                    >
                        Previous
                    </button>

                    <span>
                        Page {orderPage} of {totalOrderPages}
                    </span>

                    <button
                        onClick={() =>
                        setOrderPage(
                            (prev) => Math.min(prev + 1, totalOrderPages)
                        )
                        }
                        disabled={orderPage === totalOrderPages}
                    >
                        Next
                    </button>
                    </div>

              
            </div>
          )}
        </section>
      </main>

      {showEditModal && editingProduct && (
        <div className="modal-overlay">
            <div className="modal">

            <h3>Edit Product</h3>

            <div className="modal-form">

                <input
                value={editingProduct.Name}
                onChange={(e) =>
                    setEditingProduct({
                    ...editingProduct,
                    Name: e.target.value
                    })
                }
                placeholder="Product Name"
                />

                <input
                value={editingProduct.Author}
                onChange={(e) =>
                    setEditingProduct({
                    ...editingProduct,
                    Author: e.target.value
                    })
                }
                placeholder="Author"
                />

                <div className="genre-row">

                <select
                    value={editingProduct.Genre}
                    onChange={(e) =>
                    setEditingProduct({
                        ...editingProduct,
                        Genre: e.target.value,
                        SubGenre: ""
                    })
                    }
                >
                    <option value="">Select Genre</option>
                    <option value="Books">Books</option>
                    <option value="Movies">Movies</option>
                    <option value="Games">Games</option>
                </select>

                <select
                    value={editingProduct.SubGenre}
                    onChange={(e) =>
                    setEditingProduct({
                        ...editingProduct,
                        SubGenre: e.target.value
                    })
                    }
                >
                    <option value="">Select Sub Genre</option>

                    {editingProduct.Genre === "Books" &&
                    bookGenres.map((genre) => (
                        <option
                        key={genre.SubGenreID}
                        value={genre.SubGenreID}
                        >
                        {genre.Name}
                        </option>
                    ))}

                    {editingProduct.Genre === "Movies" &&
                    movieGenres.map((genre) => (
                        <option
                        key={genre.SubGenreID}
                        value={genre.SubGenreID}
                        >
                        {genre.Name}
                        </option>
                    ))}

                    {editingProduct.Genre === "Games" &&
                    gameGenres.map((genre) => (
                        <option
                        key={genre.SubGenreID}
                        value={genre.SubGenreID}
                        >
                        {genre.Name}
                        </option>
                    ))}
                </select>

                </div>

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
                rows="5"
                value={editingProduct.Description}
                onChange={(e) =>
                    setEditingProduct({
                    ...editingProduct,
                    Description: e.target.value
                    })
                }
                />

                <div className="modal-actions">

                <button
                    className="modal-save-btn"
                    onClick={handleUpdateProduct}
                >
                    Save Changes
                </button>

                <button
                    className="modal-cancel-btn"
                    onClick={() => {
                    setShowEditModal(false)
                    setEditingProduct(null)
                    }}
                >
                    Cancel
                </button>

                </div>

            </div>

            </div>
        </div>
        )}

        {showUserModal && editingUser && (
            <div className="modal-overlay">
                <div className="modal user-modal">

                <h3>Edit User</h3>

                <div className="modal-form">

                    <label>Username</label>
                    <input
                    value={editingUser.UserName}
                    disabled
                    />

                    <label>Full Name</label>
                    <input
                    value={editingUser.Name}
                    onChange={(e) =>
                        setEditingUser({
                        ...editingUser,
                        Name: e.target.value
                        })
                    }
                    />

                    <label>Role</label>
                    <select
                    value={editingUser.Role}
                    onChange={(e) =>
                        setEditingUser({
                        ...editingUser,
                        Role: e.target.value
                        })
                    }
                    >
                    <option value="Customer">Customer</option>
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                    </select>

                    <div className="modal-actions">
                    <button
                        className="modal-save-btn"
                        onClick={handleUpdateUser}
                    >
                        Save Changes
                    </button>

                    <button
                        className="modal-cancel-btn"
                        onClick={() => {
                        setShowUserModal(false)
                        setEditingUser(null)
                        }}
                    >
                        Cancel
                    </button>
                    </div>

                </div>
                </div>
            </div>
            )}

            {showStockModal && editingStock && (
                <div className="modal-overlay">
                    <div className="modal stock-modal">
                    <h3>Edit Stock</h3>

                    <div className="modal-form">
                        <label>Source</label>
                        <input value={editingStock.SourceName} disabled />

                        <label>Product</label>
                        <input value={editingStock.ProductName} disabled />

                        <div className="stock-fields">
                            <div className="stock-field">
                                <label>Quantity</label>
                                <input
                                type="number"
                                value={editingStock.Quantity}
                                onChange={(e) =>
                                    setEditingStock({
                                    ...editingStock,
                                    Quantity: e.target.value
                                    })
                                }
                                />
                            </div>

                            <div className="stock-field">
                                <label>Price S$</label>
                                <input
                                type="number"
                                step="0.01"
                                value={editingStock.Price}
                                onChange={(e) =>
                                    setEditingStock({
                                    ...editingStock,
                                    Price: e.target.value
                                    })
                                }
                                />
                            </div>
                            </div>

                        <div className="modal-actions">
                        <button
                            className="modal-cancel-btn"
                            onClick={() => {
                            setShowStockModal(false)
                            setEditingStock(null)
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            className="modal-save-btn"
                            onClick={handleUpdateStock}
                        >
                            Save Changes
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                )}

    </div>
  )
}



export default Admin