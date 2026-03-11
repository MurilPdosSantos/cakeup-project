import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssemblyItem } from "./assembly-item.entity";
import { AssemblyService } from "./assembly.service";
import { AssemblyController } from "./assembly.controller";
import { AssemblyPublicController } from "./assembly-public.controller";
import { StoresModule } from "../stores/stores.module";

@Module({
  imports: [TypeOrmModule.forFeature([AssemblyItem]), StoresModule],
  controllers: [AssemblyController, AssemblyPublicController],
  providers: [AssemblyService]
})
export class AssemblyModule {}
