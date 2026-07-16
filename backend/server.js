const express = require("express")
const cors = require("cors")
const crypto = require("crypto")

const app = express()

const path = require("path")
const fs = require("fs")
const multer = require("multer")

const customerMapPath = path.join(
  __dirname,
  "customer-map.json"
)

const loadCustomerMap = () => {
  try {
    if (!fs.existsSync(customerMapPath)) {
      return {}
    }

    const savedCustomerMap = JSON.parse(
      fs.readFileSync(
        customerMapPath,
        "utf-8"
      )
    )

    if (
      !savedCustomerMap ||
      typeof savedCustomerMap !== "object" ||
      Array.isArray(savedCustomerMap)
    ) {
      return {}
    }

    return savedCustomerMap
  } catch (error) {
    console.error(
      "Failed to load customer map:",
      error
    )

    return {}
  }
}

const saveCustomerMap = (
  customerMap
) => {
  try {
    fs.writeFileSync(
      customerMapPath,
      JSON.stringify(
        customerMap,
        null,
        2
      ),
      "utf-8"
    )
  } catch (error) {
    console.error(
      "Failed to save customer map:",
      error
    )

    throw error
  }
}

app.use(cors())
app.use(express.json())

const tempUploadDirectory = path.join(
  __dirname,
  "temp-uploads"
)

if (!fs.existsSync(tempUploadDirectory)) {
  fs.mkdirSync(
    tempUploadDirectory,
    {
      recursive: true
    }
  )
}

const upload = multer({
  dest: tempUploadDirectory,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ]

    if (
      !allowedTypes.includes(
        file.mimetype
      )
    ) {
      return callback(
        new Error(
          "Only JPEG, PNG and WebP images are allowed"
        )
      )
    }

    callback(null, true)
  }
})

app.get("/", (req, res) => {
  res.send(
    "Entertainment Guild Backend Running"
  )
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
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        username: "adminAccount",
        password: "adminPW"
      })
    }
  )

  if (!loginResponse.ok) {
    throw new Error(
      "Failed to authenticate API access"
    )
  }

  return loginResponse.headers.get(
    "set-cookie"
  )
}

