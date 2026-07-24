import {
  useEffect,
  useRef,
  useState
} from "react"
import { Link } from "react-router-dom"
import ProductImage from "../components/ProductImage"

/**
 * Horizontally scrollable row used to display one book subgenre.
 *
 * The component manages its own scrolling state so each row can
 * independently enable or disable its navigation controls.
 */
function BookRow({
  title,
  items
}) {
  const rowRef = useRef(null)

  const [
    canScrollLeft,
    setCanScrollLeft
  ] = useState(false)

  const [
    canScrollRight,
    setCanScrollRight
  ] = useState(false)

  /**
 * Updates the enabled state of the horizontal navigation buttons
 * based on the current scroll position.
 */
const updateScrollButtons = () => {
    const rowElement =
      rowRef.current

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
 * Registers scroll and resize listeners so navigation buttons
 * always reflect the current scrollable area.
 */
useEffect(() => {
    const rowElement =
      rowRef.current

    if (!rowElement) {
      return undefined
    }

    updateScrollButtons()

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
 * Smoothly scrolls the current book row by approximately one
 * viewport width to improve horizontal browsing.
 */
const scrollRow = (
    direction
  ) => {
    const rowElement =
      rowRef.current

    if (!rowElement) {
      return
    }

    const scrollDistance =
      Math.max(
        rowElement.clientWidth *
          0.8,
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
        {items.map(
          (book) => (
            <Link
              key={book.ID}
              to={`/products/${book.ID}`}
              className="apple-book-card"
            >
              <ProductImage
                productID={
                  book.ID
                }
                alt={
                  book.Name ||
                  "Book image"
                }
                className="product-cover"
              />

              <h3>
                {book.Name ||
                  "Unnamed Book"}
              </h3>
            </Link>
          )
        )}
      </div>
    </section>
  )
}

/**
 * Displays all books grouped by subgenre.
 *
 * Product, genre and book-subgenre resources are loaded from the
 * backend and combined into grouped collections that support
 * searching and horizontal browsing.
 */
function Products() {

  // ======================================================
  // State and configuration
  // ======================================================

  const [
    groupedBooks,
    setGroupedBooks
  ] = useState({})

  const [search, setSearch] =
    useState("")

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    loadError,
    setLoadError
  ] = useState("")

  // ======================================================
  // Data loading
  // ======================================================

  /**
   * Loads product, genre and book-subgenre data before organizing
   * the catalogue into subgenre groups for display.
   */
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoading(true)
        setLoadError("")
        // Independent API resources are requested in parallel to
        // reduce loading time before grouping the book catalogue.
        const [
          productResponse,
          genreResponse,
          bookGenreResponse
        ] = await Promise.all([
          fetch(
            "http://localhost:3001/api/inft3050/Product?limit=1000"
          ),

          fetch(
            "http://localhost:3001/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"
          ),

          fetch(
            "http://localhost:3001/api/inft3050/BookGenre?limit=1000"
          )
        ])

        if (
          !productResponse.ok ||
          !genreResponse.ok ||
          !bookGenreResponse.ok
        ) {
          throw new Error(
            "Failed to load books"
          )
        }

        const [
          productData,
          genreData,
          bookGenreData
        ] = await Promise.all([
          productResponse.json(),
          genreResponse.json(),
          bookGenreResponse.json()
        ])

        const booksGenre =
          (
            genreData.list || []
          ).find(
            (genre) =>
              Number(
                genre.GenreID
              ) === 1
          )

        if (!booksGenre) {
          setGroupedBooks({})
          return
        }

        const bookIds =
          (
            booksGenre[
              "Product List"
            ] || []
          ).map(
            (book) =>
              Number(book.ID)
          )

        const books =
          (
            productData.list || []
          ).filter(
            (product) =>
              bookIds.includes(
                Number(
                  product.ID
                )
              )
          )
        // Organize books into subgenre groups so each category
        // can be rendered as an independent horizontal row.

        const grouped = {}

        ;(
          bookGenreData.list || []
        ).forEach(
          (subGenre) => {
            const booksInGenre =
              books.filter(
                (book) =>
                  Number(
                    book.SubGenre
                  ) ===
                  Number(
                    subGenre.SubGenreID
                  )
              )

            if (
              booksInGenre.length >
              0
            ) {
              grouped[
                subGenre.Name
              ] =
                booksInGenre
            }
          }
        )

        setGroupedBooks(grouped)
      } catch (error) {
        console.error(
          "Failed to load books:",
          error
        )

        setGroupedBooks({})
        setLoadError(
          "Books could not be loaded."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadBooks()
  }, [])

/**
 * Applies a case-insensitive search across book titles.
 */
const filterBooks = (
    books
  ) => {
    const searchValue =
      search
        .trim()
        .toLowerCase()

    if (!searchValue) {
      return books
    }

    return books.filter(
      (book) =>
        String(
          book.Name || ""
        )
          .toLowerCase()
          .includes(
            searchValue
          )
    )
  }

// Remove empty subgenre groups after filtering so only matching
// book categories remain visible.

const visibleGroups =
    Object.entries(
      groupedBooks
    )
      .map(
        ([
          subGenreName,
          books
        ]) => ({
          subGenreName,
          books:
            filterBooks(
              books
            )
        })
      )
      .filter(
        (group) =>
          group.books.length >
          0
      )

  const hasVisibleBooks =
    visibleGroups.length > 0

  // ======================================================
  // Books page rendering
  // ======================================================

  return (
    <div className="apple-books-page">
      <div className="apple-page-header">
        <div>
          <h1>Books</h1>
        </div>

        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          className="product-search"
        />
      </div>

      {isLoading && (
        <p className="profile-empty">
          Loading books...
        </p>
      )}

      {!isLoading &&
        loadError && (
          <p className="profile-empty">
            {loadError}
          </p>
        )}

      {!isLoading &&
        !loadError &&
        visibleGroups.map(
          ({
            subGenreName,
            books
          }) => (
            <BookRow
              key={
                subGenreName
              }
              title={
                subGenreName
              }
              items={
                books
              }
            />
          )
        )}

      {!isLoading &&
        !loadError &&
        !hasVisibleBooks && (
          <p className="profile-empty">
            No books found.
          </p>
        )}
    </div>
  )
}

export default Products