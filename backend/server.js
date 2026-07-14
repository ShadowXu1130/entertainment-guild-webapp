const express = require("express")
const cors = require("cors")
const crypto = require("crypto")

const app = express()

const path = require("path")
const fs = require("fs")
const multer = require("multer")

app.use(cors())
app.use(express.json())

const tempUploadDirectory = path.join(__dirname, "temp-uploads")

if (!fs.existsSync(tempUploadDirectory)) {
  fs.mkdirSync(tempUploadDirectory, { recursive: true })
}

const upload = multer({
  dest: tempUploadDirectory,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ]

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPEG, PNG and WebP images are allowed")
      )
    }

    callback(null, true)
  }
})

app.get("/", (req, res) => {
  res.send("Entertainment Guild Backend Running")
})

app.get("/api/products", (req, res) => {
  res.json([
    {
      id: 1,
      name: "The Witcher 3",
      price: 59.99
    },
    {
      id: 2,
      name: "Interstellar Blu-ray",
      price: 24.99
    }
  ])
})

const getAdminCookie = async () => {
  const loginResponse = await fetch(
    "http://localhost:3001/login?adminAccount=adminPW",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "adminAccount",
        password: "adminPW"
      })
    }
  )

  if (!loginResponse.ok) {
    throw new Error("Failed to authenticate API access")
  }

  return loginResponse.headers.get("set-cookie")
}

app.post("/api-register", async (req, res) => {
  try {
    const { username, name, password } = req.body

    if (!username || !name || !password) {
      return res.status(400).send("Username, name and password are required")
    }

    const setCookie = await getAdminCookie()
    const salt = crypto.randomBytes(16).toString("hex")

    const hashPW = crypto
      .createHash("sha256")
      .update(salt + password)
      .digest("hex")

    const createResponse = await fetch(
      "http://localhost:3001/api/inft3050/User",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify({
          UserName: username,
          Name: name,
          IsAdmin: 0,
          Salt: salt,
          HashPW: hashPW
        })
      }
    )

    const resultText = await createResponse.text()

    if (!createResponse.ok) {
      if (resultText.includes("duplicate")) {
        return res.status(409).send("Username already exists")
      }

      return res.status(createResponse.status).send(resultText)
    }

    res.status(201).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Registration failed")
  }
})

