import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignorelint/style/noNonNullAssertion: should be set in env
    url: process.env.POSTGRES_URL!,
  },
});
