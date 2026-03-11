import { Module } from "@nestjs/common";
import { StoresModule } from "../stores/stores.module";
import { MetricsController } from "./metrics.controller";

@Module({
  imports: [StoresModule],
  controllers: [MetricsController]
})
export class MetricsModule {}
