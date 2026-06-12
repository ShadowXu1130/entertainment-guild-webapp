import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Home() {
  const [books, setBooks] = useState([])
  const [movies, setMovies] = useState([])
  const [games, setGames] = useState([])

  useEffect(() => {
    fetch("http://localhost:3001/api/inft3050/Genre")
      .then((response) => response.json())
      .then((data) => {
        const booksGenre = data.list.find((genre) => genre.GenreID === 1)
        const moviesGenre = data.list.find((genre) => genre.GenreID === 2)
        const gamesGenre = data.list.find((genre) => genre.GenreID === 3)

        if (booksGenre) {
          setBooks(booksGenre["Product List"])
        }

        if (moviesGenre) {
          setMovies(moviesGenre["Product List"])
        }

        if (gamesGenre) {
          setGames(gamesGenre["Product List"])
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  const renderRow = (title, items) => {
    return (
      <section className="book-row-section" key={title}>
        <h2>{title}</h2>

        <div className="book-horizontal-row">
          {items.map((item) => (
            <Link
              key={item.ID}
              to={`/products/${item.ID}`}
              className="apple-book-card"
            >
              <img
                src={`/Pictures/${item.ID}.jpeg`}
                alt={item.Name}
                className="product-cover"
              />

              <h3>{item.Name}</h3>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="apple-books-page">
      <div className="apple-page-header">
        <div>
          <h1>Home</h1>
        </div>
      </div>

      {renderRow("Movies", movies)}
      {renderRow("Games", games)}
      {renderRow("Books", books)}
    </div>
  )
}

export default Home