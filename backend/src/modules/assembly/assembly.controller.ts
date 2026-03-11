import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AssemblyService } from "./assembly.service";

type AuthedRequest = { user?: { storeId: string } };

@Controller("assembly")
export class AssemblyController {
  constructor(private readonly assemblyService: AssemblyService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: AuthedRequest) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      return { massas: [], recheios: [], doces: [] };
    }

    const data = await this.assemblyService.listByStore(storeId);

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
      })),
      doces: data.doces.map((item) => ({
        id: item.id,
        name: item.name,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : null
      }))
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("items")
  async create(@Req() req: AuthedRequest) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const { name, type, pricePerKg } = (req as any).body || {};
    if (!name || typeof name !== "string") {
      throw new BadRequestException("Nome obrigatorio");
    }
    if (!["MASSA", "RECHEIO", "DOCE"].includes(type)) {
      throw new BadRequestException("Tipo invalido");
    }

    const item = await this.assemblyService.create({
      storeId,
      name,
      type,
      pricePerKg: pricePerKg ? String(pricePerKg) : null
    });

    return {
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : null
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put("items/:id")
  async update(@Req() req: AuthedRequest, @Param("id") id: string) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const { name, pricePerKg } = (req as any).body || {};
    if (!name || typeof name !== "string") {
      throw new BadRequestException("Nome obrigatorio");
    }

    const item = await this.assemblyService.updateById(id, storeId, {
      name,
      pricePerKg: pricePerKg ? String(pricePerKg) : null
    });
    if (!item) {
      throw new NotFoundException("Item nao encontrado");
    }

    return {
      item: {
        id: item.id,
        name: item.name,
        type: item.type,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : null
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("items/:id")
  async remove(@Req() req: AuthedRequest, @Param("id") id: string) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }
    const ok = await this.assemblyService.deleteById(id, storeId);
    if (!ok) {
      throw new NotFoundException("Item nao encontrado");
    }
    return { ok: true };
  }
}
