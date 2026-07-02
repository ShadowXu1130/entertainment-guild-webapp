import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api-register": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api-add-product": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api-edit-product": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api-edit-user": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api-delete-user": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api-edit-stocktake": {
        target: "http://localhost:5050",
        changeOrigin: true
      },

      "/api-login": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: () => "/login",
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
      },

      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        headers: {
          origin: ""
        }
      }
    }
  }
})