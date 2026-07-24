import {
  useEffect,
  useRef,
  useState
} from "react"
import { Link } from "react-router-dom"
import ProductImage from "../components/ProductImage"

/**
 * Horizontally scrollable row used to display one movie subgenre.
 *
 * The component manages its own scrolling state so each row can
 * independently enable or disable its navigation controls.
 */
function MovieRow({
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
 * Smoothly scrolls the current movie row by approximately one
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
          (movie) => (
            <Link
              key={movie.ID}
              to={`/products/${movie.ID}`}
              className="apple-book-card"
            >
              <ProductImage
                productID={
                  movie.ID
                }
                alt={
                  movie.Name ||
                  "Movie image"
                }
                className="product-cover"
              />

              <h3>
                {movie.Name ||
                  "Unnamed Movie"}
              </h3>
            </Link>
          )
        )}
      </div>
    </section>
  )
}

/**
 * Displays all movies grouped by subgenre.
 *
 * Product, genre and movie-subgenre resources are loaded from the
 * backend and combined into grouped collections that support
 * searching and horizontal browsing.
 */
function Movies() {

  // ======================================================
  // State and configuration
  // ======================================================
  const [
    groupedMovies,
    setGroupedMovies
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
   * Loads product, genre and movie-subgenre data before organizing
   * the catalogue into subgenre groups for display.
   */
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setIsLoading(true)
        setLoadError("")
        // Independent API resources are requested in parallel to
        // reduce loading time before grouping the movie catalogue.
        const [
          productResponse,
          genreResponse,
          movieGenreResponse
        ] = await Promise.all([
          fetch(
            "http://localhost:3001/api/inft3050/Product?limit=1000"
          ),

          fetch(
            "http://localhost:3001/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"
          ),

          fetch(
            "http://localhost:3001/api/inft3050/MovieGenre?limit=1000"
          )
        ])

        if (
          !productResponse.ok ||
          !genreResponse.ok ||
          !movieGenreResponse.ok
        ) {
          throw new Error(
            "Failed to load movies"
          )
        }

        const [
          productData,
          genreData,
          movieGenreData
        ] = await Promise.all([
          productResponse.json(),
          genreResponse.json(),
          movieGenreResponse.json()
        ])

        const moviesGenre =
          (
            genreData.list || []
          ).find(
            (genre) =>
              Number(
                genre.GenreID
              ) === 2
          )

        if (!moviesGenre) {
          setGroupedMovies({})
          return
        }

        const movieIds =
          (
            moviesGenre[
              "Product List"
            ] || []
          ).map(
            (movie) =>
              Number(movie.ID)
          )

        const movies =
          (
            productData.list || []
          ).filter(
            (product) =>
              movieIds.includes(
                Number(
                  product.ID
                )
              )
          )
        // Organize movies into subgenre groups so each category
        // can be rendered as an independent horizontal row.
        const grouped = {}

        ;(
          movieGenreData.list || []
        ).forEach(
          (subGenre) => {
            const moviesInGenre =
              movies.filter(
                (movie) =>
                  Number(
                    movie.SubGenre
                  ) ===
                  Number(
                    subGenre.SubGenreID
                  )
              )

            if (
              moviesInGenre.length >
              0
            ) {
              grouped[
                subGenre.Name
              ] =
                moviesInGenre
            }
          }
        )

        setGroupedMovies(
          grouped
        )
      } catch (error) {
        console.error(
          "Failed to load movies:",
          error
        )

        setGroupedMovies({})
        setLoadError(
          "Movies could not be loaded."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadMovies()
  }, [])

/**
 * Applies a case-insensitive search across movie titles.
 */
const filterMovies = (
    movies
  ) => {
    const searchValue =
      search
        .trim()
        .toLowerCase()

    if (!searchValue) {
      return movies
    }

    return movies.filter(
      (movie) =>
        String(
          movie.Name || ""
        )
          .toLowerCase()
          .includes(
            searchValue
          )
    )
  }

// Remove empty subgenre groups after filtering so only matching
// movie categories remain visible.

const visibleGroups =
    Object.entries(
      groupedMovies
    )
      .map(
        ([
          subGenreName,
          movies
        ]) => ({
          subGenreName,
          movies:
            filterMovies(
              movies
            )
        })
      )
      .filter(
        (group) =>
          group.movies.length >
          0
      )

  const hasVisibleMovies =
    visibleGroups.length > 0

  // ======================================================
  // Movies page rendering
  // ======================================================

  return (
    <div className="apple-books-page">
      <div className="apple-page-header">
        <div>
          <h1>Movies</h1>
        </div>

        <input
          type="text"
          placeholder="Search movies..."
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
          Loading movies...
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
            movies
          }) => (
            <MovieRow
              key={
                subGenreName
              }
              title={
                subGenreName
              }
              items={
                movies
              }
            />
          )
        )}

      {!isLoading &&
        !loadError &&
        !hasVisibleMovies && (
          <p className="profile-empty">
            No movies found.
          </p>
        )}
    </div>
  )
}

export default Movies