import * as fs from "fs";
import * as path from "path";
import { DataSource } from "typeorm";
import { Store } from "../src/modules/stores/store.entity";
import { createInterface } from "readline/promises";

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

async function confirmDangerousAction() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const confirm = await rl.question(
      'Digite "CONFIRMAR" para apagar todas as lojas: '
    );
    if (confirm.trim() !== "CONFIRMAR") {
      throw new Error("Confirmacao invalida.");
    }
    const password = await rl.question("Senha de confirmacao: ");
    if (password.trim() !== "17Gcmaiojf!") {
      throw new Error("Senha incorreta.");
    }
  } finally {
    rl.close();
  }
}

async function run() {
  ensureInternalExecution();
  initEnv();
  await confirmDangerousAction();

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
    const result = await repo.delete({});
    // eslint-disable-next-line no-console
    console.log(`Lojas removidas: ${result.affected ?? 0}`);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
