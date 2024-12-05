import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "node:process";
import type { Config } from "drizzle-kit";

const { DATABASE_URL: url } = env;

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url,
    ssl: {
      ca: readFileSync(resolve("rds-ca-2019-root.pem")).toString(),
      rejectUnauthorized: false,
    },
  },
} satisfies Config;
