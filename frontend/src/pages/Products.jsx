import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import ProductImage from "../components/ProductImage"

function Products() {
  const [groupedBooks, setGroupedBooks] = useState({})
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
        "http://localhost:3001/api/inft3050/BookGenre?limit=1000"
      ).then((res) => res.json())
    ])
      .then(([productData, genreData, bookGenreData]) => {
        const booksGenre = (genreData.list || []).find(
          (genre) => Number(genre.GenreID) === 1
        )

        if (!booksGenre) {
          setGroupedBooks({})
          return
        }

        const bookIds = (booksGenre["Product List"] || []).map((book) =>
          Number(book.ID)
        )

        const books = (productData.list || []).filter((product) =>
          bookIds.includes(Number(product.ID))
        )

        const grouped = {}

        ;(bookGenreData.list || []).forEach((subGenre) => {
          const booksInGenre = books.filter(
            (book) =>
              Number(book.SubGenre) === Number(subGenre.SubGenreID)
          )

          if (booksInGenre.length > 0) {
            grouped[subGenre.Name] = booksInGenre
          }
        })

        console.log("All products:", productData.list?.length || 0)
        console.log(
          "Book Product List:",
          booksGenre["Product List"]?.length || 0
        )
        console.log("Filtered books:", books.length)

        setGroupedBooks(grouped)
      })
      .catch((error) => {
        console.error("Failed to load books:", error)
        setGroupedBooks({})
      })
  }, [])

  const filterBooks = (books) => {
    return books.filter((book) =>
      String(book.Name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  }

  const hasVisibleBooks = Object.keys(groupedBooks).some(
    (subGenreName) => filterBooks(groupedBooks[subGenreName]).length > 0
  )

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
                  <ProductImage
                    productID={book.ID}
                    alt={book.Name}
                    className="product-cover"
                  />

                  <h3>{book.Name}</h3>
                </Link>
              ))}
            </div>
          </section>
        )
      })}

      {!hasVisibleBooks && (
        <p className="profile-empty">No books found.</p>
      )}
    </div>
  )
}

export default Products