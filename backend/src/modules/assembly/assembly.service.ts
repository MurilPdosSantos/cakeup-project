import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AssemblyItem } from "./assembly-item.entity";

@Injectable()
export class AssemblyService {
  constructor(
    @InjectRepository(AssemblyItem)
    private readonly repo: Repository<AssemblyItem>
  ) {}

  async listByStore(storeId: string) {
    const items = await this.repo.find({
      where: { storeId },
      order: { createdAt: "DESC" }
    });
    return {
      massas: items.filter((item) => item.type === "MASSA"),
      recheios: items.filter((item) => item.type === "RECHEIO"),
      doces: items.filter((item) => item.type === "DOCE")
    };
  }

  create(payload: {
    storeId: string;
    name: string;
    type: "MASSA" | "RECHEIO" | "DOCE";
    pricePerKg: string | null;
  }) {
    const item = this.repo.create(payload);
    return this.repo.save(item);
  }

  findByIdForStore(id: string, storeId: string) {
    return this.repo.findOne({ where: { id, storeId } });
  }

  async updateById(
    id: string,
    storeId: string,
    payload: Partial<{
      name: string;
      pricePerKg: string | null;
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
