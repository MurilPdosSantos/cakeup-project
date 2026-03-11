import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { StoresService } from "../stores/stores.service";
import { AssemblyService } from "./assembly.service";

@Controller("public")
export class AssemblyPublicController {
  constructor(
    private readonly assemblyService: AssemblyService,
    private readonly storesService: StoresService
  ) {}

  @Get("assembly/:userId")
  async listPublic(@Param("userId") userId: string) {
    const normalized = userId?.trim() || "";
    const withoutAt = normalized.startsWith("@") ? normalized.slice(1) : normalized;
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        normalized
      );

    const store =
      (isUuid ? await this.storesService.findById(normalized) : null) ||
      (normalized ? await this.storesService.findByDomain(normalized) : null) ||
      (withoutAt ? await this.storesService.findByDomain(withoutAt) : null);

    if (!store) {
      throw new NotFoundException("Loja nao encontrada");
    }

    const data = await this.assemblyService.listByStore(store.id);
    return {
      massas: data.massas.map((item) => ({
        id: item.id,
        name: item.name,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : null
      })),
      recheios: data.recheios.map((item) => ({
        id: item.id,
        name: item.name,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : null
      }))
    };
  }
}