app.post(
  "/api-register",
  async (req, res) => {
    try {
      const {
        username,
        name,
        password,
        email
      } = req.body

      if (
        !username ||
        !name ||
        !password ||
        !email
      ) {
        return res
          .status(400)
          .send(
            "Username, name, password and email are required"
          )
      }

      const setCookie =
        await getAdminCookie()

      const salt = crypto
        .randomBytes(16)
        .toString("hex")

      const hashPW = crypto
        .createHash("sha256")
        .update(salt + password)
        .digest("hex")

      const createResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/User",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              UserName: username,
              Name: name,
              Email: email,
              IsAdmin: 0,
              Salt: salt,
              HashPW: hashPW
            })
          }
        )

      const resultText =
        await createResponse.text()

      if (!createResponse.ok) {
        if (
          resultText.includes(
            "duplicate"
          )
        ) {
          return res
            .status(409)
            .send(
              "Username already exists"
            )
        }

        return res
          .status(
            createResponse.status
          )
          .send(resultText)
      }

      res
        .status(201)
        .send(resultText)
    } catch (error) {
      console.error(error)

      res
        .status(500)
        .send(
          "Registration failed"
        )
    }
  }
)
app.post(
  "/api-add-product",
  upload.single("Image"),
  async (req, res) => {
    let temporaryImagePath =
      req.file?.path

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
        if (
          temporaryImagePath &&
          fs.existsSync(
            temporaryImagePath
          )
        ) {
          fs.unlinkSync(
            temporaryImagePath
          )
        }

        return res
          .status(400)
          .send(
            "Missing required product fields"
          )
      }

      if (!req.file) {
        return res
          .status(400)
          .send(
            "Product image is required"
          )
      }

      const setCookie =
        await getAdminCookie()

      const createResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/Product",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              Name,
              Author,
              Description,
              Genre: Number(Genre),
              SubGenre:
                Number(SubGenre),
              Published,

              LastUpdatedBy:
                LastUpdatedBy ||
                "adminAccount",

              LastUpdated:
                LastUpdated ||
                new Date()
                  .toISOString()
                  .split("T")[0]
            })
          }
        )

      const resultText =
        await createResponse.text()

      if (!createResponse.ok) {
        if (
          temporaryImagePath &&
          fs.existsSync(
            temporaryImagePath
          )
        ) {
          fs.unlinkSync(
            temporaryImagePath
          )
        }

        return res
          .status(
            createResponse.status
          )
          .send(resultText)
      }

      let createdProductID = null

      try {
        const createdProduct =
          JSON.parse(resultText)

        createdProductID =
          createdProduct.ID ||
          createdProduct.id ||
          createdProduct.ProductID ||
          createdProduct.productID
      } catch {
        // The API sometimes returns
        // non-JSON text after creation.
      }

      if (!createdProductID) {
        const productsResponse =
          await fetch(
            "http://localhost:3001/api/inft3050/Product?limit=1000",
            {
              headers: {
                Cookie: setCookie
              }
            }
          )

        if (!productsResponse.ok) {
          if (
            temporaryImagePath &&
            fs.existsSync(
              temporaryImagePath
            )
          ) {
            fs.unlinkSync(
              temporaryImagePath
            )
          }

          const productsText =
            await productsResponse.text()

          return res
            .status(
              productsResponse.status
            )
            .send(productsText)
        }

        const productsData =
          await productsResponse.json()

        const matchingProducts = (
          productsData.list || []
        )
          .filter(
            (product) =>
              String(
                product.Name || ""
              ).toLowerCase() ===
                String(
                  Name
                ).toLowerCase() &&
              String(
                product.Author || ""
              ).toLowerCase() ===
                String(
                  Author
                ).toLowerCase()
          )
          .sort(
            (a, b) =>
              Number(b.ID) -
              Number(a.ID)
          )

        createdProductID =
          matchingProducts[0]?.ID
      }

      if (!createdProductID) {
        if (
          temporaryImagePath &&
          fs.existsSync(
            temporaryImagePath
          )
        ) {
          fs.unlinkSync(
            temporaryImagePath
          )
        }

        return res
          .status(500)
          .send(
            "Product created, but product ID could not be found"
          )
      }

      const picturesDirectory =
        path.join(
          __dirname,
          "..",
          "frontend",
          "public",
          "Pictures"
        )

      if (
        !fs.existsSync(
          picturesDirectory
        )
      ) {
        fs.mkdirSync(
          picturesDirectory,
          {
            recursive: true
          }
        )
      }

      const extensionByMimeType = {
        "image/jpeg": ".jpeg",
        "image/png": ".png",
        "image/webp": ".webp"
      }

      const imageExtension =
        extensionByMimeType[
          req.file.mimetype
        ]

      if (!imageExtension) {
        if (
          temporaryImagePath &&
          fs.existsSync(
            temporaryImagePath
          )
        ) {
          fs.unlinkSync(
            temporaryImagePath
          )
        }

        return res
          .status(400)
          .send(
            "Unsupported image format"
          )
      }

      const finalImagePath =
        path.join(
          picturesDirectory,
          `${createdProductID}${imageExtension}`
        )

      fs.renameSync(
        temporaryImagePath,
        finalImagePath
      )

      temporaryImagePath = null

      return res
        .status(201)
        .json({
          message:
            "Product and image created successfully",

          productID:
            createdProductID,

          imagePath:
            `/Pictures/${createdProductID}${imageExtension}`
        })
    } catch (error) {
      console.error(error)

      if (
        temporaryImagePath &&
        fs.existsSync(
          temporaryImagePath
        )
      ) {
        fs.unlinkSync(
          temporaryImagePath
        )
      }

      return res
        .status(500)
        .send(
          "Add product failed"
        )
    }
  }
)
app.patch(
  "/api-edit-product/:id",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const editResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/Product/${req.params.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify(
              req.body
            )
          }
        )

      const resultText =
        await editResponse.text()

      if (!editResponse.ok) {
        return res
          .status(
            editResponse.status
          )
          .send(resultText)
      }

      return res
        .status(200)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Edit product failed"
        )
    }
  }
)

