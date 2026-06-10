import { useEffect, useState } from "react"

function Games() {

  const [games, setGames] = useState([])

  useEffect(() => {
    fetch("http://localhost:3001/api/inft3050/Product")
      .then((response) => response.json())
      .then((data) => {
        setGames(data.list.slice(12, 24))
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  return (
    <div>
      <h1>Games</h1>

      <div className="product-grid">
        {games.map((game) => (
          <div className="product-card" key={game.ID}>
            <h3>{game.Name}</h3>
            <p>{game.Author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Games