import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { match } from "ts-pattern";

if (
  match(process.env.NODE_ENV)
    .with("development", () => !process.env.POSTGRES_DEVELOP_BRANCH_URL)
    .with("test", () => false)
    .with("production", () => false)
    .exhaustive()
) {
  throw new Error("drizzle.config.ts: DATABASE_URL is missing");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_DEVELOP_BRANCH_URL!,
    ssl: {
      rejectUnauthorized: true,
      cert: "./cacert.pem",
    },
  },
});
