import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Store } from "./store.entity";
import { StoreAccessDaily } from "./store-access-daily.entity";
import { StoreAccessHourly } from "./store-access-hourly.entity";
import { StoresService } from "./stores.service";

@Module({
  imports: [TypeOrmModule.forFeature([Store, StoreAccessDaily, StoreAccessHourly])],
  providers: [StoresService],
  exports: [StoresService]
})
export class StoresModule {}
