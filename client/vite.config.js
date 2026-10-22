import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  envDir: path.resolve(import.meta.dirname, ".."),
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5055",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