app.delete(
  "/api-delete-product/:id",
  async (req, res) => {
    try {
      const productID =
        req.params.id

      const setCookie =
        await getAdminCookie()

      const deleteResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/Product/${productID}`,
          {
            method: "DELETE",

            headers: {
              Cookie: setCookie
            }
          }
        )

      const resultText =
        await deleteResponse.text()

      if (!deleteResponse.ok) {
        return res
          .status(
            deleteResponse.status
          )
          .send(resultText)
      }

      const picturesDirectory =
        path.join(
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

      for (
        const fileName
        of possibleImageFiles
      ) {
        const imagePath =
          path.join(
            picturesDirectory,
            fileName
          )

        if (
          fs.existsSync(imagePath)
        ) {
          fs.unlinkSync(imagePath)

          deletedImages.push(
            fileName
          )
        }
      }

      return res
        .status(200)
        .json({
          message:
            "Product deleted successfully",

          productID,

          deletedImages
        })
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Delete product failed"
        )
    }
  }
)
app.patch(
  "/api-edit-user/:id",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const editResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/User/${req.params.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify(
              req.body
            )
          }
        )

      const resultText =
        await editResponse.text()

      if (!editResponse.ok) {
        return res
          .status(
            editResponse.status
          )
          .send(resultText)
      }

      return res
        .status(200)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Edit user failed"
        )
    }
  }
)

app.delete(
  "/api-delete-user/:id",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const deleteResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/User/${req.params.id}`,
          {
            method: "DELETE",

            headers: {
              Cookie: setCookie
            }
          }
        )

      const resultText =
        await deleteResponse.text()

      if (!deleteResponse.ok) {
        return res
          .status(
            deleteResponse.status
          )
          .send(resultText)
      }

      return res
        .status(200)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Delete user failed"
        )
    }
  }
)
app.patch(
  "/api-edit-stocktake/:id",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const editResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/Stocktake/${req.params.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify(
              req.body
            )
          }
        )

      const resultText =
        await editResponse.text()

      if (!editResponse.ok) {
        return res
          .status(
            editResponse.status
          )
          .send(resultText)
      }

      return res
        .status(200)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Edit stocktake failed"
        )
    }
  }
)

app.post(
  "/api-add-stocktake",
  async (req, res) => {
    try {
      const {
        SourceId,
        ProductId,
        Quantity,
        Price
      } = req.body

      if (
        !SourceId ||
        !ProductId ||
        Quantity === "" ||
        Price === ""
      ) {
        return res
          .status(400)
          .send(
            "Missing required stocktake fields"
          )
      }

      const setCookie =
        await getAdminCookie()

      const createResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/Stocktake",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              SourceId:
                Number(SourceId),

              ProductId:
                Number(ProductId),

              Quantity:
                Number(Quantity),

              Price:
                Number(Price)
            })
          }
        )

      const resultText =
        await createResponse.text()

      if (!createResponse.ok) {
        return res
          .status(
            createResponse.status
          )
          .send(resultText)
      }

      return res
        .status(201)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Add stocktake failed"
        )
    }
  }
)

