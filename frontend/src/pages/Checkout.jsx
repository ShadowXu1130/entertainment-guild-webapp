import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Checkout() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [formData, setFormData] = useState({ streetAddress: "", suburb: "", state: "", postCode: "" })
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userType = localStorage.getItem("userType")
    if (!isLoggedIn) return navigate("/login")
    if (userType !== "customer") return navigate("/")
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    if (!cart.length) return navigate("/cart")
    setCartItems(cart)
  }, [navigate])

  const handleChange = (e) => setFormData((current) => ({ ...current, [e.target.name]: e.target.value }))
  const getItemPrice = (item) => Number(item.price || item.Price || 0)
  const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + getItemPrice(item) * Number(item.quantity || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    const userID = Number(localStorage.getItem("userID"))

if (!userID) {
  return setMessage(
    "Customer information is unavailable. Please login again."
  )
}

const invalidItem = cartItems.find((item) => {
  const itemID = Number(
    item.ItemId ??
    item.ItemID ??
    item.itemID ??
    item.stockItemID ??
    0
  )

  const sourceID = Number(
    item.SourceId ??
    item.SourceID ??
    item.sourceID ??
    0
  )

  return !itemID || !sourceID
})

if (invalidItem) {
  return setMessage(
    `"${invalidItem.Name}" is missing ItemId or SourceId. Remove it from the cart and add it again.`
  )
}

setIsSubmitting(true)
    try {
      const response = await fetch("http://localhost:5050/api-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID,
          username: localStorage.getItem("username") || "",
          name: localStorage.getItem("name") || "",
          email: localStorage.getItem("email") || "",
          streetAddress: formData.streetAddress.trim(),
          suburb: formData.suburb.trim(),
          state: formData.state.trim().toUpperCase(),
          postCode: formData.postCode.trim(),
          items: cartItems.map((item) => ({
            productID: Number(item.ID),
            quantity: Number(item.quantity),
            price: getItemPrice(item),
            itemID: Number(item.ItemId || item.ItemID || item.itemID || 0),
            sourceID: Number(item.SourceId || item.SourceID || item.sourceID || 0)
          }))
        })
      })
      const text = await response.text()
      if (!response.ok) return setMessage(text || "Failed to create order.")
      let result = {}
      try { result = JSON.parse(text) } catch { result = { message: text } }
      localStorage.removeItem("cart")
      navigate("/order-success", { state: { orderID: result.OrderID || result.orderID || result.id, total: totalPrice } })
    } catch (error) {
      console.error(error)
      setMessage("Could not connect to the order server.")
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <form className="checkout-form-card" onSubmit={handleSubmit}>
          <h2>Delivery Information</h2>
          <label>Street Address</label>
          <input name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="45 Rainbow Road" required />
          <label>Suburb</label>
          <input name="suburb" value={formData.suburb} onChange={handleChange} placeholder="Marrickville" required />
          <label>State</label>
          <select name="state" value={formData.state} onChange={handleChange} required>
            <option value="">Select state</option><option value="ACT">ACT</option><option value="NSW">NSW</option><option value="NT">NT</option><option value="QLD">QLD</option><option value="SA">SA</option><option value="TAS">TAS</option><option value="VIC">VIC</option><option value="WA">WA</option>
          </select>
          <label>Post Code</label>
          <input name="postCode" value={formData.postCode} onChange={handleChange} placeholder="2204" pattern="[0-9]{4}" maxLength="4" required />
          <button type="submit" className="checkout-place-order-btn" disabled={isSubmitting}>{isSubmitting ? "Saving Order..." : "Place Order"}</button>
          {message && <p className="checkout-message">{message}</p>}
        </form>
        <div className="checkout-summary-card">
          <h2>Order Summary</h2>
          {cartItems.map((item) => <div className="checkout-summary-item" key={item.ID}><div><strong>{item.Name}</strong><p>Quantity: {item.quantity}</p></div><span>S${(getItemPrice(item) * item.quantity).toFixed(2)}</span></div>)}
          <div className="checkout-summary-row"><span>Total items</span><strong>{totalItems}</strong></div>
          <div className="checkout-summary-row"><span>Shipping</span><strong>FREE</strong></div>
          <div className="checkout-summary-total"><span>Total</span><strong>S${totalPrice.toFixed(2)}</strong></div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
