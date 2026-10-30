import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

import { cloudflare } from "@cloudflare/vite-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
    },
  },
});