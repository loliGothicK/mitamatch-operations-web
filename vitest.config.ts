import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./src/test/shims/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    coverage: {
      reporter: ["text", "html", "json-summary"],
    },
  },
});
