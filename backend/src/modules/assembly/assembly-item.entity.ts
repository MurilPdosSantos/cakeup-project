import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export type AssemblyType = "MASSA" | "RECHEIO" | "DOCE";

@Entity({ name: "assembly_items" })
export class AssemblyItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId: string;

  @Column({ length: 140 })
  name: string;

  @Column({ type: "varchar", length: 20 })
  type: AssemblyType;

  @Column({ name: "price_per_kg", type: "numeric", nullable: true })
  pricePerKg: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
