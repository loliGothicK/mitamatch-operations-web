import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  define: {
    "process.env": {},
    "process.env.DATABASE_URL": "'postgres://dummy'",
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
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./vitest.setup.tsx"],
  },
});
