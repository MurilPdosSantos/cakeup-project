import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6574,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost",
        changeOrigin: true
      }
    }
  }
});
