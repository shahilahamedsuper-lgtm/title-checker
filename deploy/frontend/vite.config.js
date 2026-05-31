import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy: forward /api calls to the Express backend
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    // Ensure React Router (or any client-side router) works on refresh
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
