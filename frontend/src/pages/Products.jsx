import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function Products() {
  const [groupedBooks, setGroupedBooks] = useState({})
  const [search, setSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/api/inft3050/Product").then((res) => res.json()),
      fetch("http://localhost:3001/api/inft3050/Genre").then((res) => res.json()),
      fetch("http://localhost:3001/api/inft3050/BookGenre").then((res) => res.json())
    ])
      .then(([productData, genreData, bookGenreData]) => {
        const booksGenre = genreData.list.find(
          (genre) => genre.GenreID === 1
        )

        const bookIds = booksGenre["Product List"].map((book) => book.ID)

        const books = productData.list.filter((product) =>
          bookIds.includes(product.ID)
        )

        const grouped = {}

        bookGenreData.list.forEach((subGenre) => {
          const booksInGenre = books.filter(
            (book) => book.SubGenre === subGenre.SubGenreID
          )

          if (booksInGenre.length > 0) {
            grouped[subGenre.Name] = booksInGenre
          }
        })

        setGroupedBooks(grouped)
      })
      .catch((error) => {
        console.log(error)
      })
  }, [])

  const filterBooks = (books) => {
    return books.filter((book) =>
      book.Name.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="apple-books-page">
      <div className="apple-page-header">
        <div>
          <h1>Books</h1>
        </div>

        <input
          type="text"
          placeholder="Search books..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="product-search"
        />
      </div>

      {Object.keys(groupedBooks).map((subGenreName) => {
        const books = filterBooks(groupedBooks[subGenreName])

        if (books.length === 0) {
          return null
        }

        return (
          <section className="book-row-section" key={subGenreName}>
            <h2>{subGenreName}</h2>

            <div className="book-horizontal-row">
              {books.map((book) => (
                <Link
                  key={book.ID}
                  to={`/products/${book.ID}`}
                  className="apple-book-card"
                >
                  <h3>{book.Name}</h3>
                  <p>{book.Author || "N/A"}</p>
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default Products