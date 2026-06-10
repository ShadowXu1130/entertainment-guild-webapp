import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Home() {
  const [products, setProducts] = useState([])

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

  const mostSold = products.slice(0, 3)
  const bestReview = products.slice(3, 6)

  return (
    <div className="home-page">
      <section>
        <div className="section-title">
          Most sold
        </div>

        <div className="home-product-grid">
          {mostSold.map((product) => (
            <Link
              key={product.ID}
              to={`/products/${product.ID}`}
              className="home-product-card home-product-card-link"
            >
              <h3>{product.Name}</h3>
              <p>{product.Author || "N/A"}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">
          Best review
        </div>

        <div className="home-product-grid">
          {bestReview.map((product) => (
            <Link
              key={product.ID}
              to={`/products/${product.ID}`}
              className="home-product-card home-product-card-link"
            >
              <h3>{product.Name}</h3>
              <p>{product.Author || "N/A"}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home