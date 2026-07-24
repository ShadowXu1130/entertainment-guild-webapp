import {
  useEffect,
  useRef,
  useState
} from "react"
import { Link } from "react-router-dom"
import ProductImage from "../components/ProductImage"

/**
 * Reusable horizontally scrollable product row used by the home page.
 *
 * Each row maintains its own scrolling state so navigation buttons
 * operate independently for books, movies and games.
 */
function ProductRow({
  title,
  items
}) {
  const rowRef = useRef(null)

  const [canScrollLeft, setCanScrollLeft] =
    useState(false)

  const [canScrollRight, setCanScrollRight] =
    useState(false)

/**
 * Updates the enabled state of the horizontal navigation buttons
 * according to the current scroll position.
 */
const updateScrollButtons = () => {
    const rowElement = rowRef.current

    if (!rowElement) {
      return
    }

    const {
      scrollLeft,
      scrollWidth,
      clientWidth
    } = rowElement

    setCanScrollLeft(
      scrollLeft > 5
    )

    setCanScrollRight(
      scrollLeft + clientWidth <
        scrollWidth - 5
    )
  }

/**
 * Registers scroll and resize listeners so navigation controls
 * remain synchronized with the current scrollable area.
 */
  useEffect(() => {
    updateScrollButtons()

    const rowElement = rowRef.current

    if (!rowElement) {
      return undefined
    }

    const handleResize = () => {
      updateScrollButtons()
    }

    rowElement.addEventListener(
      "scroll",
      updateScrollButtons
    )

    window.addEventListener(
      "resize",
      handleResize
    )

    return () => {
      rowElement.removeEventListener(
        "scroll",
        updateScrollButtons
      )

      window.removeEventListener(
        "resize",
        handleResize
      )
    }
  }, [items])

/**
 * Smoothly scrolls the current product row by approximately one
 * viewport width for easier catalogue browsing.
 */
  const scrollRow = (
    direction
  ) => {
    const rowElement = rowRef.current

    if (!rowElement) {
      return
    }

    const scrollDistance =
      Math.max(
        rowElement.clientWidth * 0.8,
        320
      )

    rowElement.scrollBy({
      left:
        direction === "left"
          ? -scrollDistance
          : scrollDistance,
      behavior: "smooth"
    })
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="book-row-section">
      <div className="product-row-header">
        <h2>{title}</h2>

        <div className="product-scroll-controls">
          <button
            type="button"
            className="product-scroll-button"
            onClick={() =>
              scrollRow("left")
            }
            disabled={
              !canScrollLeft
            }
            aria-label={`Scroll ${title} left`}
          >
            ‹
          </button>

          <button
            type="button"
            className="product-scroll-button"
            onClick={() =>
              scrollRow("right")
            }
            disabled={
              !canScrollRight
            }
            aria-label={`Scroll ${title} right`}
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={rowRef}
        className="book-horizontal-row"
      >
        {items.map((item) => (
          <Link
            key={item.ID}
            to={`/products/${item.ID}`}
            className="apple-book-card"
          >
            <ProductImage
              productID={item.ID}
              alt={
                item.Name ||
                "Product image"
              }
              className="product-cover"
            />

            <h3>
              {item.Name ||
                "Unnamed Product"}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  )
}

/**
 * Home page displaying featured products grouped by category.
 *
 * Products are retrieved through the Genre endpoint, which returns
 * nested product relationships for books, movies and games. Each
 * category is presented as an independently scrollable row.
 */
function Home() {
  const [books, setBooks] =
    useState([])

  const [movies, setMovies] =
    useState([])

  const [games, setGames] =
    useState([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState("")

  // ======================================================
  // Data loading
  // ======================================================

  /**
   * Loads the featured product collections displayed on the home page.
   *
   * Products are grouped by their parent genre using the nested
   * Product List relationship returned by the backend API.
   */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setLoadError("")

        const response = await fetch(
          "http://localhost:3001/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"
        )

        if (!response.ok) {
          throw new Error(
            "Failed to load home page products"
          )
        }

        const data =
          await response.json()

        // Separate the nested product catalogue into the three
        // top-level categories displayed on the home page.

        const genreList =
          data.list || []

        const booksGenre =
          genreList.find(
            (genre) =>
              Number(
                genre.GenreID
              ) === 1
          )

        const moviesGenre =
          genreList.find(
            (genre) =>
              Number(
                genre.GenreID
              ) === 2
          )

        const gamesGenre =
          genreList.find(
            (genre) =>
              Number(
                genre.GenreID
              ) === 3
          )

        setBooks(
          booksGenre?.[
            "Product List"
          ] || []
        )

        setMovies(
          moviesGenre?.[
            "Product List"
          ] || []
        )

        setGames(
          gamesGenre?.[
            "Product List"
          ] || []
        )
      } catch (error) {
        console.error(
          "Failed to load home page:",
          error
        )

        setBooks([])
        setMovies([])
        setGames([])

        setLoadError(
          "Products could not be loaded."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [])

  // Determine whether any product category contains data before
  // rendering the home page catalogue.

  const hasProducts =
    books.length > 0 ||
    movies.length > 0 ||
    games.length > 0

  // ======================================================
  // Home page rendering
  // ======================================================

  return (
    <div className="apple-books-page">
      <div className="apple-page-header">
        <div>
          <h1>Home</h1>
        </div>
      </div>

      {isLoading && (
        <p className="profile-empty">
          Loading products...
        </p>
      )}

      {!isLoading &&
        loadError && (
          <p className="profile-empty">
            {loadError}
          </p>
        )}

      {!isLoading &&
        !loadError && (
          <>
            <ProductRow
              title="Movies"
              items={movies}
            />

            <ProductRow
              title="Games"
              items={games}
            />

            <ProductRow
              title="Books"
              items={books}
            />
          </>
        )}

      {!isLoading &&
        !loadError &&
        !hasProducts && (
          <p className="profile-empty">
            No products found.
          </p>
        )}
    </div>
  )
}

export default Home