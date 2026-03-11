import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Product } from "./product.entity";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>
  ) {}

  findByStore(storeId: string) {
    return this.repo.find({
      where: { storeId },
      order: { createdAt: "DESC" }
    });
  }

  create(payload: {
    storeId: string;
    name: string;
    description: string | null;
    estimatedPrice: string | null;
    mediaCount: number;
    mediaType: string;
    mediaFiles: string[] | null;
  }) {
    const product = this.repo.create(payload);
    return this.repo.save(product);
  }

  findByIdForStore(id: string, storeId: string) {
    return this.repo.findOne({ where: { id, storeId } });
  }

  async updateById(
    id: string,
    storeId: string,
    payload: Partial<{
      name: string;
      description: string | null;
      estimatedPrice: string | null;
      mediaCount: number;
      mediaType: string;
      mediaFiles: string[] | null;
      status: string;
    }>
  ) {
    const existing = await this.findByIdForStore(id, storeId);
    if (!existing) return null;
    Object.assign(existing, payload);
    return this.repo.save(existing);
  }

  async deleteById(id: string, storeId: string) {
    const existing = await this.findByIdForStore(id, storeId);
    if (!existing) return false;
    await this.repo.remove(existing);
    return true;
  }
}
