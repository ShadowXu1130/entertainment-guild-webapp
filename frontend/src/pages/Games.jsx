import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Games() {
  const [groupedGames, setGroupedGames] = useState({})
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/api/inft3050/Product?limit=300").then((res) =>
        res.json()
      ),
      fetch("http://localhost:3001/api/inft3050/Genre").then((res) =>
        res.json()
      ),
      fetch("http://localhost:3001/api/inft3050/GameGenre").then((res) =>
        res.json()
      )
    ])
      .then(([productData, genreData, gameGenreData]) => {
        const gamesGenre = genreData.list.find(
          (genre) => genre.GenreID === 3
        )

        if (!gamesGenre) {
          setGroupedGames({})
          return
        }

        const gameIds = gamesGenre["Product List"].map((game) => game.ID)

        const games = productData.list.filter((product) =>
          gameIds.includes(product.ID)
        )

        const grouped = {}

        gameGenreData.list.forEach((subGenre) => {
          const gamesInGenre = games.filter(
            (game) => game.SubGenre === subGenre.SubGenreID
          )

          if (gamesInGenre.length > 0) {
            grouped[subGenre.Name] = gamesInGenre
          }
        })

        setGroupedGames(grouped)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  const filterGames = (games) => {
    return games.filter((game) =>
      game.Name.toLowerCase().includes(search.toLowerCase())
    )
  }

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
                  <h3>{game.Name}</h3>
                  <p>{game.Author || "N/A"}</p>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default Games