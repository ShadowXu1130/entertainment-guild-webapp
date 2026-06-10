import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("http://localhost:3001/api/inft3050/Product")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.list)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  const filteredProducts = products.filter((product) =>
    product.Name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="products-page">
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="product-search"
      />

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div className="product-card" key={product.ID}>
            <h3>{product.Name}</h3>

            <p>
              <strong>Author:</strong> {product.Author}
            </p>

            <Link to={`/products/${product.ID}`}>
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Products