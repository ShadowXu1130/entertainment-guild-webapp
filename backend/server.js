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

app.post("/api-register", async (req, res) => {
  try {
    const { username, name, password } = req.body

    if (!username || !name || !password) {
      return res
        .status(400)
        .send("Username, name and password are required")
    }

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
      return res
        .status(500)
        .send("Failed to authenticate API access")
    }

    const setCookie = loginResponse.headers.get("set-cookie")

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

const PORT = 5050

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})