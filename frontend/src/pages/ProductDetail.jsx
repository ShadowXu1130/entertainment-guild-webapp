import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

/**
 * Product details page displaying complete product information and
 * available purchase options.
 *
 * Product, genre, subgenre, stocktake and source data are combined
 * into a unified view that allows customers to compare available
 * purchase options before adding an item to the shopping cart.
 */
function ProductDetail() {
  const { id } = useParams()
  // ======================================================
  // State and configuration
  // ======================================================
  const [product, setProduct] = useState(null)
  const [genreName, setGenreName] = useState("")
  const [subGenreName, setSubGenreName] = useState("")
  const [purchaseOptions, setPurchaseOptions] = useState([])

  const [imageExtensionIndex, setImageExtensionIndex] =
    useState(0)

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const imageExtensions = [
    ".jpeg",
    ".jpg",
    ".png",
    ".webp"
  ]

  // ======================================================
  // Product data loading
  // ======================================================

  /**
   * Loads all resources required by the product details page.
   *
   * Product, genre, stocktake and source information are combined
   * to resolve the product category and construct the list of
   * available purchase options.
   */
  useEffect(() => {
    let isMounted = true

    const loadProductDetails = async () => {
      setLoading(true)
      setErrorMessage("")
      setProduct(null)
      setGenreName("")
      setSubGenreName("")
      setPurchaseOptions([])
      setImageExtensionIndex(0)

      try {
        const productResponse = await fetch(
          `http://localhost:3001/api/inft3050/Product/${id}`
        )

        if (!productResponse.ok) {
          throw new Error("Failed to load product")
        }

        const productData =
          await productResponse.json()

        if (!isMounted) return

        setProduct(productData)

        // Independent resources are requested in parallel to reduce
        // the overall loading time for the product details page.
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
          throw new Error(
            "Failed to load stocktake records"
          )
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

// ======================================================
// Resolve product genre and subgenre information
// ======================================================

        let matchedGenre = null

        if (
          productData.Genre !== null &&
          productData.Genre !== undefined &&
          productData.Genre !== ""
        ) {
          matchedGenre = (
            genreData.list || []
          ).find(
            (genre) =>
              Number(genre.GenreID) ===
              Number(productData.Genre)
          )
        }

        if (!matchedGenre) {
          matchedGenre = (
            genreData.list || []
          ).find((genre) => {
            const productList =
              genre["Product List"] || []

            return productList.some(
              (item) =>
                Number(item.ID) ===
                Number(productData.ID)
            )
          })
        }

        if (matchedGenre) {
          setGenreName(
            matchedGenre.Name || ""
          )

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
              const subGenreResponse =
                await fetch(
                  `http://localhost:3001/api/inft3050/${subGenreApi}?limit=1000`
                )

              if (subGenreResponse.ok) {
                const subGenreData =
                  await subGenreResponse.json()

                const matchedSubGenre = (
                  subGenreData.list || []
                ).find(
                  (item) =>
                    Number(
                      item.SubGenreID
                    ) ===
                    Number(
                      productData.SubGenre
                    )
                )

                if (
                  matchedSubGenre &&
                  isMounted
                ) {
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

// ======================================================
// Build available purchase options
// Each stocktake record represents one purchasing source.
// ======================================================

        const matchedStocks = (
          stocktakeData.list || []
        ).filter((stock) => {
          const stockProductID =
            stock.ProductId ??
            stock.ProductID ??
            stock.Productid

          return (
            Number(stockProductID) ===
            Number(productData.ID)
          )
        })

        const options = matchedStocks.map(
          (stock) => {
            const sourceID =
              stock.SourceId ??
              stock.SourceID ??
              stock.Sourceid

            const matchedSource = (
              sourceData.list || []
            ).find((source) => {
              const currentSourceID =
                source.SourceId ??
                source.SourceID ??
                source.Sourceid

              return (
                Number(currentSourceID) ===
                Number(sourceID)
              )
            })

            const sourceName =
              matchedSource?.SourceName ||
              matchedSource?.Source_name ||
              matchedSource?.Name ||
              `Source #${sourceID}`

            const sourceLink =
              matchedSource?.ExternalLink ||
              matchedSource?.External_Link ||
              matchedSource?.Link ||
              matchedSource?.URL ||
              ""

            return {
              itemID:
                stock.ItemId ??
                stock.ItemID ??
                stock.Itemid,

              sourceID,

              sourceName,

              sourceLink,

              price: Number(stock.Price || 0),

              quantityAvailable: Number(
                stock.Quantity || 0
              )
            }
          }
        )

        options.sort((a, b) => {
          if (
            a.quantityAvailable > 0 &&
            b.quantityAvailable <= 0
          ) {
            return -1
          }

          if (
            a.quantityAvailable <= 0 &&
            b.quantityAvailable > 0
          ) {
            return 1
          }

          return a.price - b.price
        })

        if (isMounted) {
          setPurchaseOptions(options)
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

/**
 * Attempts alternative image formats before falling back to the
 * default placeholder image when the product image cannot be found.
 */
const handleImageError = (event) => {
    const nextIndex =
      imageExtensionIndex + 1

    if (
      nextIndex <
      imageExtensions.length
    ) {
      setImageExtensionIndex(nextIndex)
      return
    }

    event.currentTarget.onerror = null
    event.currentTarget.src =
      "/Pictures/placeholder.jpeg"
  }

/**
 * Adds the selected purchase option to the shopping cart.
 *
 * Products from different sources are treated as separate cart items.
 * Existing entries are updated rather than duplicated, while available
 * stock limits prevent customers from adding quantities beyond the
 * current inventory.
 */
const addToCart = (selectedOption) => {
    if (!product || !selectedOption) {
      return
    }

    if (
      selectedOption.quantityAvailable <= 0
    ) {
      alert(
        "This purchase option is currently out of stock"
      )
      return
    }
    // Restore the persisted shopping cart while safely handling
    // missing or malformed localStorage data.
    let cart = []

    try {
      const savedCart =
        localStorage.getItem("cart")

      cart = savedCart
        ? JSON.parse(savedCart)
        : []

      if (!Array.isArray(cart)) {
        cart = []
      }
    } catch (error) {
      console.error(
        "Failed to read shopping cart:",
        error
      )

      cart = []
    }

    // Products are uniquely identified by the combination of product,
    // stock item and purchasing source.
    const existingItem = cart.find(
      (item) =>
        Number(item.ID) ===
          Number(product.ID) &&
        Number(
          item.SourceId ??
          item.SourceID ??
          item.sourceID
        ) ===
          Number(
            selectedOption.sourceID
          ) &&
        Number(
          item.ItemId ??
          item.ItemID ??
          item.itemID ??
          item.stockItemID
        ) ===
          Number(
            selectedOption.itemID
          )
    )

    if (existingItem) {
      const currentQuantity = Number(
        existingItem.quantity || 0
      )

      if (
        currentQuantity >=
        selectedOption.quantityAvailable
      ) {
        alert(
          `Only ${selectedOption.quantityAvailable} item(s) are available from ${selectedOption.sourceName}`
        )
        return
      }

      existingItem.quantity =
        currentQuantity + 1

      existingItem.price =
        selectedOption.price

      existingItem.quantityAvailable =
        selectedOption.quantityAvailable

      existingItem.ItemId =
        selectedOption.itemID

      existingItem.SourceId =
        selectedOption.sourceID

      existingItem.sourceName =
        selectedOption.sourceName

      existingItem.sourceLink =
        selectedOption.sourceLink
    } else {
      cart.push({
        ...product,

        genreName,
        subGenreName,

        ItemId:
          selectedOption.itemID,

        SourceId:
          selectedOption.sourceID,

        sourceName:
          selectedOption.sourceName,

        sourceLink:
          selectedOption.sourceLink,

        price:
          selectedOption.price,

        quantityAvailable:
          selectedOption.quantityAvailable,

        quantity: 1
      })
    }

    // Persist the updated cart so it remains available across
    // page refreshes and future browsing sessions.    
    localStorage.setItem(
      "cart",
      JSON.stringify(cart)
    )

    alert(
      `${product.Name} from ${selectedOption.sourceName} added to cart`
    )
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

  const publishedYear =
    product.Published &&
    !Number.isNaN(
      new Date(
        product.Published
      ).getFullYear()
    )
      ? new Date(
          product.Published
        ).getFullYear()
      : "N/A"

  return (
    <div className="product-detail-page">
      <div className="product-detail-card">
        <div className="product-image-placeholder">
          <img
            src={productImagePath}
            alt={
              product.Name ||
              "Product image"
            }
            className="detail-cover"
            onError={handleImageError}
          />
        </div>

        <div className="product-detail-info">
          <h1>
            {product.Name ||
              "Unnamed Product"}
          </h1>

          <p>
            <strong>ID:</strong>{" "}
            {product.ID}
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
            <strong>Published:</strong>{" "}
            {publishedYear}
          </p>

          <h3>Description</h3>

          <p className="product-description">
            {product.Description ||
              "No description available."}
          </p>

          <h3>Purchase Options</h3>

          {purchaseOptions.length === 0 ? (
            <p className="product-no-options">
              No purchase options are
              currently available.
            </p>
          ) : (
            <div className="purchase-options">
              {purchaseOptions.map(
                (option) => {
                  const validPrice =
                    Number.isFinite(
                      Number(option.price)
                    )

                  const formattedPrice =
                    validPrice
                      ? `S$${Number(
                          option.price
                        ).toFixed(2)}`
                      : "N/A"

                  const isOutOfStock =
                    option.quantityAvailable <=
                    0

                  return (
                    <div
                      className="purchase-option"
                      key={`${
                        option.itemID
                      }-${
                        option.sourceID
                      }`}
                    >
                      <div className="purchase-option-info">
                        <div className="purchase-option-source">
                          <strong>
                            {
                              option.sourceName
                            }
                          </strong>

                          {option.sourceLink && (
                            <a
                              href={
                                option.sourceLink
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              Visit Source
                            </a>
                          )}
                        </div>

                        <div className="purchase-option-details">
                          <span className="purchase-option-price">
                            {
                              formattedPrice
                            }
                          </span>

                          <span className="purchase-option-stock">
                            {option.quantityAvailable}{" "}
                            available
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          addToCart(option)
                        }
                        disabled={
                          isOutOfStock
                        }
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </button>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail