import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [genreName, setGenreName] = useState("")
  const [subGenreName, setSubGenreName] = useState("")
  const [sourceNames, setSourceNames] = useState([])
  const [sourceLink, setSourceLink] = useState("")

  useEffect(() => {
    fetch(`http://localhost:3001/api/inft3050/Product/${id}`)
      .then((response) => response.json())
      .then((data) => {
        setProduct(data)

        fetch("http://localhost:3001/api/inft3050/Genre")
          .then((response) => response.json())
          .then((genreData) => {
            const genre = genreData.list.find((genre) =>
              genre["Product List"].some((item) => item.ID === data.ID)
            )

            if (genre) {
              setGenreName(genre.Name)

              let subGenreApi = ""

              if (genre.GenreID === 1) {
                subGenreApi = "BookGenre"
              } else if (genre.GenreID === 2) {
                subGenreApi = "MovieGenre"
              } else if (genre.GenreID === 3) {
                subGenreApi = "GameGenre"
              }

              if (subGenreApi) {
                fetch(`http://localhost:3001/api/inft3050/${subGenreApi}`)
                  .then((response) => response.json())
                  .then((subGenreData) => {
                    const subGenre = subGenreData.list.find(
                      (item) => item.SubGenreID === data.SubGenre
                    )

                    if (subGenre) {
                      setSubGenreName(subGenre.Name)
                    }
                  })
              }
            }
          })

        fetch("http://localhost:3001/api/inft3050/Source")
          .then((response) => response.json())
          .then((sourceData) => {
            const matchedSources = sourceData.list.filter((source) =>
              source["Stocktake List"].some((item) => item.ItemId === data.ID)
            )

            setSourceNames(matchedSources.map((source) => source.SourceName))

            const firstSourceWithLink = matchedSources.find(
              (source) => source.ExternalLink
            )

            if (firstSourceWithLink) {
              setSourceLink(firstSourceWithLink.ExternalLink)
            }
          })
      })
      .catch((error) => {
        console.log(error)
      })
  }, [id])

  if (!product) {
    return <p>Loading product details...</p>
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-card">
        <div className="product-image-placeholder">
          <img
            src={`/Pictures/${product.ID}.jpeg`}
            alt={product.Name}
            className="detail-cover"
          />
        </div>

        <div className="product-detail-info">
          <h1>{product.Name}</h1>

          <p><strong>ID:</strong> {product.ID}</p>
          <p><strong>Author:</strong> {product.Author || "N/A"}</p>
          <p><strong>Genre:</strong> {genreName || "N/A"}</p>
          <p><strong>Sub Genre:</strong> {subGenreName || "N/A"}</p>

          <p>
            <strong>Source:</strong>{" "}
            {sourceNames.length > 0 ? sourceNames.join(", ") : "N/A"}
          </p>

          {sourceLink && (
            <p>
              <a
                href={sourceLink}
                target="_blank"
                rel="noreferrer"
              >
                Visit Source
              </a>
            </p>
          )}

          <p>
            <strong>Published:</strong>{" "}
            {product.Published
              ? new Date(product.Published).getFullYear()
              : "N/A"}
          </p>

          <h3>Description</h3>

          <p className="product-description">
            {product.Description || "No description available."}
          </p>

          <button>Add to Cart</button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail