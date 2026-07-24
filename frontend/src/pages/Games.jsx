import {
  useEffect,
  useRef,
  useState
} from "react"
import { Link } from "react-router-dom"
import ProductImage from "../components/ProductImage"

/**
 * Horizontally scrollable row used to display one game subgenre.
 *
 * The component manages its own scrolling state so each row can
 * independently enable or disable its navigation controls.
 */
function GameRow({
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
 * based on the current scroll position.
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
 * Registers scroll and resize listeners so navigation buttons
 * always reflect the current scrollable area.
 */
  useEffect(() => {
    const rowElement = rowRef.current

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
 * Smoothly scrolls the current game row by approximately one
 * viewport width to improve horizontal browsing.
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
    <section
      className="book-row-section"
    >
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
        {items.map((game) => (
          <Link
            key={game.ID}
            to={`/products/${game.ID}`}
            className="apple-book-card"
          >
            <ProductImage
              productID={game.ID}
              alt={
                game.Name ||
                "Game image"
              }
              className="product-cover"
            />

            <h3>
              {game.Name ||
                "Unnamed Game"}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  )
}

/**
 * Displays all games grouped by subgenre.
 *
 * Product, genre and game-subgenre resources are loaded from the
 * backend and combined into grouped collections that support
 * searching and horizontal browsing.
 */
function Games() {
  const [groupedGames, setGroupedGames] =
    useState({})

  const [search, setSearch] =
    useState("")

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState("")

  // ======================================================
  // Data loading
  // ======================================================

  /**
   * Loads product, genre and game-subgenre data, then combines
   * them into grouped collections for display.
   */
    useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoading(true)
        setLoadError("")

        // Independent API resources are requested in parallel to
        // reduce loading time before grouping the game catalogue.
        const [
          productResponse,
          genreResponse,
          gameGenreResponse
        ] = await Promise.all([
          fetch(
            "http://localhost:3001/api/inft3050/Product?limit=1000"
          ),

          fetch(
            "http://localhost:3001/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"
          ),

          fetch(
            "http://localhost:3001/api/inft3050/GameGenre?limit=1000"
          )
        ])

        if (
          !productResponse.ok ||
          !genreResponse.ok ||
          !gameGenreResponse.ok
        ) {
          throw new Error(
            "Failed to load games"
          )
        }

        const [
          productData,
          genreData,
          gameGenreData
        ] = await Promise.all([
          productResponse.json(),
          genreResponse.json(),
          gameGenreResponse.json()
        ])

        const gamesGenre =
          (
            genreData.list || []
          ).find(
            (genre) =>
              Number(
                genre.GenreID
              ) === 3
          )

        if (!gamesGenre) {
          setGroupedGames({})
          return
        }

        const gameIds =
          (
            gamesGenre[
              "Product List"
            ] || []
          ).map(
            (game) =>
              Number(game.ID)
          )

        const games =
          (
            productData.list || []
          ).filter(
            (product) =>
              gameIds.includes(
                Number(
                  product.ID
                )
              )
          )
        // Organize games into subgenre groups so each category
        // can be rendered as an independent horizontal row.
        const grouped = {}

        ;(
          gameGenreData.list || []
        ).forEach(
          (subGenre) => {
            const gamesInGenre =
              games.filter(
                (game) =>
                  Number(
                    game.SubGenre
                  ) ===
                  Number(
                    subGenre.SubGenreID
                  )
              )

            if (
              gamesInGenre.length >
              0
            ) {
              grouped[
                subGenre.Name
              ] =
                gamesInGenre
            }
          }
        )

        setGroupedGames(grouped)
      } catch (error) {
        console.error(
          "Failed to load games:",
          error
        )

        setGroupedGames({})
        setLoadError(
          "Games could not be loaded."
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadGames()
  }, [])

  /**
 * Applies a case-insensitive search across game titles.
 */
  const filterGames = (
    games
  ) => {
    const searchValue =
      search
        .trim()
        .toLowerCase()

    if (!searchValue) {
      return games
    }

    return games.filter(
      (game) =>
        String(
          game.Name || ""
        )
          .toLowerCase()
          .includes(
            searchValue
          )
    )
  }

  const visibleGroups =
    Object.entries(
      groupedGames
    )
      .map(
        ([
          subGenreName,
          games
        ]) => ({
          subGenreName,
          games:
            filterGames(games)
        })
      )
      .filter(
        (group) =>
          group.games.length >
          0
      )

  const hasVisibleGames =
    visibleGroups.length > 0

  // ======================================================
  // Games page rendering
  // ======================================================

  return (
    <div className="apple-books-page">
      <div className="apple-page-header">
        <div>
          <h1>Games</h1>
        </div>

        <input
          type="text"
          placeholder="Search games..."
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
          Loading games...
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
            games
          }) => (
            <GameRow
              key={
                subGenreName
              }
              title={
                subGenreName
              }
              items={games}
            />
          )
        )}

      {!isLoading &&
        !loadError &&
        !hasVisibleGames && (
          <p className="profile-empty">
            No games found.
          </p>
        )}
    </div>
  )
}

export default Games