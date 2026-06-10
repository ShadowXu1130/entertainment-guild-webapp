import { useEffect, useState } from "react"

function Products() {

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

  return (
    <div>

      <h1>Products</h1>

      {products.map((product) => (
        <div key={product.ID}>
          <h3>{product.Name}</h3>
          <p>{product.Author}</p>
        </div>
      ))}

    </div>
  )
}

export default Products