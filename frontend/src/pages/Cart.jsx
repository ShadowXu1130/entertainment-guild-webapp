import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Cart() {
  const [cartItems, setCartItems] = useState([])
  const [openDetails, setOpenDetails] = useState({})

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

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const totalPrice = totalItems * 19.99

  return (
    <div className="apple-cart-page">
      <h1>Your bag total is S${totalPrice.toFixed(2)}.</h1>
      <p className="cart-subtitle">Get free delivery on all products.</p>

      <div className="cart-top-buttons">
        <button className="apple-pay-btn">Check Out with Apple Pay</button>
        <button className="blue-checkout-btn">Check Out</button>
      </div>

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
                <strong>S${(item.quantity * 19.99).toFixed(2)}</strong>

                <button onClick={() => removeItem(item.ID)}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="apple-summary">
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
              <button className="apple-pay-btn">Check Out with Apple Pay</button>
              <button className="blue-checkout-btn">Check Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart