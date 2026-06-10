import { BrowserRouter, Routes, Route } from "react-router-dom"

import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Products from "./pages/Products"
import Cart from "./pages/Cart"
import ProductDetail from "./pages/ProductDetail"
import Movies from "./pages/Movies"
import Games from "./pages/Games"


function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/games" element={<Games />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App