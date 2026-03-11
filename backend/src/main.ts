import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as path from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const uploadsDir = path.resolve(process.cwd(), "assets", "uploads");
  app.use("/uploads", express.static(uploadsDir));
  app.use(
    "/uploads/@",
    (req, res, next) => {
      req.url = req.url.replace(/^\/@/, "/");
      next();
    },
    express.static(uploadsDir)
  );
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
