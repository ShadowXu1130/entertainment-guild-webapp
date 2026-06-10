import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Movies() {
  const [movies, setMovies] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("http://localhost:3001/api/inft3050/Genre")
      .then((response) => response.json())
      .then((data) => {
        const moviesGenre = data.list.find(
          (genre) => genre.GenreID === 2
        )

        if (moviesGenre) {
          setMovies(moviesGenre["Product List"])
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  const filteredMovies = movies.filter((movie) =>
    movie.Name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Movies</h1>

        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="product-search"
        />
      </div>

      <div className="product-grid">
        {filteredMovies.map((movie) => (
          <Link
            key={movie.ID}
            to={`/products/${movie.ID}`}
            className="product-card product-card-link"
          >
            <h3>{movie.Name}</h3>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Movies