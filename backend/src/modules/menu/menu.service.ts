import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Product } from "../products/product.entity";
import { MenuSection, MenuDisplayType } from "./menu-section.entity";
import { MenuSectionProduct } from "./menu-section-product.entity";

type MenuProductRow = {
  section_id: string;
  product_id: string;
  position: number;
  featured: boolean;
  visible: boolean;
  name: string;
  description: string | null;
  estimated_price: string | null;
  media_type: string;
  media_files: string[] | string | null;
  status: string;
};

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuSection)
    private readonly sectionsRepo: Repository<MenuSection>,
    @InjectRepository(MenuSectionProduct)
    private readonly sectionProductsRepo: Repository<MenuSectionProduct>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>
  ) {}

  createSection(payload: {
    storeId: string;
    name: string;
    displayType: MenuDisplayType;
    configJson: Record<string, any> | null;
  }) {
    const section = this.sectionsRepo.create(payload);
    return this.sectionsRepo.save(section);
  }

  listSections(storeId: string) {
    return this.sectionsRepo.find({
      where: { storeId },
      order: { createdAt: "ASC" }
    });
  }

  findSectionByIdForStore(id: string, storeId: string) {
    return this.sectionsRepo.findOne({ where: { id, storeId } });
  }

  async updateSectionById(
    id: string,
    storeId: string,
    payload: Partial<{
      name: string;
      displayType: MenuDisplayType;
      configJson: Record<string, any> | null;
    }>
  ) {
    const existing = await this.findSectionByIdForStore(id, storeId);
    if (!existing) return null;
    Object.assign(existing, payload);
    return this.sectionsRepo.save(existing);
  }

  async deleteSectionById(id: string, storeId: string) {
    const existing = await this.findSectionByIdForStore(id, storeId);
    if (!existing) return false;
    await this.sectionProductsRepo.delete({ menuSectionId: id });
    await this.sectionsRepo.remove(existing);
    return true;
  }

  async upsertSectionProducts(
    sectionId: string,
    storeId: string,
    items: Array<{
      productId: string;
      position?: number;
      featured?: boolean;
      visible?: boolean;
    }>
  ) {
    if (items.length === 0) {
      return { saved: 0, ignored: 0 };
    }
    const ids = Array.from(new Set(items.map((item) => item.productId)));
    const products = await this.productsRepo.find({
      where: { id: In(ids), storeId }
    });
    const validIds = new Set(products.map((product) => product.id));
    const existing = await this.sectionProductsRepo.find({
      where: { menuSectionId: sectionId, productId: In(ids) }
    });
    const existingMap = new Map(
      existing.map((entry) => [entry.productId, entry])
    );

    const toSave = items
      .filter((item) => validIds.has(item.productId))
      .map((item) => {
        const current =
          existingMap.get(item.productId) ||
          this.sectionProductsRepo.create({
            menuSectionId: sectionId,
            productId: item.productId
          });
        if (typeof item.position === "number" && !Number.isNaN(item.position)) {
          current.position = item.position;
        }
        if (typeof item.featured === "boolean") {
          current.featured = item.featured;
        }
        if (typeof item.visible === "boolean") {
          current.visible = item.visible;
        }
        return current;
      });

    if (toSave.length > 0) {
      await this.sectionProductsRepo.save(toSave);
    }

    return {
      saved: toSave.length,
      ignored: items.length - toSave.length
    };
  }

  async listSectionsWithProducts(
    storeId: string,
    options?: { onlyVisible?: boolean }
  ) {
    const sections = await this.sectionsRepo.find({
      where: { storeId },
      order: { createdAt: "ASC" }
    });
    if (sections.length === 0) {
      return [];
    }

    const sectionIds = sections.map((section) => section.id);
    const qb = this.sectionProductsRepo
      .createQueryBuilder("msp")
      .innerJoin(Product, "p", "p.id = msp.product_id")
      .where("msp.menu_section_id IN (:...sectionIds)", { sectionIds })
      .andWhere("p.store_id = :storeId", { storeId });

    if (options?.onlyVisible) {
      qb.andWhere("msp.visible = true");
    }

    const rows = await qb
      .select([
        "msp.menu_section_id as section_id",
        "msp.product_id as product_id",
        "msp.position as position",
        "msp.featured as featured",
        "msp.visible as visible",
        "p.name as name",
        "p.description as description",
        "p.estimated_price as estimated_price",
        "p.media_type as media_type",
        "p.media_files as media_files",
        "p.status as status"
      ])
      .orderBy("msp.position", "ASC")
      .addOrderBy("msp.created_at", "ASC")
      .getRawMany<MenuProductRow>();

    const productsBySection = new Map<string, MenuProductRow[]>();
    rows.forEach((row) => {
      const current = productsBySection.get(row.section_id) || [];
      current.push(row);
      productsBySection.set(row.section_id, current);
    });

    return sections.map((section) => ({
      section,
      products: productsBySection.get(section.id) || []
    }));
  }

  parseMediaFiles(value: MenuProductRow["media_files"]) {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
