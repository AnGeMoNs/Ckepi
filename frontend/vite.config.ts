import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "i18next", "react-i18next"],
          icons: ["lucide-react"],
          maplibre: ["maplibre-gl"],
          three: ["three"],
        },
      },
    },
  },
  esbuild: {
    legalComments: "none",
  },
  server: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
    },
  },
});
