import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId: string;

  @Column({ length: 160 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "estimated_price", type: "numeric", nullable: true })
  estimatedPrice: string | null;

  @Column({ name: "media_count", type: "int", default: 0 })
  mediaCount: number;

  @Column({ name: "media_type", length: 20, default: "photo" })
  mediaType: string;

  @Column({ name: "media_files", type: "simple-json", nullable: true })
  mediaFiles: string[] | null;

  @Column({ length: 40, default: "Ativo" })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
