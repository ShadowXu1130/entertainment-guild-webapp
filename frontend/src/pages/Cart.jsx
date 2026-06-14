import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [openDetails, setOpenDetails] = useState({})
  const [paymentStatus, setPaymentStatus] = useState("")

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    setCartItems(cart)
  }, [])

  const updateQuantity = (id, change) => {
    const updatedCart = cartItems.map((item) => {
      if (item.ID === id) {
        return {
          ...item,
          quantity: Math.max(1, item.quantity + change)
        }
      }

      return item
    })

    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
  }

  const removeItem = (id) => {
    const updatedCart = cartItems.filter((item) => item.ID !== id)

    setCartItems(updatedCart)
    localStorage.setItem("cart", JSON.stringify(updatedCart))
  }

  const toggleDetails = (id) => {
    setOpenDetails({
      ...openDetails,
      [id]: !openDetails[id]
    })
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setPaymentStatus("empty")
      return
    }

    const results = ["approved", "declined", "timed-out"]
    const randomResult = results[Math.floor(Math.random() * results.length)]

    setPaymentStatus(randomResult)

    if (randomResult === "approved") {
      localStorage.removeItem("cart")
      setCartItems([])
      setOpenDetails({})
    }
  }

  const getItemPrice = (item) => {
    return Number(item.price || item.Price || 0)
  }

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  )

  return (
    <div className="apple-cart-page">
      <h1>Your bag total is S${totalPrice.toFixed(2)}.</h1>
      <p className="cart-subtitle">Get free delivery on all products.</p>

      <div className="cart-top-buttons">
        <button className="apple-pay-btn" onClick={handleCheckout}>
          Check Out with Apple Pay
        </button>

        <button className="blue-checkout-btn" onClick={handleCheckout}>
          Check Out
        </button>
      </div>

      {paymentStatus && (
        <div className={`payment-message ${paymentStatus}`}>
          {paymentStatus === "approved" && "Payment approved. Order completed."}
          {paymentStatus === "declined" && "Payment declined. Please try again."}
          {paymentStatus === "timed-out" && "Payment timed out. Please retry checkout."}
          {paymentStatus === "empty" && "Your cart is empty. Please add products before checkout."}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <Link to="/">Continue Shopping</Link>
        </div>
      ) : (
        <div className="apple-cart-container">
          {cartItems.map((item) => (
            <div className="apple-cart-item" key={item.ID}>
              <div className="apple-cart-image-wrap">
                <img
                  src={`/Pictures/${item.ID}.jpeg`}
                  alt={item.Name}
                  className="apple-cart-image"
                />
              </div>

              <div className="apple-cart-main">
                <h2>{item.Name}</h2>

                <button
                  className="details-link"
                  onClick={() => toggleDetails(item.ID)}
                >
                  {openDetails[item.ID]
                    ? "Hide product details⌃"
                    : "Show product details⌄"}
                </button>

                {openDetails[item.ID] && (
                  <div className="cart-product-details">
                    <p><strong>ID:</strong> {item.ID}</p>
                    <p><strong>Author:</strong> {item.Author || "N/A"}</p>
                    <p><strong>Genre:</strong> {item.genreName || "N/A"}</p>
                    <p><strong>Sub Genre:</strong> {item.subGenreName || "N/A"}</p>
                    <p><strong>Unit Price:</strong> S${getItemPrice(item).toFixed(2)}</p>
                    <p><strong>Available Quantity:</strong> {item.quantityAvailable || "N/A"}</p>

                    <p className="cart-detail-description">
                      {item.Description || "No description available."}
                    </p>
                  </div>
                )}
              </div>

              <div className="apple-cart-quantity">
                <button onClick={() => updateQuantity(item.ID, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.ID, 1)}>+</button>
              </div>

              <div className="apple-cart-price">
                <strong>
                  S${(getItemPrice(item) * item.quantity).toFixed(2)}
                </strong>

                <button onClick={() => removeItem(item.ID)}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="apple-summary">
            <div>
              <span>Items</span>
              <span>{totalItems}</span>
            </div>

            <div>
              <span>Subtotal</span>
              <span>S${totalPrice.toFixed(2)}</span>
            </div>

            <div>
              <span>Shipping</span>
              <span>FREE</span>
            </div>

            <hr />

            <div className="apple-total">
              <strong>Your Total</strong>
              <strong>S${totalPrice.toFixed(2)}</strong>
            </div>

            <p>Includes GST where applicable.</p>

            <div className="cart-bottom-buttons">
              <button className="apple-pay-btn" onClick={handleCheckout}>
                Check Out with Apple Pay
              </button>

              <button className="blue-checkout-btn" onClick={handleCheckout}>
                Check Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart