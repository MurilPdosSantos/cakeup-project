import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { RedisModule } from "./modules/redis/redis.module";
import { StoresModule } from "./modules/stores/stores.module";
import { ProductsModule } from "./modules/products/products.module";
import { AssemblyModule } from "./modules/assembly/assembly.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { MenuModule } from "./modules/menu/menu.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../.env"]
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true
    }),
    RedisModule,
    StoresModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    AssemblyModule,
    MetricsModule,
    MenuModule
  ]
})
export class AppModule {}
