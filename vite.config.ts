import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  root: ".",
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        mapViewer: resolve(__dirname, "map-viewer.html")
      },
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) return "vendor-react";
          if (id.includes("leaflet")) return "vendor-map";
          if (id.includes("@tanstack")) return "vendor-table";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("zustand")) return "vendor-state";
          return "vendor";
        }
      }
    }
  }
});
