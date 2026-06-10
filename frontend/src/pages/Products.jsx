import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Products() {

  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {

    fetch("http://localhost:3001/api/inft3050/Genre")
      .then((response) => response.json())
      .then((data) => {

        const booksGenre = data.list.find(
          (genre) => genre.GenreID === 1
        )

        setProducts(booksGenre["Product List"])

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

      <div className="page-header">

        <h1>Books</h1>

        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="product-search"
        />

      </div>

      <div className="product-grid">

        {filteredProducts.map((product) => (

          <div className="product-card" key={product.ID}>

            <h3>{product.Name}</h3>

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