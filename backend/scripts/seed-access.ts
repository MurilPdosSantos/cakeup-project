import * as fs from "fs";
import * as path from "path";
import { DataSource } from "typeorm";
import { Store } from "../src/modules/stores/store.entity";
import { StoreAccessDaily } from "../src/modules/stores/store-access-daily.entity";
import { StoreAccessHourly } from "../src/modules/stores/store-access-hourly.entity";

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

function parseArg(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index === -1) return "";
  return args[index + 1] || "";
}

function getUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getRandomInt(min: number, max: number) {
  const clampedMin = Math.ceil(min);
  const clampedMax = Math.floor(max);
  return Math.floor(Math.random() * (clampedMax - clampedMin + 1)) + clampedMin;
}

function splitCountByHours(total: number) {
  const weights = Array.from({ length: 24 }, () => Math.random());
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || 1;
  const result = weights.map((weight) => Math.floor((weight / weightSum) * total));
  let remaining = total - result.reduce((sum, value) => sum + value, 0);
  while (remaining > 0) {
    const hour = getRandomInt(0, 23);
    result[hour] += 1;
    remaining -= 1;
  }
  return result;
}

async function run() {
  ensureInternalExecution();
  const rootEnv = path.resolve(__dirname, "..", "..", ".env");
  const backendEnv = path.resolve(__dirname, "..", ".env");
  loadEnvFile(rootEnv);
  loadEnvFile(backendEnv);

  const args = process.argv.slice(2);
  const storeId = parseArg(args, "--store");
  const domain = parseArg(args, "--domain");
  const days = Number(parseArg(args, "--days") || "30");
  const min = Number(parseArg(args, "--min") || "5");
  const max = Number(parseArg(args, "--max") || "60");

  if ((!storeId && !domain) || Number.isNaN(days) || Number.isNaN(min) || Number.isNaN(max)) {
    // eslint-disable-next-line no-console
    console.error(
      "Uso: npm run seed:access -- --store <id> [--days 30] [--min 5] [--max 60]\n" +
        "   ou: npm run seed:access -- --domain <dominio> [--days 30] [--min 5] [--max 60]"
    );
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: "postgres",
    host: getEnv("DB_HOST", "postgres"),
    port: Number(getEnv("DB_PORT", "5432")),
    username: getEnv("DB_USER", "cakeup"),
    password: getEnv("DB_PASSWORD", "cakeup"),
    database: getEnv("DB_NAME", "cakeup"),
    entities: [Store, StoreAccessDaily, StoreAccessHourly],
    synchronize: true
  });

  await dataSource.initialize();
  try {
    const storesRepo = dataSource.getRepository(Store);
    const accessRepo = dataSource.getRepository(StoreAccessDaily);
    const hourlyRepo = dataSource.getRepository(StoreAccessHourly);
    const store =
      (storeId ? await storesRepo.findOne({ where: { id: storeId } }) : null) ||
      (domain ? await storesRepo.findOne({ where: { domain } }) : null);
    if (!store) {
      // eslint-disable-next-line no-console
      console.error("Loja nao encontrada.");
      process.exit(1);
    }

    const today = getUtcDay();
    const startDay = addUtcDays(today, -(days - 1));
    let totalInserted = 0;

    for (let i = 0; i < days; i += 1) {
      const day = addUtcDays(startDay, i);
      const count = getRandomInt(min, max);
      const newCount = Math.max(1, Math.floor(count * getRandomInt(30, 60) / 100));
      const returningCount = Math.max(0, count - newCount);
      totalInserted += count;
      await accessRepo
        .createQueryBuilder()
        .insert()
        .values({ storeId: store.id, day, count, newCount, returningCount })
        .onConflict(
          `("store_id","day") DO UPDATE SET ` +
            `"count" = "StoreAccessDaily"."count" + EXCLUDED."count", ` +
            `"new_count" = "StoreAccessDaily"."new_count" + EXCLUDED."new_count", ` +
            `"returning_count" = "StoreAccessDaily"."returning_count" + EXCLUDED."returning_count"`
        )
        .execute();
      const hourlyCounts = splitCountByHours(count);
      for (let hour = 0; hour < hourlyCounts.length; hour += 1) {
        const hourCount = hourlyCounts[hour];
        if (!hourCount) continue;
        await hourlyRepo
          .createQueryBuilder()
          .insert()
          .values({ storeId: store.id, day, hour, count: hourCount })
          .onConflict(
            `("store_id","day","hour") DO UPDATE SET ` +
              `"count" = "StoreAccessHourly"."count" + EXCLUDED."count"`
          )
          .execute();
      }
    }

    if (totalInserted > 0) {
      await storesRepo.increment({ id: store.id }, "pageViews", totalInserted);
    }

    // eslint-disable-next-line no-console
    console.log(
      `Acessos inseridos para loja ${store.id}: ${totalInserted} em ${days} dias.`
    );
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
