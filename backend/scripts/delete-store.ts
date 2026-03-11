import * as fs from "fs";
import * as path from "path";
import { DataSource } from "typeorm";
import { Store } from "../src/modules/stores/store.entity";

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

  const [identifier] = process.argv.slice(2);
  if (!identifier) {
    // eslint-disable-next-line no-console
    console.error("Uso: npm run delete:store -- <id|domain|name>");
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: "postgres",
    host: getEnv("DB_HOST", "postgres"),
    port: Number(getEnv("DB_PORT", "5432")),
    username: getEnv("DB_USER", "cakeup"),
    password: getEnv("DB_PASSWORD", "cakeup"),
    database: getEnv("DB_NAME", "cakeup"),
    entities: [Store],
    synchronize: false
  });

  await dataSource.initialize();
  try {
    const repo = dataSource.getRepository(Store);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identifier
    );
    const where = isUuid
      ? [{ id: identifier }, { domain: identifier }, { name: identifier }]
      : [{ domain: identifier }, { name: identifier }];
    const store = await repo.findOne({ where });

    if (!store) {
      // eslint-disable-next-line no-console
      console.error("Loja nao encontrada.");
      process.exit(1);
    }

    await repo.remove(store);
    // eslint-disable-next-line no-console
    console.log(`Loja removida: ${store.id}`);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
