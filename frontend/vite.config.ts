import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  base: "/",
  plugins: [react()],
  define: {
    "global": "window",
  },
  optimizeDeps: {
    include: ["leaflet"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    modulePreload: {
      polyfill: false,
      resolveDependencies(_url: string, deps: string[]) {
        return deps.filter(
          (dep) =>
            !dep.includes("pdf") &&
            !dep.includes("charts") &&
            !dep.includes("maps")
        )
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router")
          ) {
            return "vendor"
          }
          if (id.includes("node_modules/framer-motion")) {
            return "motion"
          }
          if (id.includes("node_modules/recharts")) {
            return "charts"
          }
          if (
            id.includes("node_modules/leaflet/") ||
            id.includes("node_modules/@react-google-maps")
          ) {
            return "maps"
          }
          if (id.includes("node_modules/firebase")) {
            return "firebase"
          }
          if (
            id.includes("node_modules/jspdf") ||
            id.includes("node_modules/jspdf-autotable") ||
            id.includes("node_modules/html2canvas")
          ) {
            return "pdf"
          }
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/lucide-react")) {
            return "ui"
          }
        },
      },
    },
  },
})
