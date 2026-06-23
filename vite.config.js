import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

function copyRuntimeAssets() {
  return {
    name: "copy-dg-runtime-assets",
    async closeBundle() {
      const root = process.cwd();
      const output = resolve(root, "dist");
      await mkdir(output, { recursive: true });
      await Promise.all([
        cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true }),
        cp(resolve(root, "vendor"), resolve(output, "vendor"), { recursive: true }),
      ]);
    },
  };
}

export default defineConfig({
  plugins: [vue(), copyRuntimeAssets()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
