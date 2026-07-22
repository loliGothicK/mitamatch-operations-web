import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts", "AGENTS.md"],
  printWidth: 100,
  overrides: [
    {
      files: ["*.test.js", "*.spec.ts"],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ["*.md", "*.html"],
      excludeFiles: ["*.min.js"],
      options: {
        tabWidth: 4,
      },
    },
  ],
});
