import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Checkout page for collecting delivery and payment details
 * before creating a customer order.
 *
 * The component restores the cart from localStorage, applies a
 * client-side customer route guard, validates checkout data and
 * submits the completed order to the Express backend.
 *
 * Only a masked card number is included in the order request.
 * The CVV is validated in the browser but is never stored or sent.
 */
function Checkout() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [formData, setFormData] = useState({
    streetAddress: "",
    suburb: "",
    state: "",
    postCode: "",
    phoneNumber: "",
    cardOwner: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  })
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
 * Applies the checkout route guard and restores the saved cart.
 *
 * Unauthenticated users are redirected to login, non-customer
 * accounts return to the storefront and empty carts return to
 * the cart page. Backend authorization must still protect the
 * order-creation endpoint.
 */
useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userType = localStorage.getItem("userType")
    if (!isLoggedIn) return navigate("/login")
    if (userType !== "customer") return navigate("/")
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    if (!cart.length) return navigate("/cart")
    setCartItems(cart)
  }, [navigate])

  /**
 * Updates form state and normalizes fields that require a fixed format.
 *
 * Card numbers are grouped into four-digit blocks, expiry dates use
 * MM/YY and numeric-only fields are restricted to their permitted
 * lengths. Final validation is still performed before submission.
 */
const handleChange = (e) => {
    const { name, value } = e.target

    let formattedValue = value

    if (name === "cardNumber") {
      const digitsOnly = value
        .replace(/\D/g, "")
        .slice(0, 16)

      formattedValue = digitsOnly
        .replace(/(\d{4})(?=\d)/g, "$1 ")
    }

    if (name === "expiry") {
      const digitsOnly = value
        .replace(/\D/g, "")
        .slice(0, 4)

      if (digitsOnly.length <= 2) {
        formattedValue = digitsOnly
      } else {
        formattedValue = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`
      }
    }

    if (name === "cvv") {
      formattedValue = value
        .replace(/\D/g, "")
        .slice(0, 3)
    }

    if (name === "postCode") {
      formattedValue = value
        .replace(/\D/g, "")
        .slice(0, 4)
    }

    setFormData((current) => ({
      ...current,
      [name]: formattedValue
    }))
  }
  /**
 * Normalizes product prices because cart items may expose either
 * "price" or "Price" depending on their original API response.
 */
  const getItemPrice = (item) => Number(item.price || item.Price || 0)
  // Calculate the live order summary from the current cart state.
  const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + getItemPrice(item) * Number(item.quantity || 0), 0)

  /**
 * Validates checkout data and creates the order through the backend.
 *
 * Validation confirms that the customer ID is available, every cart
 * item contains its stocktake and source references, and payment fields
 * match the required formats. The request contains delivery details,
 * masked card information and normalized order items.
 *
 * After a successful response, the persisted cart is cleared and the
 * customer is redirected to the order confirmation page.
 */
const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")
    const userID = Number(localStorage.getItem("userID"))
// Validate customer, inventory and payment data before contacting
// the order API so incomplete requests are rejected immediately.

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

const cardDigits = formData.cardNumber.replace(/\D/g, "")

if (cardDigits.length !== 16) {
  return setMessage(
    "Card number must contain exactly 16 digits."
  )
}

const expiryMatch =
  formData.expiry.match(
    /^(\d{2})\/(\d{2})$/
  )

if (!expiryMatch) {
  return setMessage(
    "Expiry must use MM/YY."
  )
}

const expiryMonth =
  Number(expiryMatch[1])

if (
  expiryMonth < 1 ||
  expiryMonth > 12
) {
  return setMessage(
    "Expiry month must be between 01 and 12."
  )
}

if (!/^\d{3}$/.test(formData.cvv)) {
  return setMessage(
    "CVV must contain exactly 3 digits."
  )
}

// Retain only the final four digits for order identification.
// The complete card number and CVV are not included in the request.
const maskedCardNumber = `**** **** **** ${cardDigits.slice(-4)}`

setIsSubmitting(true)
// Submit one normalized order payload to the Express backend.
// The server is responsible for authoritative validation, stock updates
// and creation of the order and product-order relationship records.
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
          phoneNumber: formData.phoneNumber.trim(),
          cardOwner: formData.cardOwner.trim(),
          cardNumber: maskedCardNumber,
          expiry: formData.expiry.trim(),
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

// ======================================================
// Checkout interface rendering
// ======================================================

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
          <label>Phone Number</label>
          <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="0400 000 000"  type="tel"  autoComplete="tel"  required/>

          <h2>Payment Method</h2>

          <label>Cardholder Name</label>
          <input name="cardOwner" value={formData.cardOwner} onChange={handleChange} placeholder="Name on card" autoComplete="cc-name" required />

          <label>Card Number</label>
          <input
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength="19"
            required
          />

          <label>Expiry</label>
          <input
            name="expiry"
            value={formData.expiry}
            onChange={handleChange}
            placeholder="MM/YY"
            inputMode="numeric"
            autoComplete="cc-exp"
            maxLength="5"
            required
          />

          <label>CVV</label>
          <input
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="123"
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength="3"
            required
          />
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
