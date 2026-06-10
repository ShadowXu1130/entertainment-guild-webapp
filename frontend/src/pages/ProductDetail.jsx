import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"

function ProductDetail() {

  const { id } = useParams()

  const [product, setProduct] = useState(null)

  useEffect(() => {

    fetch(`http://localhost:3001/api/inft3050/Product/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setProduct(data)
      })
      .catch((error) => {
        console.log(error)
      })

  }, [id])

  if (!product) {
    return <h2>Loading...</h2>
  }

  return (
    <div>

      <h1>{product.Name}</h1>

      <h3>{product.Author}</h3>

      <p>{product.Description}</p>

      <p>
        Published:
        {" "}
        {product.Published}
      </p>

    </div>
  )
}

export default ProductDetail