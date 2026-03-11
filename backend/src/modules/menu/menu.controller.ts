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
import { MenuDisplayType } from "./menu-section.entity";
import { MenuService } from "./menu.service";

type AuthedRequest = { user?: { storeId: string; domain?: string } };

function parseConfig(raw: unknown) {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") {
    return raw as Record<string, any>;
  }
  return null;
}

function normalizeDisplayType(value: unknown): MenuDisplayType | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (
    trimmed === "grid" ||
    trimmed === "list" ||
    trimmed === "carousel" ||
    trimmed === "featured" ||
    trimmed === "tabs"
  ) {
    return trimmed as MenuDisplayType;
  }
  return null;
}

@Controller("menu")
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @UseGuards(JwtAuthGuard)
  @Post("sections")
  async createSection(@Req() req: AuthedRequest) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const { name, display_type, displayType, config, config_json, configJson } =
      (req as any).body || {};
    if (!name || typeof name !== "string") {
      throw new BadRequestException("Nome da secao obrigatorio");
    }

    const parsedDisplayType = normalizeDisplayType(
      displayType ?? display_type
    );
    if (!parsedDisplayType) {
      throw new BadRequestException("Tipo de exibicao invalido");
    }

    const parsedConfig = parseConfig(configJson ?? config_json ?? config);
    const section = await this.menuService.createSection({
      storeId,
      name: name.trim(),
      displayType: parsedDisplayType,
      configJson: parsedConfig
    });

    return {
      section: {
        id: section.id,
        name: section.name,
        displayType: section.displayType,
        config: section.configJson
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get("sections")
  async listSections(@Req() req: AuthedRequest) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      return { sections: [] };
    }

    const entries = await this.menuService.listSectionsWithProducts(storeId);
    return {
      sections: entries.map((entry) => ({
        id: entry.section.id,
        name: entry.section.name,
        displayType: entry.section.displayType,
        config: entry.section.configJson,
        products: entry.products.map((row) => ({
          productId: row.product_id,
          position: row.position,
          featured: row.featured,
          visible: row.visible
        }))
      }))
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put("sections/:id")
  async updateSection(@Req() req: AuthedRequest, @Param("id") id: string) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const { name, display_type, displayType, config, config_json, configJson } =
      (req as any).body || {};
    const payload: {
      name?: string;
      displayType?: MenuDisplayType;
      configJson?: Record<string, any> | null;
    } = {};

    if (typeof name === "string" && name.trim()) {
      payload.name = name.trim();
    }

    const parsedDisplayType = normalizeDisplayType(
      displayType ?? display_type
    );
    if (parsedDisplayType) {
      payload.displayType = parsedDisplayType;
    } else if (displayType || display_type) {
      throw new BadRequestException("Tipo de exibicao invalido");
    }

    const parsedConfig = parseConfig(configJson ?? config_json ?? config);
    if (parsedConfig !== null || configJson || config_json || config) {
      payload.configJson = parsedConfig;
    }

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException("Nenhum campo valido para atualizar");
    }

    const section = await this.menuService.updateSectionById(
      id,
      storeId,
      payload
    );
    if (!section) {
      throw new NotFoundException("Secao nao encontrada");
    }

    return {
      section: {
        id: section.id,
        name: section.name,
        displayType: section.displayType,
        config: section.configJson
      }
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete("sections/:id")
  async deleteSection(@Req() req: AuthedRequest, @Param("id") id: string) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const ok = await this.menuService.deleteSectionById(id, storeId);
    if (!ok) {
      throw new NotFoundException("Secao nao encontrada");
    }
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("sections/:id/products")
  async linkProducts(@Req() req: AuthedRequest, @Param("id") id: string) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      throw new BadRequestException("Loja invalida");
    }

    const section = await this.menuService.findSectionByIdForStore(id, storeId);
    if (!section) {
      throw new NotFoundException("Secao nao encontrada");
    }

    const { products } = (req as any).body || {};
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException("Produtos invalidos");
    }

    const payload = products
      .map((item: any) => ({
        productId: item?.product_id || item?.productId,
        position:
          typeof item?.position === "number"
            ? item.position
            : item?.position
            ? Number(item.position)
            : undefined,
        featured:
          typeof item?.featured === "boolean"
            ? item.featured
            : item?.featured === "true",
        visible:
          typeof item?.visible === "boolean"
            ? item.visible
            : item?.visible === "false"
            ? false
            : item?.visible === "true"
            ? true
            : undefined
      }))
      .filter((item: any) => typeof item.productId === "string");

    if (payload.length === 0) {
      throw new BadRequestException("Produtos invalidos");
    }

    const result = await this.menuService.upsertSectionProducts(
      section.id,
      storeId,
      payload
    );

    return {
      ok: true,
      saved: result.saved,
      ignored: result.ignored
    };
  }
}
