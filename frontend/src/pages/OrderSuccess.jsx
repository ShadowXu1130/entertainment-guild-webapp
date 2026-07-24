import { Link, useLocation } from "react-router-dom"

/**
 * Order confirmation page displayed after a successful checkout.
 *
 * The page receives the order identifier and total amount through
 * React Router navigation state and confirms that the order has
 * been created successfully.
 */
function OrderSuccess() {
    // Retrieve the order summary passed from the checkout page.
  const location = useLocation()
  const orderID = location.state?.orderID
  const total = Number(location.state?.total || 0)
  return <div className="order-success-page"><div className="order-success-card"><div className="order-success-icon">✓</div><h1>Order Confirmed</h1><p>Your order was saved successfully.</p>{orderID && <p><strong>Order ID:</strong> #{orderID}</p>}<p><strong>Total:</strong> S${total.toFixed(2)}</p><Link to="/">Continue Shopping</Link></div></div>
}

export default OrderSuccess
