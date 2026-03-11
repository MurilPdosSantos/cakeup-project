import * as fs from "fs";
import * as path from "path";
import { DataSource } from "typeorm";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

function ensureInternalExecution() {
  const runningInDocker = fs.existsSync("/.dockerenv");
  const allowInternal = process.env.CAKEUP_INTERNAL === "true";
  if (!runningInDocker && !allowInternal) {
    throw new Error(
      "Script bloqueado. Execute internamente (Docker) ou defina CAKEUP_INTERNAL=true."
    );
  }
}

function initEnv() {
  const rootEnv = path.resolve(__dirname, "..", "..", ".env");
  const backendEnv = path.resolve(__dirname, "..", ".env");
  loadEnvFile(rootEnv);
  loadEnvFile(backendEnv);
}

async function run() {
  ensureInternalExecution();
  initEnv();

  const dataSource = new DataSource({
    type: "postgres",
    host: getEnv("DB_HOST", "postgres"),
    port: Number(getEnv("DB_PORT", "5432")),
    username: getEnv("DB_USER", "cakeup"),
    password: getEnv("DB_PASSWORD", "cakeup"),
    database: getEnv("DB_NAME", "cakeup"),
    synchronize: false
  });

  await dataSource.initialize();
  try {
    const runner = dataSource.createQueryRunner();
    await runner.query(
      'ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "page_views" int NOT NULL DEFAULT 0'
    );
    await runner.query(
      'ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "top_product_name" varchar(255)'
    );
    await runner.query(
      'ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "top_product_quantity" int NOT NULL DEFAULT 0'
    );
    // eslint-disable-next-line no-console
    console.log("Migration concluida: stores metrics adicionadas.");
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
