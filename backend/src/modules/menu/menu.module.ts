import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StoresModule } from "../stores/stores.module";
import { Product } from "../products/product.entity";
import { MenuController } from "./menu.controller";
import { MenuPublicController } from "./menu-public.controller";
import { MenuSection } from "./menu-section.entity";
import { MenuSectionProduct } from "./menu-section-product.entity";
import { MenuService } from "./menu.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([MenuSection, MenuSectionProduct, Product]),
    StoresModule
  ],
  controllers: [MenuController, MenuPublicController],
  providers: [MenuService]
})
export class MenuModule {}