app.delete(
  "/api-delete-stocktake/:id",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const deleteResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/Stocktake/${req.params.id}`,
          {
            method: "DELETE",

            headers: {
              Cookie: setCookie
            }
          }
        )

      const resultText =
        await deleteResponse.text()

      if (!deleteResponse.ok) {
        return res
          .status(
            deleteResponse.status
          )
          .send(resultText)
      }

      return res
        .status(200)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Delete stocktake failed"
        )
    }
  }
)
app.post(
  "/api-create-customer",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

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

      const patronResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/Patrons",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              UserID:
                Number(PatronId),

              Email:
                Email || "",

              Name:
                Name || "",

              Salt: "",

              HashedPW: ""
            })
          }
        )

      const patronText =
        await patronResponse.text()

      if (
        !patronResponse.ok &&
        !patronText
          .toLowerCase()
          .includes("duplicate")
      ) {
        return res
          .status(
            patronResponse.status
          )
          .send(patronText)
      }

      const createResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/TO",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              PatronId:
                Number(PatronId),

              Email:
                Email || "",

              PhoneNumber:
                PhoneNumber || "",

              StreetAddress:
                StreetAddress || "",

              PostCode:
                PostCode || "",

              Suburb:
                Suburb || "",

              State:
                State || ""
            })
          }
        )

      const resultText =
        await createResponse.text()

      if (!createResponse.ok) {
        return res
          .status(
            createResponse.status
          )
          .send(resultText)
      }

      return res
        .status(201)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Create customer failed"
        )
    }
  }
)

app.patch(
  "/api-update-customer/:id",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const updateResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/TO/${req.params.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              Email:
                req.body.Email,

              PhoneNumber:
                req.body.PhoneNumber
            })
          }
        )

      const resultText =
        await updateResponse.text()

      if (!updateResponse.ok) {
        return res
          .status(
            updateResponse.status
          )
          .send(resultText)
      }

      return res
        .status(200)
        .send(resultText)
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Update customer failed"
        )
    }
  }
)

app.get(
  "/api-profile-user/:username",
  async (req, res) => {
    try {
      const setCookie =
        await getAdminCookie()

      const userResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/User?limit=1000",
          {
            headers: {
              Cookie: setCookie
            }
          }
        )

      const userData =
        await userResponse.json()

      if (!userResponse.ok) {
        return res
          .status(
            userResponse.status
          )
          .json(userData)
      }

      const foundUser = (
        userData.list || []
      ).find(
        (user) =>
          String(
            user.UserName
          ) ===
          String(
            req.params.username
          )
      )

      if (!foundUser) {
        return res
          .status(404)
          .send(
            "User not found"
          )
      }

      return res.json(
        foundUser
      )
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Load profile user failed"
        )
    }
  }
)
app.post(
  "/api-create-order",
  async (req, res) => {
    try {
      const {
        userID,
        username,
        name,
        email,
        streetAddress,
        suburb,
        state,
        postCode,
        phoneNumber,
        cardOwner,
        cardNumber,
        expiry,
        items
      } = req.body
      const numericUserID =
        Number(userID)

      if (
        !numericUserID ||
        !streetAddress ||
        !suburb ||
        !state ||
        !postCode
      ) {
        return res
          .status(400)
          .send(
            "All delivery fields are required"
          )
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .send(
            "The order must contain products"
          )
      }

      const setCookie =
        await getAdminCookie()

      const customerMap =
        loadCustomerMap()

      const userKey =
        String(numericUserID)


      let customerID =
        Number(
          customerMap[userKey]
        )

      if (customerID) {
        const existingCustomerResponse =
          await fetch(
            `http://localhost:3001/api/inft3050/TO/${customerID}`,
            {
              headers: {
                Cookie: setCookie
              }
            }
          )

        if (
          !existingCustomerResponse.ok
        ) {
          delete customerMap[userKey]

          saveCustomerMap(
            customerMap
          )

          customerID = 0
        }
      }

      if (!customerID) {
        const normalizedEmail =
          String(email || "")
            .trim()
            .toLowerCase()

        if (normalizedEmail) {
          const customersResponse =
            await fetch(
              "http://localhost:3001/api/inft3050/TO?limit=1000",
              {
                headers: {
                  Cookie: setCookie
                }
              }
            )

          const customersText =
            await customersResponse.text()

          if (
            !customersResponse.ok
          ) {
            return res
              .status(
                customersResponse.status
              )
              .send(customersText)
          }

          let customersData = {}

          try {
            customersData =
              JSON.parse(
                customersText
              )
          } catch {
            return res
              .status(500)
              .send(
                "Invalid customer data returned by API"
              )
          }

          const matchingCustomers = (
            customersData.list || []
          )
            .filter(
              (customer) => {
                const patronID =
                  customer.PatronId ??
                  customer.PatronID ??
                  customer.patronId ??
                  customer.patronID

                const customerEmail =
                  String(
                    customer.Email ||
                    customer.email ||
                    ""
                  )
                    .trim()
                    .toLowerCase()

                return (
                  (
                    patronID === null ||
                    patronID ===
                      undefined ||
                    patronID === ""
                  ) &&
                  customerEmail ===
                    normalizedEmail
                )
              }
            )
            .sort(
              (a, b) =>
                Number(
                  b.CustomerID ||
                  b.CustomerId ||
                  0
                ) -
                Number(
                  a.CustomerID ||
                  a.CustomerId ||
                  0
                )
            )

          const matchedCustomer =
            matchingCustomers[0]

          customerID =
            Number(
              matchedCustomer
                ?.CustomerID ||
              matchedCustomer
                ?.CustomerId ||
              matchedCustomer
                ?.customerID ||
              matchedCustomer
                ?.customerId
            )

          if (customerID) {
            customerMap[userKey] =
              customerID

            saveCustomerMap(
              customerMap
            )
          }
        }
      }


      if (!customerID) {
        const createCustomerResponse =
          await fetch(
            "http://localhost:3001/api/inft3050/TO",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Cookie: setCookie
              },

              body: JSON.stringify({
                PatronId: null,

                Email:
                  email || "",

                PhoneNumber: 
                phoneNumber || "",

                StreetAddress:
                  streetAddress,

                PostCode:
                  Number(postCode),

                Suburb:
                  suburb,

                State:
                  state,

                CardOwner:
                  cardOwner ||
                  name ||
                  username ||
                  "",

                CardNumber:
                  cardNumber || "",

                Expiry:
                  expiry || "",

                CVV: 0
              })
            }
          )

        const createCustomerText =
          await createCustomerResponse
            .text()

        if (
          !createCustomerResponse.ok
        ) {
          return res
            .status(
              createCustomerResponse
                .status
            )
            .send(
              createCustomerText
            )
        }

        let createdCustomer = {}

        try {
          createdCustomer =
            JSON.parse(
              createCustomerText
            )
        } catch {
          createdCustomer = {}
        }

        customerID =
          Number(
            createdCustomer
              .CustomerID ||
            createdCustomer
              .CustomerId ||
            createdCustomer
              .customerID ||
            createdCustomer
              .customerId
          )


        if (!customerID) {
          const refreshedResponse =
            await fetch(
              "http://localhost:3001/api/inft3050/TO?limit=1000",
              {
                headers: {
                  Cookie: setCookie
                }
              }
            )

          const refreshedText =
            await refreshedResponse
              .text()

          if (
            !refreshedResponse.ok
          ) {
            return res
              .status(
                refreshedResponse
                  .status
              )
              .send(
                refreshedText
              )
          }

          let refreshedData = {}

          try {
            refreshedData =
              JSON.parse(
                refreshedText
              )
          } catch {
            return res
              .status(500)
              .send(
                "Customer was created, but could not be reloaded"
              )
          }

          const normalizedEmail =
            String(email || "")
              .trim()
              .toLowerCase()

          const matchingCustomers = (
            refreshedData.list || []
          )
            .filter(
              (customer) => {
                const patronID =
                  customer.PatronId ??
                  customer.PatronID ??
                  customer.patronId ??
                  customer.patronID

                const customerEmail =
                  String(
                    customer.Email ||
                    customer.email ||
                    ""
                  )
                    .trim()
                    .toLowerCase()

                return (
                  (
                    patronID === null ||
                    patronID ===
                      undefined ||
                    patronID === ""
                  ) &&
                  String(
                    customer
                      .StreetAddress ||
                    ""
                  ) ===
                    String(
                      streetAddress
                    ) &&
                  String(
                    customer.PostCode ||
                    ""
                  ) ===
                    String(postCode) &&
                  String(
                    customer.Suburb ||
                    ""
                  ) ===
                    String(suburb) &&
                  (
                    !normalizedEmail ||
                    customerEmail ===
                      normalizedEmail
                  )
                )
              }
            )
            .sort(
              (a, b) =>
                Number(
                  b.CustomerID ||
                  b.CustomerId ||
                  0
                ) -
                Number(
                  a.CustomerID ||
                  a.CustomerId ||
                  0
                )
            )

          const createdMatch =
            matchingCustomers[0]

          customerID =
            Number(
              createdMatch
                ?.CustomerID ||
              createdMatch
                ?.CustomerId ||
              createdMatch
                ?.customerID ||
              createdMatch
                ?.customerId
            )
        }

        if (!customerID) {
          return res
            .status(500)
            .send(
              "Customer record could not be created"
            )
        }

        customerMap[userKey] =
          customerID

        saveCustomerMap(
          customerMap
        )
      }

      const updateCustomerResponse =
        await fetch(
          `http://localhost:3001/api/inft3050/TO/${customerID}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Cookie: setCookie
            },
            body: JSON.stringify({
              Email: email || "",
              PhoneNumber: phoneNumber || "",
              StreetAddress: streetAddress,
              PostCode: Number(postCode),
              Suburb: suburb,
              State: state,
              CardOwner: cardOwner || name || username || "",
              CardNumber: cardNumber || "",
              Expiry: expiry || "",
              CVV: 0
            })
          }
        )

      const updateCustomerText =
        await updateCustomerResponse.text()

      if (!updateCustomerResponse.ok) {
        return res
          .status(updateCustomerResponse.status)
          .send(updateCustomerText)
      }

      const orderResponse =
        await fetch(
          "http://localhost:3001/api/inft3050/Orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Cookie: setCookie
            },

            body: JSON.stringify({
              Customer:
                customerID,

              StreetAddress:
                streetAddress,

              PostCode:
                Number(postCode),

              Suburb:
                suburb,

              State:
                state
            })
          }
        )

      const orderText =
        await orderResponse.text()

      if (!orderResponse.ok) {
        return res
          .status(
            orderResponse.status
          )
          .send(orderText)
      }

      let createdOrder = {}

      try {
        createdOrder =
          JSON.parse(orderText)
      } catch {
        createdOrder = {
          message: orderText
        }
      }

      let orderID =
        Number(
          createdOrder.OrderID ||
          createdOrder.OrderId ||
          createdOrder.id
        )

      if (!orderID) {
        const ordersResponse =
          await fetch(
            "http://localhost:3001/api/inft3050/Orders?limit=1000",
            {
              headers: {
                Cookie: setCookie
              }
            }
          )

        const ordersText =
          await ordersResponse.text()

        if (!ordersResponse.ok) {
          return res
            .status(
              ordersResponse.status
            )
            .send(ordersText)
        }

        let ordersData = {}

        try {
          ordersData =
            JSON.parse(
              ordersText
            )
        } catch {
          return res
            .status(500)
            .send(
              "Order was created, but could not be reloaded"
            )
        }

        const matchingOrders = (
          ordersData.list || []
        )
          .filter(
            (order) =>
              Number(
                order.Customer
              ) ===
                customerID &&
              String(
                order.StreetAddress
              ) ===
                String(
                  streetAddress
                ) &&
              String(
                order.PostCode
              ) ===
                String(postCode) &&
              String(
                order.Suburb
              ) ===
                String(suburb)
          )
          .sort(
            (a, b) =>
              Number(
                b.OrderID || 0
              ) -
              Number(
                a.OrderID || 0
              )
          )

        orderID =
          Number(
            matchingOrders[0]
              ?.OrderID
          )
      }

      if (!orderID) {
        return res
          .status(500)
          .send(
            "Order was created, but its OrderID could not be found"
          )
      }


      return res
        .status(201)
        .json({
          message:
            "Order created successfully",

          OrderID:
            orderID,

          UserID:
            numericUserID,

          Customer:
            customerID,

          items:
            items.map(
              (item) => ({
                ProductID:
                  Number(
                    item.productID
                  ),

                ItemId:
                  Number(
                    item.itemID
                  ),

                SourceId:
                  Number(
                    item.sourceID
                  ),

                quantity:
                  Number(
                    item.quantity ||
                    1
                  ),

                price:
                  Number(
                    item.price ||
                    0
                  )
              })
            )
        })
    } catch (error) {
      console.error(error)

      return res
        .status(500)
        .send(
          "Create order failed"
        )
    }
  }
)
const PORT = 5050

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  )
})