app.post(
  "/api-add-product",
  upload.single("Image"),
  async (req, res) => {
    let temporaryImagePath = req.file?.path

    try {
      const {
        Name,
        Author,
        Description,
        Genre,
        SubGenre,
        Published,
        LastUpdatedBy,
        LastUpdated
      } = req.body

      if (
        !Name ||
        !Author ||
        !Description ||
        !Genre ||
        !SubGenre ||
        !Published
      ) {
        if (temporaryImagePath && fs.existsSync(temporaryImagePath)) {
          fs.unlinkSync(temporaryImagePath)
        }

        return res.status(400).send("Missing required product fields")
      }

      if (!req.file) {
        return res.status(400).send("Product image is required")
      }

      const setCookie = await getAdminCookie()

      const createResponse = await fetch(
        "http://localhost:3001/api/inft3050/Product",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: setCookie
          },
          body: JSON.stringify({
            Name,
            Author,
            Description,
            Genre: Number(Genre),
            SubGenre: Number(SubGenre),
            Published,
            LastUpdatedBy: LastUpdatedBy || "adminAccount",
            LastUpdated:
              LastUpdated ||
              new Date().toISOString().split("T")[0]
          })
        }
      )

      const resultText = await createResponse.text()

      if (!createResponse.ok) {
        if (temporaryImagePath && fs.existsSync(temporaryImagePath)) {
          fs.unlinkSync(temporaryImagePath)
        }

        return res.status(createResponse.status).send(resultText)
      }

      let createdProductID = null

      try {
        const createdProduct = JSON.parse(resultText)

        createdProductID =
          createdProduct.ID ||
          createdProduct.id ||
          createdProduct.ProductID ||
          createdProduct.productID
      } catch {
        // 返回值不是 JSON 时，后面重新查询产品。
      }

      if (!createdProductID) {
        const productsResponse = await fetch(
          "http://localhost:3001/api/inft3050/Product?limit=1000",
          {
            headers: {
              Cookie: setCookie
            }
          }
        )

        const productsData = await productsResponse.json()

        const matchingProducts = (productsData.list || [])
          .filter(
            (product) =>
              String(product.Name).toLowerCase() ===
                String(Name).toLowerCase() &&
              String(product.Author).toLowerCase() ===
                String(Author).toLowerCase()
          )
          .sort((a, b) => Number(b.ID) - Number(a.ID))

        createdProductID = matchingProducts[0]?.ID
      }

      if (!createdProductID) {
        if (temporaryImagePath && fs.existsSync(temporaryImagePath)) {
          fs.unlinkSync(temporaryImagePath)
        }

        return res
          .status(500)
          .send("Product created, but product ID could not be found")
      }

      const picturesDirectory = path.join(
        __dirname,
        "..",
        "frontend",
        "public",
        "Pictures"
      )

      if (!fs.existsSync(picturesDirectory)) {
        fs.mkdirSync(picturesDirectory, { recursive: true })
      }

      const extensionByMimeType = {
  "image/jpeg": ".jpeg",
  "image/png": ".png",
  "image/webp": ".webp"
}

const imageExtension = extensionByMimeType[req.file.mimetype]

if (!imageExtension) {
  if (temporaryImagePath && fs.existsSync(temporaryImagePath)) {
    fs.unlinkSync(temporaryImagePath)
  }

  return res.status(400).send("Unsupported image format")
}

const finalImagePath = path.join(
  picturesDirectory,
  `${createdProductID}${imageExtension}`
)

fs.renameSync(temporaryImagePath, finalImagePath)
temporaryImagePath = null

return res.status(201).json({
  message: "Product and image created successfully",
  productID: createdProductID,
  imagePath: `/Pictures/${createdProductID}${imageExtension}`
})
      
    } catch (error) {
      console.error(error)

      if (temporaryImagePath && fs.existsSync(temporaryImagePath)) {
        fs.unlinkSync(temporaryImagePath)
      }

      return res.status(500).send("Add product failed")
    }
  }
)

app.patch("/api-edit-product/:id", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const editResponse = await fetch(
      `http://localhost:3001/api/inft3050/Product/${req.params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify(req.body)
      }
    )

    const resultText = await editResponse.text()

    if (!editResponse.ok) {
      return res.status(editResponse.status).send(resultText)
    }

    res.status(200).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Edit product failed")
  }
})

app.delete("/api-delete-product/:id", async (req, res) => {
  try {
    const productID = req.params.id
    const setCookie = await getAdminCookie()

    const deleteResponse = await fetch(
      `http://localhost:3001/api/inft3050/Product/${productID}`,
      {
        method: "DELETE",
        headers: {
          Cookie: setCookie
        }
      }
    )

    const resultText = await deleteResponse.text()

    if (!deleteResponse.ok) {
      return res.status(deleteResponse.status).send(resultText)
    }

    const picturesDirectory = path.join(
      __dirname,
      "..",
      "frontend",
      "public",
      "Pictures"
    )

    const possibleImageFiles = [
      `${productID}.jpeg`,
      `${productID}.jpg`,
      `${productID}.png`,
      `${productID}.webp`
    ]

    const deletedImages = []

    for (const fileName of possibleImageFiles) {
      const imagePath = path.join(picturesDirectory, fileName)

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
        deletedImages.push(fileName)
      }
    }

    return res.status(200).json({
    message: "Product deleted successfully",
    productID,
    deletedImages
  })
  } catch (error) {
    console.error(error)
    return res.status(500).send("Delete product failed")
  }
})

app.patch("/api-edit-user/:id", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const editResponse = await fetch(
      `http://localhost:3001/api/inft3050/User/${req.params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify(req.body)
      }
    )

    const resultText = await editResponse.text()

    if (!editResponse.ok) {
      return res.status(editResponse.status).send(resultText)
    }

    res.status(200).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Edit user failed")
  }
})

app.delete("/api-delete-user/:id", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const deleteResponse = await fetch(
      `http://localhost:3001/api/inft3050/User/${req.params.id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: setCookie
        }
      }
    )

    const resultText = await deleteResponse.text()

    if (!deleteResponse.ok) {
      return res.status(deleteResponse.status).send(resultText)
    }

    res.status(200).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Delete user failed")
  }
})

