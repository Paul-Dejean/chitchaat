import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 3000,
    // https: {
    //   key: fs.readFileSync("./cert/10.40.119.136-key.pem"),
    //   cert: fs.readFileSync("./cert/10.40.119.136.pem"),
    // },
    host: "0.0.0.0",
    strictPort: true,
  },
});
