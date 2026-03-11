import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";

export type MenuDisplayType = "grid" | "list" | "carousel" | "featured" | "tabs";

@Entity({ name: "menu_sections" })
export class MenuSection {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "store_id", type: "uuid" })
  storeId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: "display_type", length: 20 })
  displayType: MenuDisplayType;

  @Column({ name: "config_json", type: "simple-json", nullable: true })
  configJson: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
