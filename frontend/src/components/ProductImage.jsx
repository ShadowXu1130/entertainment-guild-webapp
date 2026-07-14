import { useState } from "react"

const imageExtensions = ["jpeg", "jpg", "png", "webp"]

function ProductImage({
  productID,
  alt,
  className
}) {
  const [extensionIndex, setExtensionIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  const handleImageError = () => {
    if (extensionIndex < imageExtensions.length - 1) {
      setExtensionIndex((currentIndex) => currentIndex + 1)
      return
    }

    setFailed(true)
  }

  if (failed) {
    return (
      <img
        src="/Pictures/default.jpeg"
        alt={alt || "Product cover"}
        className={className}
      />
    )
  }

  return (
    <img
      src={`/Pictures/${productID}.${imageExtensions[extensionIndex]}`}
      alt={alt || "Product cover"}
      className={className}
      onError={handleImageError}
    />
  )
}

export default ProductImage