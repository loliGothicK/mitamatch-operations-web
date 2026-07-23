import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { match } from "ts-pattern";

if (
  match(process.env.NODE_ENV)
    .with("test", () => false)
    .with("development", () => !process.env.POSTGRES_DEVELOP_BRANCH_URL)
    .with("production", () => !process.env.POSTGRES_URL)
    .exhaustive()
) {
  throw new Error("drizzle.config.ts: DATABASE_URL is missing");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials:
    process.env.NODE_ENV === "development"
      ? {
          url: process.env.POSTGRES_DEVELOP_BRANCH_URL!,
          ssl: "allow",
        }
      : {
          url: process.env.POSTGRES_URL!,
          ssl: "verify-full",
        },
});
