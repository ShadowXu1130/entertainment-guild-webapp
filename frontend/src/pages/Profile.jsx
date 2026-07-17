import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  const [showContactModal, setShowContactModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)

  const [editingContact, setEditingContact] = useState({
    Email: "",
    PhoneNumber: ""
  })

  const [editingAddress, setEditingAddress] = useState({
    StreetAddress: "",
    Suburb: "",
    State: "",
    PostCode: ""
  })

  const username = localStorage.getItem("username")
  const unavailableText = "Not available for this account"

  useEffect(() => {
    loadProfile()
  }, [])

  const safeText = (value) => {
    if (value === null || value === undefined || value === "") {
      return unavailableText
    }

    return String(value)
  }

  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return unavailableText

    const value = String(cardNumber)
    return `**** **** **** ${value.slice(-4)}`
  }

  const loadProfile = async () => {
    const userRes = await fetch(`/api-profile-user/${username}`)
    const currentUser = await userRes.json()

    if (!userRes.ok) {
      alert("User record not found")
      return
    }

    setUser(currentUser)

    const customerRes = await fetch("/api/inft3050/TO?limit=1000")
    const customerData = await customerRes.json()

    const currentCustomer =
      customerData.list.find(
        (c) =>
          Number(c.PatronId) === Number(currentUser.UserID)
      ) ||
      customerData.list.find(
        (c) =>
          String(c.Email || "")
            .trim()
            .toLowerCase() ===
          String(currentUser.Email || "")
            .trim()
            .toLowerCase()
      )

    setCustomer(currentCustomer || null)

    setEditingContact({
      Email: currentCustomer?.Email || currentUser.Email || "",
      PhoneNumber: currentCustomer?.PhoneNumber || ""
    })

    setEditingAddress({
      StreetAddress: currentCustomer?.StreetAddress || "",
      Suburb: currentCustomer?.Suburb || "",
      State: currentCustomer?.State || "",
      PostCode: currentCustomer?.PostCode || ""
    })

    if (!currentCustomer) {
      setOrders([])
      return
    }

    const orderRes = await fetch("/api/inft3050/Orders?limit=1000")
    const orderData = await orderRes.json()

    const customerOrders = orderData.list.filter(
      (order) => Number(order.Customer) === Number(currentCustomer.CustomerID)
    )

    setOrders(customerOrders)
  }

  const handleUpdateContact = async () => {
    try {
      if (!user?.UserID) {
        alert("User record not found")
        return
      }

      const response = await fetch(`/api-edit-user/${user.UserID}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Email: editingContact.Email
        })
      })

      const resultText = await response.text()

      if (!response.ok) {
        alert(resultText || "Update failed")
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

  const handleUpdateAddress = async () => {
    try {
      if (!customer?.CustomerID) {
        alert("Customer record not found")
        return
      }

      const response = await fetch(
        `/api-update-customer/${customer.CustomerID}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            StreetAddress: editingAddress.StreetAddress,
            Suburb: editingAddress.Suburb,
            State: editingAddress.State,
            PostCode: editingAddress.PostCode
          })
        }
      )

      const resultText = await response.text()

      if (!response.ok) {
        alert(resultText || "Update failed")
        return
      }

      alert("Address updated successfully")
      setShowAddressModal(false)
      loadProfile()
    } catch (error) {
      console.error(error)
      alert("Update failed")
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
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
            <span className="profile-label">Email</span>
            <span className="profile-value">
              {safeText(customer?.Email || user?.Email)}
            </span>
          </div>

          <div className="profile-row">
            <span className="profile-label">Phone</span>
            <span className="profile-value">
              {safeText(customer?.PhoneNumber)}
            </span>
          </div>

          <button
            className="profile-edit-btn"
            onClick={() => {
              setEditingContact({
                Email: customer?.Email || user?.Email || "",
                PhoneNumber: customer?.PhoneNumber || ""
              })
              setShowContactModal(true)
            }}
          >
            Edit Contact
          </button>
        </div>

        <div className="profile-card wide">
          <h2>Address</h2>

          <div className="profile-address">
            {customer?.CustomerID ? (
              <>
                <p>{safeText(customer?.StreetAddress)}</p>
                <p>
                  {safeText(customer?.Suburb)},
                  {" "}
                  {safeText(customer?.State)}
                  {" "}
                  {safeText(customer?.PostCode)}
                </p>
              </>
            ) : (
              <p>{unavailableText}</p>
            )}
          </div>
        </div>

        <div className="profile-card wide">
          <h2>Payment Information</h2>

          {customer?.CustomerID ? (
            <>
              <div className="profile-row">
                <span className="profile-label">Card Owner</span>
                <span className="profile-value">
                  {safeText(customer?.CardOwner)}
                </span>
              </div>

              <div className="profile-row">
                <span className="profile-label">Card Number</span>
                <span className="profile-value">
                  {maskCardNumber(customer?.CardNumber)}
                </span>
              </div>

              <div className="profile-row">
                <span className="profile-label">Expiry</span>
                <span className="profile-value">
                  {safeText(customer?.Expiry)}
                </span>
              </div>
            </>
          ) : (
            <p className="profile-empty">{unavailableText}</p>
          )}
        </div>

        <div className="profile-card wide">
          <h2>Order History</h2>

          {orders.length === 0 ? (
            <p className="profile-empty">{unavailableText}</p>
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

        <div className="profile-logout-container">
          <button
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>

      </section>

      {showContactModal && (
        <div className="modal-overlay">
          <div className="modal contact-modal">
            <h3>Edit Contact</h3>

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

              <label>Phone Number</label>
              <input
                value={editingContact.PhoneNumber || unavailableText}
                disabled
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

      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal contact-modal">
            <h3>Edit Address</h3>

            <div className="modal-form">
              <label>Street Address</label>
              <input
                value={editingAddress.StreetAddress}
                onChange={(e) =>
                  setEditingAddress({
                    ...editingAddress,
                    StreetAddress: e.target.value
                  })
                }
              />

              <label>Suburb</label>
              <input
                value={editingAddress.Suburb}
                onChange={(e) =>
                  setEditingAddress({
                    ...editingAddress,
                    Suburb: e.target.value
                  })
                }
              />

              <label>State</label>
              <input
                value={editingAddress.State}
                onChange={(e) =>
                  setEditingAddress({
                    ...editingAddress,
                    State: e.target.value
                  })
                }
              />

              <label>Post Code</label>
              <input
                value={editingAddress.PostCode}
                onChange={(e) =>
                  setEditingAddress({
                    ...editingAddress,
                    PostCode: e.target.value
                  })
                }
              />

              <div className="modal-actions">
                <button
                  className="modal-save-btn"
                  onClick={handleUpdateAddress}
                >
                  Save Changes
                </button>

                <button
                  className="modal-cancel-btn"
                  onClick={() => setShowAddressModal(false)}
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