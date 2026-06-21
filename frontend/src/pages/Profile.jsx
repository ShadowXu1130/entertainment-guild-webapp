// import { useEffect, useState } from "react"

// function Profile() {
//   const [user, setUser] = useState(null)
//   const [cartItems, setCartItems] = useState([])

//   const userID = localStorage.getItem("userID")
//   const username = localStorage.getItem("username")
//   const isAdmin = localStorage.getItem("isAdmin") === "true"

//   useEffect(() => {
//     fetch(`/api/inft3050/User/${userID}`, {
//       credentials: "include"
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         setUser(data)
//       })
//       .catch((error) => {
//         console.log(error)
//       })

//     const cart = JSON.parse(localStorage.getItem("cart")) || []
//     setCartItems(cart)
//   }, [userID])

//   const handleLogout = () => {
//     localStorage.removeItem("isLoggedIn")
//     localStorage.removeItem("userID")
//     localStorage.removeItem("username")
//     localStorage.removeItem("userType")
//     localStorage.removeItem("isAdmin")

//     window.location.href = "http://localhost:5173/login"
//   }

//   const getInitials = () => {
//     const name = user?.Name || username || "User"
//     return name
//       .split(" ")
//       .map((word) => word[0])
//       .join("")
//       .toUpperCase()
//       .slice(0, 2)
//   }

//   return (
//     <div className="profile-page">
//       <div className="profile-header">
//         <div className="profile-avatar">{getInitials()}</div>

//         <div>
//           <h1>{user?.Name || username}</h1>
//           <p>@{username}</p>
//         </div>
//       </div>

//       <div className="profile-info-grid">
//         <div className="profile-info-card">
//           <p>User ID</p>
//           <h3>{userID}</h3>
//         </div>

//         <div className="profile-info-card">
//           <p>Role</p>
//           <h3>{isAdmin ? "Administrator" : "Customer"}</h3>
//         </div>
//       </div>

//       {isAdmin ? (
//         <div className="profile-list-card">
//           <h2>
//             Product List{" "}
//             <span>{user?.["Product List"]?.length || 0} items</span>
//           </h2>

//           {user?.["Product List"]?.length > 0 ? (
//             user["Product List"].map((product) => (
//               <div className="profile-list-row" key={product.ID}>
//                 <span>{product.Name}</span>
//                 <span>#{product.ID}</span>
//               </div>
//             ))
//           ) : (
//             <p className="profile-empty">No products found.</p>
//           )}
//         </div>
//       ) : (
//         <div className="profile-list-card">
//           <h2>
//             Shopping Cart{" "}
//             <span>{cartItems.length} items</span>
//           </h2>

//           {cartItems.length > 0 ? (
//             cartItems.map((item) => (
//               <div className="profile-list-row" key={item.ID}>
//                 <span>{item.Name}</span>
//                 <span>Qty: {item.quantity}</span>
//               </div>
//             ))
//           ) : (
//             <p className="profile-empty">Your shopping cart is empty.</p>
//           )}
//         </div>
//       )}

//       <button className="profile-logout" onClick={handleLogout}>
//         Logout
//       </button>
//     </div>
//   )
// }

// export default Profile
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [cartItems, setCartItems] = useState([])

  const userID = localStorage.getItem("userID")
  const username = localStorage.getItem("username")
  const isAdmin = localStorage.getItem("isAdmin") === "true"

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      navigate("/login")
      return
    }

    fetch(`/api/inft3050/User/${userID}`, {
      credentials: "include"
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load user")
        }
        return res.json()
      })
      .then((data) => {
        setUser(data)
      })
      .catch((error) => {
        console.log(error)
      })

    const cart = JSON.parse(localStorage.getItem("cart")) || []
    setCartItems(cart)
  }, [userID, navigate])

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userID")
    localStorage.removeItem("username")
    localStorage.removeItem("userType")
    localStorage.removeItem("isAdmin")

    navigate("/login")
  }

  const getInitials = () => {
    const name = user?.Name || username || "User"

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {getInitials()}
        </div>

        <div>
          <h1>{user?.Name || username}</h1>
          <p>@{username}</p>
        </div>
      </div>

      <div className="profile-info-grid">
        <div className="profile-info-card">
          <p>User ID</p>
          <h3>{userID}</h3>
        </div>

        <div className="profile-info-card">
          <p>Role</p>
          <h3>
            {isAdmin ? "Administrator" : "Customer"}
          </h3>
        </div>
      </div>

      {isAdmin ? (
        <div className="profile-list-card">
          <h2>
            Product List{" "}
            <span>
              {user?.["Product List"]?.length || 0} items
            </span>
          </h2>

          {user?.["Product List"]?.length > 0 ? (
            user["Product List"].map((product) => (
              <div
                className="profile-list-row"
                key={product.ID}
              >
                <span>{product.Name}</span>
                <span>#{product.ID}</span>
              </div>
            ))
          ) : (
            <p className="profile-empty">
              No products found.
            </p>
          )}
        </div>
      ) : (
        <div className="profile-list-card">
          <h2>
            Shopping Cart{" "}
            <span>{cartItems.length} items</span>
          </h2>

          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div
                className="profile-list-row"
                key={index}
              >
                <span>
                  {item.Name ||
                    item.name ||
                    "Unknown Product"}
                </span>

                <span>
                  Qty: {item.quantity || 1}
                </span>
              </div>
            ))
          ) : (
            <p className="profile-empty">
              Your shopping cart is empty.
            </p>
          )}
        </div>
      )}

      <button
        className="profile-logout"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  )
}

export default Profile