import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api-login": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: () => "/login",
        headers: {
          origin: ""
        }
      },

      "/api-register": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        headers: {
          origin: ""
        }
      },

      "/login": {
        target: "http://localhost:3001",
        changeOrigin: true,
        headers: {
          origin: ""
        }
      }
    }
  }
})