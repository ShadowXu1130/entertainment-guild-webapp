import { useEffect, useState } from "react"

function Movies() {

  const [movies, setMovies] = useState([])

  useEffect(() => {
    fetch("http://localhost:3001/api/inft3050/Product")
      .then((response) => response.json())
      .then((data) => {
        setMovies(data.list.slice(0, 12))
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  return (
    <div>
      <h1>Movies</h1>

      <div className="product-grid">
        {movies.map((movie) => (
          <div className="product-card" key={movie.ID}>
            <h3>{movie.Name}</h3>
            <p>{movie.Author}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Movies