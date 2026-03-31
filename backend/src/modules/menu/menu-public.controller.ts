import { Controller, Get, NotFoundException, Param, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { StoresService } from "../stores/stores.service";
import { MenuService } from "./menu.service";

function resolveDomainFolder(domain: string) {
  const rawDomain = domain || "unknown";
  const withPrefix = rawDomain.startsWith("@") ? rawDomain : `@${rawDomain}`;
  const safeWithPrefix = withPrefix.replace(/[^a-zA-Z0-9.@-]/g, "_");
  const safeWithoutPrefix = rawDomain.replace(/[^a-zA-Z0-9.-]/g, "_");
  const baseDir = path.resolve(process.cwd(), "assets", "uploads");
  const withPrefixDir = path.join(baseDir, safeWithPrefix);
  const withoutPrefixDir = path.join(baseDir, safeWithoutPrefix);
  if (fs.existsSync(withPrefixDir)) {
    return safeWithPrefix;
  }
  if (fs.existsSync(withoutPrefixDir)) {
    return safeWithoutPrefix;
  }
  return safeWithPrefix;
}

function buildMediaUrls(domainFolder: string, files: string[] | null) {
  if (!files || files.length === 0) return [];
  const base = process.env.PUBLIC_BASE_URL || "";
  return files.map((file) => `${base}/uploads/${domainFolder}/${file}`);
}

@Controller("public")
export class MenuPublicController {
  constructor(
    private readonly menuService: MenuService,
    private readonly storesService: StoresService
  ) {}

  @Get("menu/:userId")
  async getPublicMenu(
    @Param("userId") userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
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

    const accessCookieName = `store_access_${store.id}`;
    const hasAccessCookie = Boolean(req.cookies?.[accessCookieName]);
    const skipPageView = req.header("x-skip-pageview") === "1";
    const visitorCookieName = `store_visitor_${store.id}`;
    const hasVisitorCookie = Boolean(req.cookies?.[visitorCookieName]);
    if (!hasVisitorCookie) {
      res.cookie(visitorCookieName, "1", {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }

    if (!hasAccessCookie && !skipPageView) {
      await this.storesService.incrementPageViews(store.id, {
        isReturning: hasVisitorCookie
      });
      res.cookie(accessCookieName, "1", {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }
    if (!store.active) {
      return { active: false, sections: [] };
    }

    const domainFolder = resolveDomainFolder(store.domain);
    const entries = await this.menuService.listSectionsWithProducts(store.id, {
      onlyVisible: true
    });

    const sections = entries.map((entry) => ({
      id: entry.section.id,
      name: entry.section.name,
      displayType: entry.section.displayType,
      config: entry.section.configJson,
      products: entry.products.map((row) => {
        const mediaFiles = this.menuService.parseMediaFiles(row.media_files);
        return {
          id: row.product_id,
          name: row.name,
          description: row.description,
          estimatedPrice: row.estimated_price,
          mediaType: row.media_type,
          mediaUrls: buildMediaUrls(domainFolder, mediaFiles),
          featured: row.featured,
          position: row.position
        };
      })
    }));

    return { active: true, sections };
  }
}
