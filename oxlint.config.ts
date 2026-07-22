import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "oxc", "unicorn", "react", "nextjs"],
  ignorePatterns: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  options: {
    denyWarnings: true,
    typeAware: true,
  },
  rules: {
    "typescript/no-deprecated": "error",
  },
});
