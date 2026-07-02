const express = require("express")
const cors = require("cors")
const crypto = require("crypto")

const app = express()

app.use(cors())
app.use(express.json())

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

app.post("/api-add-product", async (req, res) => {
  try {
    const {
      Name,
      Author,
      Description,
      SubGenre,
      Published,
      LastUpdatedBy,
      LastUpdated
    } = req.body

    if (!Name || !Author || !Description || !SubGenre || !Published) {
      return res.status(400).send("Missing required product fields")
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
          SubGenre: Number(SubGenre),
          Published,
          LastUpdatedBy: LastUpdatedBy || "adminAccount",
          LastUpdated: LastUpdated || new Date().toISOString().split("T")[0]
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
    res.status(500).send("Add product failed")
  }
})

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

const PORT = 5050

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})