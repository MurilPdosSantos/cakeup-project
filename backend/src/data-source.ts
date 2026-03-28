import "reflect-metadata";
import * as path from "path";
import * as fs from "fs";
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

loadEnvFile(path.resolve(__dirname, "..", "..", ".env"));
loadEnvFile(path.resolve(__dirname, "..", ".env"));

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "cakeup",
  password: process.env.DB_PASSWORD || "cakeup",
  database: process.env.DB_NAME || "cakeup",
  entities: [path.join(__dirname, "**/*.entity{.ts,.js}")],
  migrations: [path.join(__dirname, "migrations/*{.ts,.js}")],
  synchronize: false
});
