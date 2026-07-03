import { useEffect, useState } from "react"

function Profile() {
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [showContactModal, setShowContactModal] = useState(false)

  const [editingContact, setEditingContact] = useState({
    Email: "",
    PhoneNumber: ""
  })

  const username = localStorage.getItem("username")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const userRes = await fetch(`/api-profile-user/${username}`)
    const currentUser = await userRes.json()

    if (!userRes.ok) {
      alert("User record not found")
      return
    }

    setUser(currentUser)

    if (!currentUser) return

    const customerRes = await fetch("/api/inft3050/TO?limit=1000")
    const customerData = await customerRes.json()

    const currentCustomer = customerData.list.find(
      (c) => Number(c.PatronId) === Number(currentUser.UserID)
    )

    setCustomer(currentCustomer)

    if (!currentCustomer) return

    setEditingContact({
      Email: currentCustomer.Email || "",
      PhoneNumber: currentCustomer.PhoneNumber || ""
    })

    const orderRes = await fetch("/api/inft3050/Orders?limit=1000")
    const orderData = await orderRes.json()

    const customerOrders = orderData.list.filter(
      (order) => Number(order.Customer) === Number(currentCustomer.CustomerID)
    )

    setOrders(customerOrders)
  }

  const handleUpdateContact = async () => {
  try {
    const response = await fetch(
      `/api-edit-user/${user.UserID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Email: editingContact.Email
        })
      }
    )

    if (!response.ok) {
      alert(await response.text())
      return
    }

    alert("Email updated successfully")

    setShowContactModal(false)
    loadProfile()
  } catch (error) {
    console.error(error)
    alert("Update failed")
  }
}

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") return "N/A"
    return String(value)
  }

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">
          {username?.slice(0, 2).toUpperCase()}
        </div>

        <div className="profile-hero-info">
          <h1>{safeText(user?.Name)}</h1>
          <p>{safeText(customer?.Email || user?.Email)}</p>
          <span>Customer Profile</span>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-card">
          <h2>Account</h2>

          <div className="profile-row">
            <span className="profile-label">Username</span>
            <span className="profile-value">{safeText(user?.UserName)}</span>
          </div>

          <div className="profile-row">
            <span className="profile-label">User ID</span>
            <span className="profile-value">#{safeText(user?.UserID)}</span>
          </div>

          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className="profile-value">
              {user?.IsAdmin ? "Admin" : "Customer"}
            </span>
          </div>
        </div>

        <div className="profile-card">
          <h2>Contact</h2>

          <div className="profile-row">
            <span>Email</span>
            <strong>{safeText(user?.Email)}</strong>
          </div>

          <button
            className="profile-edit-btn"
            onClick={() => {
              setEditingContact({
                Email: user?.Email || ""
              })
              setShowContactModal(true)
            }}
          >
            Edit Email
          </button>
        </div>

        <div className="profile-card wide">
          <h2>Address</h2>

          <div className="profile-address">
            <p>{safeText(customer?.StreetAddress)}</p>
            <p>
              {safeText(customer?.Suburb)}, {safeText(customer?.State)}{" "}
              {safeText(customer?.PostCode)}
            </p>
          </div>
        </div>

        <div className="profile-card wide">
          <h2>Order History</h2>

          {orders.length === 0 ? (
            <p className="profile-empty">No orders found.</p>
          ) : (
            <table className="profile-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Address</th>
                  <th>Suburb</th>
                  <th>State</th>
                  <th>Post Code</th>
                  <th>Items</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.OrderID}>
                    <td>#{order.OrderID}</td>
                    <td>{safeText(order.StreetAddress)}</td>
                    <td>{safeText(order.Suburb)}</td>
                    <td>{safeText(order.State)}</td>
                    <td>{safeText(order.PostCode)}</td>
                    <td>{order["ProductsInOrders List"]?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showContactModal && (
        <div className="modal-overlay">
          <div className="modal contact-modal">
            <h3>Edit Email</h3>

            <div className="modal-form">
              <label>Email</label>

              <input
                type="email"
                value={editingContact.Email}
                onChange={(e) =>
                  setEditingContact({
                    ...editingContact,
                    Email: e.target.value
                  })
                }
              />

              <div className="modal-actions">
                <button
                  className="modal-save-btn"
                  onClick={handleUpdateContact}
                >
                  Save Changes
                </button>

                <button
                  className="modal-cancel-btn"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile