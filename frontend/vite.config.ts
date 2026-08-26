import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router-dom")) {
            return "vendor"
          }
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/leaflet.heat") || id.includes("node_modules/leaflet.markercluster")) {
            return "leaflet"
          }
          if (id.includes("node_modules/recharts")) {
            return "charts"
          }
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/lucide-react")) {
            return "ui"
          }
        },
      },
    },
  },
})
