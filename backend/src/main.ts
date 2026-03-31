import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { AppModule } from "./app.module";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "access_token",
  "token",
  "authorization",
  "cookie"
]);

function isDockerRuntime() {
  return process.env.DOCKER === "true" || fs.existsSync("/.dockerenv");
}

function sanitizePayload(value: unknown): unknown {
  if (value == null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item));
  }
  if (typeof value === "object") {
    if (Buffer.isBuffer(value)) {
      return `[buffer:${value.length}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, entryValue]) => {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
          return [key, "[redacted]"];
        }
        return [key, sanitizePayload(entryValue)];
      }
    );
    return Object.fromEntries(entries);
  }
  if (typeof value === "string" && value.length > 2000) {
    return `${value.slice(0, 2000)}...[truncated]`;
  }
  return value;
}

function createDockerHttpLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();
    let responseBody: unknown;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      responseBody = body;
      return originalJson(body);
    }) as Response["json"];

    const originalSend = res.send.bind(res);
    res.send = ((body: unknown) => {
      responseBody = body;
      return originalSend(body);
    }) as Response["send"];

    res.on("finish", () => {
      const durationMs = Date.now() - startedAt;
      const requestBody = req.is("multipart/form-data")
        ? "[multipart/form-data]"
        : sanitizePayload(req.body);

      const entry = {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip,
        request: {
          query: sanitizePayload(req.query),
          body: requestBody
        },
        response: sanitizePayload(responseBody)
      };

      // Docker captura stdout/stderr em `docker logs`.
      console.log(`[HTTP] ${JSON.stringify(entry)}`);
    });

    next();
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  if (isDockerRuntime()) {
    app.use(createDockerHttpLogger());
  }
  const uploadsDir = path.resolve(process.cwd(), "assets", "uploads");

  app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
    const decodedPath = decodeURIComponent(req.path);
    const filePath = path.normalize(path.join(uploadsDir, decodedPath));

    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).end();
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return res.sendFile(filePath);
    }

    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  app.enableCors({
    origin: true,
    credentials: true
  });

  const port = Number(process.env.APP_PORT || 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Backend rodando na porta ${port}`);
}

bootstrap();
