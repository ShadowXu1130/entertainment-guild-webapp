import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Movies() {
  const [groupedMovies, setGroupedMovies] = useState({})
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/api/inft3050/Product?limit=300").then((res) =>
        res.json()
      ),
      fetch("http://localhost:3001/api/inft3050/Genre").then((res) =>
        res.json()
      ),
      fetch("http://localhost:3001/api/inft3050/MovieGenre").then((res) =>
        res.json()
      )
    ])
      .then(([productData, genreData, movieGenreData]) => {
        const moviesGenre = genreData.list.find(
          (genre) => genre.GenreID === 2
        )

        if (!moviesGenre) {
          setGroupedMovies({})
          return
        }

        const movieIds = moviesGenre["Product List"].map((movie) => movie.ID)

        const movies = productData.list.filter((product) =>
          movieIds.includes(product.ID)
        )

        const grouped = {}

        movieGenreData.list.forEach((subGenre) => {
          const moviesInGenre = movies.filter(
            (movie) => movie.SubGenre === subGenre.SubGenreID
          )

          if (moviesInGenre.length > 0) {
            grouped[subGenre.Name] = moviesInGenre
          }
        })

        setGroupedMovies(grouped)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  const filterMovies = (movies) => {
    return movies.filter((movie) =>
      movie.Name.toLowerCase().includes(search.toLowerCase())
    )
  }

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
          onChange={(e) => setSearch(e.target.value)}
          className="product-search"
        />
      </div>

      {Object.keys(groupedMovies).map((subGenreName) => {
        const movies = filterMovies(groupedMovies[subGenreName])

        if (movies.length === 0) {
          return null
        }

        return (
          <section className="book-row-section" key={subGenreName}>
            <h2>{subGenreName}</h2>

            <div className="book-horizontal-row">
              {movies.map((movie) => (
                <Link
                  key={movie.ID}
                  to={`/products/${movie.ID}`}
                  className="apple-book-card"
                >
                  <img
                    src={`/Pictures/${movie.ID}.jpeg`}
                    alt={movie.Name}
                    className="product-cover"
                  />

                  <h3>{movie.Name}</h3>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default Movies