app.patch("/api-edit-stocktake/:id", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const editResponse = await fetch(
      `http://localhost:3001/api/inft3050/Stocktake/${req.params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify(req.body)
      }
    )

    const resultText = await editResponse.text()

    if (!editResponse.ok) {
      return res.status(editResponse.status).send(resultText)
    }

    res.status(200).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Edit stocktake failed")
  }
})

app.post("/api-add-stocktake", async (req, res) => {
  try {
    const { SourceId, ProductId, Quantity, Price } = req.body

    if (!SourceId || !ProductId || Quantity === "" || Price === "") {
      return res.status(400).send("Missing required stocktake fields")
    }

    const setCookie = await getAdminCookie()

    const createResponse = await fetch(
      "http://localhost:3001/api/inft3050/Stocktake",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify({
          SourceId: Number(SourceId),
          ProductId: Number(ProductId),
          Quantity: Number(Quantity),
          Price: Number(Price)
        })
      }
    )

    const resultText = await createResponse.text()

    if (!createResponse.ok) {
      return res.status(createResponse.status).send(resultText)
    }

    res.status(201).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Add stocktake failed")
  }
})

app.delete("/api-delete-stocktake/:id", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const deleteResponse = await fetch(
      `http://localhost:3001/api/inft3050/Stocktake/${req.params.id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: setCookie
        }
      }
    )

    const resultText = await deleteResponse.text()

    if (!deleteResponse.ok) {
      return res.status(deleteResponse.status).send(resultText)
    }

    res.status(200).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Delete stocktake failed")
  }
})

app.post("/api-create-customer", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const {
      PatronId,
      Email,
      PhoneNumber,
      StreetAddress,
      PostCode,
      Suburb,
      State,
      Name
    } = req.body

    const patronResponse = await fetch(
      "http://localhost:3001/api/inft3050/Patrons",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify({
          UserID: Number(PatronId),
          Email: Email || "",
          Name: Name || "",
          Salt: "",
          HashedPW: ""
        })
      }
    )

    const patronText = await patronResponse.text()

    if (!patronResponse.ok && !patronText.toLowerCase().includes("duplicate")) {
      return res.status(patronResponse.status).send(patronText)
    }

    const createResponse = await fetch(
      "http://localhost:3001/api/inft3050/TO",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify({
          PatronId: Number(PatronId),
          Email: Email || "",
          PhoneNumber: PhoneNumber || "",
          StreetAddress: StreetAddress || "",
          PostCode: PostCode || "",
          Suburb: Suburb || "",
          State: State || ""
        })
      }
    )

    const resultText = await createResponse.text()

    if (!createResponse.ok) {
      return res.status(createResponse.status).send(resultText)
    }

    res.status(201).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Create customer failed")
  }
})

app.patch("/api-update-customer/:id", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const updateResponse = await fetch(
      `http://localhost:3001/api/inft3050/TO/${req.params.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: setCookie
        },
        body: JSON.stringify({
          Email: req.body.Email,
          PhoneNumber: req.body.PhoneNumber
        })
      }
    )

    const resultText = await updateResponse.text()

    if (!updateResponse.ok) {
      return res.status(updateResponse.status).send(resultText)
    }

    res.status(200).send(resultText)
  } catch (error) {
    console.error(error)
    res.status(500).send("Update customer failed")
  }
})

app.get("/api-profile-user/:username", async (req, res) => {
  try {
    const setCookie = await getAdminCookie()

    const userResponse = await fetch(
      "http://localhost:3001/api/inft3050/User?limit=1000",
      {
        headers: {
          Cookie: setCookie
        }
      }
    )

    const userData = await userResponse.json()

    if (!userResponse.ok) {
      return res.status(userResponse.status).json(userData)
    }

    const foundUser = userData.list.find(
      (user) => String(user.UserName) === String(req.params.username)
    )

    if (!foundUser) {
      return res.status(404).send("User not found")
    }

    res.json(foundUser)
  } catch (error) {
    console.error(error)
    res.status(500).send("Load profile user failed")
  }
})

const PORT = 5050

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

