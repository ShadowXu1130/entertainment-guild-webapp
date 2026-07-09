import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Employee() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [activeSection, setActiveSection] = useState("users")

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editProfile, setEditProfile] = useState({ name: "", email: "" })
  const [profileMessage, setProfileMessage] = useState("")
  const [profileSaving, setProfileSaving] = useState(false)

  const username = localStorage.getItem("username")
  const storedName = localStorage.getItem("name") || username
  const storedEmail = localStorage.getItem("email") || "N/A"

  const cleanName = (name) => {
    return String(name || "")
      .replace(/\s+employee$/i, "")
      .replace(/\s+admin$/i, "")
  }

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A"

    if (typeof value === "object") {
      return value.Name || value.name || value.ID || value.id || "N/A"
    }

    return String(value)
  }

  const matchesSearch = (values) => {
    return values.some((value) =>
      safeText(value).toLowerCase().includes(search.toLowerCase())
    )
  }

  const getProfileID = (profileData = profile) => {
    return (
      profileData?.UserID ||
      profileData?.ID ||
      profileData?.Id ||
      profileData?.id ||
      profileData?.UserId ||
      profileData?.userid
    )
  }

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userType = localStorage.getItem("userType")

    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    if (userType !== "employee") {
      navigate("/")
      return
    }

    loadEmployeeData()
  }, [navigate])

  const loadEmployeeData = async () => {
    try {
      let loadedProfile = null

      const profileResponse = await fetch(`/api-profile-user/${username}`)

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        loadedProfile = profileData

        localStorage.setItem("name", cleanName(profileData.Name))
        localStorage.setItem("email", profileData.Email || "")
      }

      const usersResponse = await fetch("/api/inft3050/User?limit=1000")
      const usersData = await usersResponse.json()
      const allUsers = usersData.list || []

      const currentUser = allUsers.find(
        (user) => String(user.UserName) === String(username)
      )

      if (currentUser) {
        loadedProfile = { ...currentUser, ...(loadedProfile || {}) }
      }

      if (loadedProfile) {
        setProfile(loadedProfile)
        localStorage.setItem("name", cleanName(loadedProfile.Name))
        localStorage.setItem("email", loadedProfile.Email || "")
      }

      const nonAdminUsers = allUsers.filter((user) => !user.IsAdmin)
      setUsers(nonAdminUsers)

      const ordersResponse = await fetch("/api/inft3050/Orders?limit=1000")
      const ordersData = await ordersResponse.json()
      setOrders(ordersData.list || [])

      const [
        productResponse,
        genreResponse,
        sourceResponse,
        stocktakeResponse,
        gameGenreResponse,
        movieGenreResponse,
        bookGenreResponse
      ] = await Promise.all([
        fetch("/api/inft3050/Product?limit=1000"),
        fetch("/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"),
        fetch("/api/inft3050/Source?limit=1000"),
        fetch("/api/inft3050/Stocktake?limit=1000"),
        fetch("/api/inft3050/GameGenre?limit=1000"),
        fetch("/api/inft3050/MovieGenre?limit=1000"),
        fetch("/api/inft3050/BookGenre?limit=1000")
      ])

      const productData = await productResponse.json()
      const genreData = await genreResponse.json()
      const sourceData = await sourceResponse.json()
      const stocktakeData = await stocktakeResponse.json()
      const gameGenreData = await gameGenreResponse.json()
      const movieGenreData = await movieGenreResponse.json()
      const bookGenreData = await bookGenreResponse.json()

      const allProducts = productData.list || []
      const allGenres = genreData.list || []
      const allSources = sourceData.list || []
      const allStocktake = stocktakeData.list || []
      const gameGenres = gameGenreData.list || []
      const movieGenres = movieGenreData.list || []
      const bookGenres = bookGenreData.list || []

      const getGenreName = (product) => {
        const found = allGenres.find(
          (genre) => Number(genre.GenreID) === Number(product?.Genre)
        )

        if (found) return found.Name

        for (const genre of allGenres) {
          const productList = genre["Product List"] || []

          const productFound = productList.find(
            (item) => Number(item.ID) === Number(product?.ID)
          )

          if (productFound) return genre.Name
        }

        return "N/A"
      }

      const getSubGenreName = (product, genreName) => {
        const subGenreID = Number(product?.SubGenre)

        if (genreName === "Games") {
          return (
            gameGenres.find(
              (genre) => Number(genre.SubGenreID) === subGenreID
            )?.Name || subGenreID
          )
        }

        if (genreName === "Movies") {
          return (
            movieGenres.find(
              (genre) => Number(genre.SubGenreID) === subGenreID
            )?.Name || subGenreID
          )
        }

        if (genreName === "Books") {
          return (
            bookGenres.find(
              (genre) => Number(genre.SubGenreID) === subGenreID
            )?.Name || subGenreID
          )
        }

        return subGenreID || "N/A"
      }

      const getSourceName = (sourceID) => {
        const found = allSources.find(
          (source) =>
            Number(source.Sourceid || source.SourceId || source.SourceID) ===
            Number(sourceID)
        )

        return found
          ? safeText(found.Source_name || found.SourceName || found.Name)
          : "N/A"
      }

      const trackedProducts = allStocktake.map((stock) => {
        const productID = stock.ProductId || stock.ProductID || stock.Productid
        const sourceID = stock.Sourceid || stock.SourceId || stock.SourceID

        const product = allProducts.find(
          (item) => Number(item.ID) === Number(productID)
        )

        const genreName = getGenreName(product)
        const subGenreName = getSubGenreName(product, genreName)

        return {
          itemID: stock.ItemId || stock.ItemID,
          productID,
          product: product?.Name || "N/A",
          genre: genreName,
          subGenre: subGenreName,
          source: getSourceName(sourceID),
          quantity: stock.Quantity,
          price: stock.Price
        }
      })

      setProducts(trackedProducts)
    } catch (error) {
      console.error(error)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const handleSectionChange = (section) => {
    setActiveSection(section)
    setSearch("")
  }

  const startEditProfile = () => {
    setProfileMessage("")
    setEditProfile({
      name: cleanName(profile?.Name || storedName),
      email: profile?.Email || storedEmail || ""
    })
    setIsEditingProfile(true)
  }

  const cancelEditProfile = () => {
    setIsEditingProfile(false)
    setProfileMessage("")
  }

  const updateUserRequest = async (userID, payload) => {
    const urls = [
      `/api/inft3050/User/${userID}`,
      `/api/inft3050/User/UserID/${userID}`,
      `/api/inft3050/User?id=${userID}`
    ]

    const methods = ["PATCH", "PUT"]
    let lastError = "Update failed."

    for (const url of urls) {
      for (const method of methods) {
        try {
          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          })

          if (response.ok) return response

          const errorText = await response.text()
          lastError = errorText || `${method} ${url} failed.`
        } catch (error) {
          lastError = error.message
        }
      }
    }

    throw new Error(lastError)
  }

  const saveProfile = async (event) => {
    event.preventDefault()

    const newName = cleanName(editProfile.name).trim()
    const newEmail = editProfile.email.trim()

    if (!newName) {
      setProfileMessage("Name cannot be empty.")
      return
    }

    const userID = getProfileID()

    if (!userID) {
      setProfileMessage("Could not find this employee's User ID.")
      return
    }

    const updatedProfile = {
      ...profile,
      UserID: profile?.UserID || userID,
      UserName: profile?.UserName || username,
      Name: newName,
      Email: newEmail,
      IsAdmin: profile?.IsAdmin || false
    }

    setProfileSaving(true)
    setProfileMessage("")

    try {
      await updateUserRequest(userID, updatedProfile)

      setProfile(updatedProfile)
      localStorage.setItem("name", newName)
      localStorage.setItem("email", newEmail)

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          Number(user.UserID || user.ID) === Number(userID)
            ? { ...user, Name: newName, Email: newEmail }
            : user
        )
      )

      setIsEditingProfile(false)
      setProfileMessage("Profile updated successfully.")
    } catch (error) {
      console.error(error)
      setProfileMessage("Profile update failed. Check the API update route.")
    } finally {
      setProfileSaving(false)
    }
  }

  const displayName = cleanName(profile?.Name || storedName)
  const displayEmail = profile?.Email || storedEmail || "N/A"

  const filteredUsers = users.filter((user) =>
    matchesSearch([
      user.UserID,
      user.UserName,
      cleanName(user.Name),
      user.Email,
      user.IsAdmin ? "Admin" : "Non-Admin"
    ])
  )

  const filteredOrders = orders.filter((order) =>
    matchesSearch([
      order.OrderID,
      order.Customer,
      order.StreetAddress,
      order.Suburb,
      order.State,
      order.PostCode
    ])
  )

  const filteredProducts = products.filter((product) =>
    matchesSearch([
      product.itemID,
      product.productID,
      product.product,
      product.genre,
      product.subGenre,
      product.source,
      product.quantity,
      product.price
    ])
  )

  return (
    <div className="employee-page">
      <h1 className="employee-page-title">Employee Dashboard</h1>

      <div className="employee-hero">
        <div className="employee-avatar">
          {displayName
            ?.split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </div>

        <div className="employee-user-info">
          <p>Welcome back, {displayName}</p>
          <span>@{username}</span>
        </div>

        <button className="employee-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="employee-profile-card">
        <div className="employee-profile-title-row">
          <h2>Employee Profile</h2>

          {!isEditingProfile && (
            <button
              type="button"
              className="employee-edit-profile-btn"
              onClick={startEditProfile}
            >
              Edit Profile
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="employee-profile-grid">
            <div>
              <span>Username</span>
              <strong>{username}</strong>
            </div>

            <div>
              <span>Name</span>
              <strong>{displayName}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{displayEmail}</strong>
            </div>
          </div>
        ) : (
          <form className="employee-edit-profile-form" onSubmit={saveProfile}>
            <div className="employee-edit-field">
              <label>Username</label>
              <input type="text" value={username || ""} disabled />
            </div>

            <div className="employee-edit-field">
              <label>Name</label>
              <input
                type="text"
                value={editProfile.name}
                onChange={(event) =>
                  setEditProfile({ ...editProfile, name: event.target.value })
                }
              />
            </div>

            <div className="employee-edit-field">
              <label>Email</label>
              <input
                type="email"
                value={editProfile.email}
                onChange={(event) =>
                  setEditProfile({ ...editProfile, email: event.target.value })
                }
              />
            </div>

            <div className="employee-edit-actions">
              <button
                type="button"
                className="employee-cancel-profile-btn"
                onClick={cancelEditProfile}
                disabled={profileSaving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="employee-save-profile-btn"
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {profileMessage && (
          <p className="employee-profile-message">{profileMessage}</p>
        )}
      </div>

      <div className="employee-control-bar">
        <div className="employee-switch-bar">
          <button
            type="button"
            className={activeSection === "users" ? "active" : ""}
            onClick={() => handleSectionChange("users")}
          >
            Customers
          </button>

          <button
            type="button"
            className={activeSection === "orders" ? "active" : ""}
            onClick={() => handleSectionChange("orders")}
          >
            Orders
          </button>

          <button
            type="button"
            className={activeSection === "products" ? "active" : ""}
            onClick={() => handleSectionChange("products")}
          >
            Products
          </button>
        </div>

        <input
          className="employee-search"
          type="text"
          placeholder="Search current section..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {activeSection === "users" && (
        <section className="employee-section">
          <h2>Review Customers</h2>

          <div className="employee-table simple">
            <div className="employee-table-header simple">
              <span>User ID</span>
              <span>Username</span>
              <span>Name</span>
              <span>Email</span>
            </div>

            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div className="employee-table-row simple" key={user.UserID}>
                  <span>#{user.UserID}</span>
                  <span>{safeText(user.UserName)}</span>
                  <span>{cleanName(user.Name)}</span>
                  <span>{safeText(user.Email)}</span>
                </div>
              ))
            ) : (
              <p className="employee-empty">No non-admin accounts found.</p>
            )}
          </div>
        </section>
      )}

      {activeSection === "orders" && (
        <section className="employee-section">
          <h2>Existing Orders</h2>

          <div className="employee-table orders">
            <div className="employee-table-header orders">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Address</span>
              <span>Suburb</span>
              <span>State</span>
              <span>Post Code</span>
              <span>Items</span>
            </div>

            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <div className="employee-table-row orders" key={order.OrderID}>
                  <span>#{order.OrderID}</span>
                  <span>#{order.Customer}</span>
                  <span>{safeText(order.StreetAddress)}</span>
                  <span>{safeText(order.Suburb)}</span>
                  <span>{safeText(order.State)}</span>
                  <span>{safeText(order.PostCode)}</span>
                  <span>{order["ProductsInOrders List"]?.length || 0}</span>
                </div>
              ))
            ) : (
              <p className="employee-empty">No orders found.</p>
            )}
          </div>
        </section>
      )}

      {activeSection === "products" && (
        <section className="employee-section">
          <h2>Product Tracking</h2>

          <div className="employee-table products">
            <div className="employee-table-header products">
              <span>ID</span>
              <span>Product</span>
              <span>Genre</span>
              <span>Sub Genre</span>
              <span>Source</span>
              <span>Quantity</span>
              <span>Price</span>
            </div>

            {filteredProducts.length > 0 ? (
              filteredProducts.map((item, index) => (
                <div
                  className="employee-table-row products"
                  key={`${item.itemID}-${index}`}
                >
                  <span>#{item.productID}</span>
                  <span>{item.product}</span>
                  <span>{item.genre}</span>
                  <span>{item.subGenre}</span>
                  <span>{item.source}</span>
                  <span>{item.quantity}</span>
                  <span>S${Number(item.price || 0).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="employee-empty">No tracked products found.</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default Employee
