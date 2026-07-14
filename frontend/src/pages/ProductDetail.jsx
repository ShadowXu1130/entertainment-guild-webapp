import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

function ProductDetail() {
  const { id } = useParams()

  const [product, setProduct] = useState(null)
  const [genreName, setGenreName] = useState("")
  const [subGenreName, setSubGenreName] = useState("")
  const [sourceNames, setSourceNames] = useState([])
  const [sourceLink, setSourceLink] = useState("")
  const [price, setPrice] = useState(null)
  const [quantityAvailable, setQuantityAvailable] = useState(null)
  const [imageExtensionIndex, setImageExtensionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const imageExtensions = [".jpeg", ".jpg", ".png", ".webp"]

  useEffect(() => {
    let isMounted = true

    const loadProductDetails = async () => {
      setLoading(true)
      setErrorMessage("")
      setProduct(null)
      setGenreName("")
      setSubGenreName("")
      setSourceNames([])
      setSourceLink("")
      setPrice(null)
      setQuantityAvailable(null)
      setImageExtensionIndex(0)

      try {
        const productResponse = await fetch(
          `http://localhost:3001/api/inft3050/Product/${id}`
        )

        if (!productResponse.ok) {
          throw new Error("Failed to load product")
        }

        const productData = await productResponse.json()

        if (!isMounted) return

        setProduct(productData)

        const [
          genreResponse,
          stocktakeResponse,
          sourceResponse
        ] = await Promise.all([
          fetch(
            "http://localhost:3001/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"
          ),
          fetch(
            "http://localhost:3001/api/inft3050/Stocktake?limit=1000"
          ),
          fetch(
            "http://localhost:3001/api/inft3050/Source?limit=1000"
          )
        ])

        if (!genreResponse.ok) {
          throw new Error("Failed to load genres")
        }

        if (!stocktakeResponse.ok) {
          throw new Error("Failed to load stocktake")
        }

        if (!sourceResponse.ok) {
          throw new Error("Failed to load sources")
        }

        const [
          genreData,
          stocktakeData,
          sourceData
        ] = await Promise.all([
          genreResponse.json(),
          stocktakeResponse.json(),
          sourceResponse.json()
        ])

        if (!isMounted) return

        let matchedGenre = null

        if (
          productData.Genre !== null &&
          productData.Genre !== undefined &&
          productData.Genre !== ""
        ) {
          matchedGenre = (genreData.list || []).find(
            (genre) =>
              Number(genre.GenreID) === Number(productData.Genre)
          )
        }

        if (!matchedGenre) {
          matchedGenre = (genreData.list || []).find((genre) => {
            const productList = genre["Product List"] || []

            return productList.some(
              (item) =>
                Number(item.ID) === Number(productData.ID)
            )
          })
        }

        if (matchedGenre) {
          setGenreName(matchedGenre.Name || "")

          const subGenreApiByGenreID = {
            1: "BookGenre",
            2: "MovieGenre",
            3: "GameGenre"
          }

          const subGenreApi =
            subGenreApiByGenreID[
              Number(matchedGenre.GenreID)
            ]

          if (
            subGenreApi &&
            productData.SubGenre !== null &&
            productData.SubGenre !== undefined &&
            productData.SubGenre !== ""
          ) {
            try {
              const subGenreResponse = await fetch(
                `http://localhost:3001/api/inft3050/${subGenreApi}?limit=1000`
              )

              if (subGenreResponse.ok) {
                const subGenreData =
                  await subGenreResponse.json()

                const matchedSubGenre = (
                  subGenreData.list || []
                ).find(
                  (item) =>
                    Number(item.SubGenreID) ===
                    Number(productData.SubGenre)
                )

                if (matchedSubGenre && isMounted) {
                  setSubGenreName(
                    matchedSubGenre.Name || ""
                  )
                }
              }
            } catch (subGenreError) {
              console.error(
                "Sub genre loading failed:",
                subGenreError
              )
            }
          }
        }

        const matchedStocks = (
          stocktakeData.list || []
        ).filter((stock) => {
          const stockProductID =
            stock.ProductId ||
            stock.ProductID ||
            stock.Productid

          return (
            Number(stockProductID) ===
            Number(productData.ID)
          )
        })

        if (matchedStocks.length > 0) {
          const totalQuantity = matchedStocks.reduce(
            (total, stock) =>
              total + Number(stock.Quantity || 0),
            0
          )

          const availablePrices = matchedStocks
            .map((stock) => Number(stock.Price))
            .filter((stockPrice) =>
              Number.isFinite(stockPrice)
            )

          const lowestPrice =
            availablePrices.length > 0
              ? Math.min(...availablePrices)
              : null

          setQuantityAvailable(totalQuantity)
          setPrice(lowestPrice)

          const sourceIDs = matchedStocks
            .map(
              (stock) =>
                stock.SourceId ||
                stock.SourceID ||
                stock.Sourceid
            )
            .filter(
              (sourceID) =>
                sourceID !== null &&
                sourceID !== undefined &&
                sourceID !== ""
            )

          const matchedSources = (
            sourceData.list || []
          ).filter((source) => {
            const sourceID =
              source.SourceId ||
              source.SourceID ||
              source.Sourceid

            return sourceIDs.some(
              (matchedSourceID) =>
                Number(sourceID) ===
                Number(matchedSourceID)
            )
          })

          const uniqueSourceNames = [
            ...new Set(
              matchedSources
                .map(
                  (source) =>
                    source.SourceName ||
                    source.Source_name ||
                    source.Name
                )
                .filter(Boolean)
            )
          ]

          setSourceNames(uniqueSourceNames)

          const firstSourceWithLink =
            matchedSources.find(
              (source) =>
                source.ExternalLink ||
                source.External_Link ||
                source.Link ||
                source.URL
            )

          setSourceLink(
            firstSourceWithLink?.ExternalLink ||
              firstSourceWithLink?.External_Link ||
              firstSourceWithLink?.Link ||
              firstSourceWithLink?.URL ||
              ""
          )
        } else {
          setQuantityAvailable(0)
          setPrice(null)
          setSourceNames([])
          setSourceLink("")
        }
      } catch (error) {
        console.error(error)

        if (isMounted) {
          setErrorMessage(
            error.message ||
              "Failed to load product details"
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProductDetails()

    return () => {
      isMounted = false
    }
  }, [id])

  const handleImageError = (event) => {
    const nextIndex = imageExtensionIndex + 1

    if (nextIndex < imageExtensions.length) {
      setImageExtensionIndex(nextIndex)
      return
    }

    event.currentTarget.onerror = null
    event.currentTarget.src =
      "/Pictures/placeholder.jpeg"
  }

  const addToCart = () => {
    if (!product) return

    if (
      quantityAvailable === null ||
      quantityAvailable <= 0
    ) {
      alert("This product is currently out of stock")
      return
    }

    const cart =
      JSON.parse(localStorage.getItem("cart")) || []

    const existingItem = cart.find(
      (item) =>
        Number(item.ID) === Number(product.ID)
    )

    if (existingItem) {
      if (
        Number(existingItem.quantity) >=
        Number(quantityAvailable)
      ) {
        alert(
          "You cannot add more than the available quantity"
        )
        return
      }

      existingItem.quantity += 1
      existingItem.quantityAvailable =
        quantityAvailable
      existingItem.price = price
    } else {
      cart.push({
        ...product,
        genreName,
        subGenreName,
        sourceNames,
        sourceLink,
        price,
        quantityAvailable,
        quantity: 1
      })
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    )

    alert(`${product.Name} added to cart`)
  }

  if (loading) {
    return (
      <p className="product-detail-status">
        Loading product details...
      </p>
    )
  }

  if (errorMessage) {
    return (
      <p className="product-detail-status">
        {errorMessage}
      </p>
    )
  }

  if (!product) {
    return (
      <p className="product-detail-status">
        Product not found.
      </p>
    )
  }

  const productImagePath = `/Pictures/${
    product.ID
  }${imageExtensions[imageExtensionIndex]}`

  const formattedPrice =
    price !== null &&
    Number.isFinite(Number(price))
      ? `S$${Number(price).toFixed(2)}`
      : "N/A"

  const formattedQuantity =
    quantityAvailable !== null &&
    quantityAvailable !== undefined
      ? quantityAvailable
      : "N/A"

  return (
    <div className="product-detail-page">
      <div className="product-detail-card">
        <div className="product-image-placeholder">
          <img
            src={productImagePath}
            alt={product.Name || "Product image"}
            className="detail-cover"
            onError={handleImageError}
          />
        </div>

        <div className="product-detail-info">
          <h1>{product.Name || "Unnamed Product"}</h1>

          <p>
            <strong>ID:</strong> {product.ID}
          </p>

          <p>
            <strong>Author:</strong>{" "}
            {product.Author || "N/A"}
          </p>

          <p>
            <strong>Genre:</strong>{" "}
            {genreName || "N/A"}
          </p>

          <p>
            <strong>Sub Genre:</strong>{" "}
            {subGenreName || "N/A"}
          </p>

          <p>
            <strong>Price:</strong>{" "}
            {formattedPrice}
          </p>

          <p>
            <strong>Available Quantity:</strong>{" "}
            {formattedQuantity}
          </p>

          <p>
            <strong>Source:</strong>{" "}
            {sourceNames.length > 0
              ? sourceNames.join(", ")
              : "N/A"}
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
              ? new Date(
                  product.Published
                ).getFullYear()
              : "N/A"}
          </p>

          <h3>Description</h3>

          <p className="product-description">
            {product.Description ||
              "No description available."}
          </p>

          <button
            type="button"
            onClick={addToCart}
            disabled={
              quantityAvailable === null ||
              quantityAvailable <= 0
            }
          >
            {quantityAvailable > 0
              ? "Add to Cart"
              : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail