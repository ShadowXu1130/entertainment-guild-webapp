import { Link, useLocation } from "react-router-dom"

function OrderSuccess() {
  const location = useLocation()
  const orderID = location.state?.orderID
  const total = Number(location.state?.total || 0)
  return <div className="order-success-page"><div className="order-success-card"><div className="order-success-icon">✓</div><h1>Order Confirmed</h1><p>Your order was saved successfully.</p>{orderID && <p><strong>Order ID:</strong> #{orderID}</p>}<p><strong>Total:</strong> S${total.toFixed(2)}</p><Link to="/">Continue Shopping</Link></div></div>
}

export default OrderSuccess
