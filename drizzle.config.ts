import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.NODE_ENV === "development"
        ? process.env.POSTGRES_DEVELOP_BRANCH_URL!
        : process.env.POSTGRES_URL!,
  },
});
