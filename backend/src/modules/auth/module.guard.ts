import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { StoresService } from "../stores/stores.service";
import { StoreModule } from "../stores/store-module.enum";
import { REQUIRED_MODULE_KEY } from "./require-module.decorator";

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly storesService: StoresService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<StoreModule>(
      REQUIRED_MODULE_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const storeId = request.user?.storeId;
    if (!storeId) throw new ForbiddenException("Loja não identificada");

    const store = await this.storesService.findById(storeId);
    if (!store) throw new ForbiddenException("Loja não encontrada");

    if (!this.storesService.hasModule(store, requiredModule)) {
      throw new ForbiddenException(
        `Módulo "${requiredModule}" não habilitado para esta loja`
      );
    }

    return true;
  }
}
