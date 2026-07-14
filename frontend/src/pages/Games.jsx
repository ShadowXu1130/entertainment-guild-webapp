import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import ProductImage from "../components/ProductImage"

function Games() {
  const [groupedGames, setGroupedGames] = useState({})
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch(
        "http://localhost:3001/api/inft3050/Product?limit=1000"
      ).then((res) => res.json()),

      fetch(
        "http://localhost:3001/api/inft3050/Genre?limit=1000&nested[Product List][limit]=1000"
      ).then((res) => res.json()),

      fetch(
        "http://localhost:3001/api/inft3050/GameGenre?limit=1000"
      ).then((res) => res.json())
    ])
      .then(([productData, genreData, gameGenreData]) => {
        const gamesGenre = (genreData.list || []).find(
          (genre) => Number(genre.GenreID) === 3
        )

        if (!gamesGenre) {
          setGroupedGames({})
          return
        }

        const gameIds = (gamesGenre["Product List"] || []).map((game) =>
          Number(game.ID)
        )

        const games = (productData.list || []).filter((product) =>
          gameIds.includes(Number(product.ID))
        )

        const grouped = {}

        ;(gameGenreData.list || []).forEach((subGenre) => {
          const gamesInGenre = games.filter(
            (game) =>
              Number(game.SubGenre) === Number(subGenre.SubGenreID)
          )

          if (gamesInGenre.length > 0) {
            grouped[subGenre.Name] = gamesInGenre
          }
        })

        console.log("All products:", productData.list?.length || 0)
        console.log(
          "Game Product List:",
          gamesGenre["Product List"]?.length || 0
        )
        console.log("Filtered games:", games.length)

        setGroupedGames(grouped)
      })
      .catch((error) => {
        console.error("Failed to load games:", error)
        setGroupedGames({})
      })
  }, [])

  const filterGames = (games) => {
    return games.filter((game) =>
      String(game.Name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }

  const hasVisibleGames = Object.keys(groupedGames).some(
    (subGenreName) => filterGames(groupedGames[subGenreName]).length > 0
  )

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
          onChange={(e) => setSearch(e.target.value)}
          className="product-search"
        />
      </div>

      {Object.keys(groupedGames).map((subGenreName) => {
        const games = filterGames(groupedGames[subGenreName])

        if (games.length === 0) {
          return null
        }

        return (
          <section className="book-row-section" key={subGenreName}>
            <h2>{subGenreName}</h2>

            <div className="book-horizontal-row">
              {games.map((game) => (
                <Link
                  key={game.ID}
                  to={`/products/${game.ID}`}
                  className="apple-book-card"
                >
                  <ProductImage
                    productID={game.ID}
                    alt={game.Name}
                    className="product-cover"
                  />

                  <h3>{game.Name}</h3>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {!hasVisibleGames && (
        <p className="profile-empty">No games found.</p>
      )}
    </div>
  )
}

export default Games