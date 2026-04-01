import { SetMetadata } from "@nestjs/common";
import { StoreModule } from "../stores/store-module.enum";

export const REQUIRED_MODULE_KEY = "required_module";
export const RequireModule = (module: StoreModule) =>
  SetMetadata(REQUIRED_MODULE_KEY, module);
