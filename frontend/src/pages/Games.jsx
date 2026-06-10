import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Games() {
  const [games, setGames] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("http://localhost:3001/api/inft3050/Genre")
      .then((response) => response.json())
      .then((data) => {
        const gamesGenre = data.list.find(
          (genre) => genre.GenreID === 3
        )

        setGames(gamesGenre["Product List"])
      })
      .catch((error) => console.log(error))
  }, [])

  const filteredGames = games.filter((game) =>
    game.Name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>

      <div className="page-header">

        <h1>Games</h1>

        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="product-search"
        />

      </div>

      <div className="product-grid">

        {filteredGames.map((game) => (

          <Link
            to={`/products/${game.ID}`}
            className="product-card product-card-link"
            key={game.ID}
            >
            <h3>{game.Name}</h3>
          </Link>

        ))}

      </div>

    </div>
  )
}

export default Games