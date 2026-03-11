import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { StoresModule } from "../stores/stores.module";
import { RedisModule } from "../redis/redis.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { ProtectedController } from "./protected.controller";

@Module({
  imports: [
    StoresModule,
    RedisModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "dev_secret_change_me",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    })
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController, ProtectedController]
})
export class AuthModule {}
