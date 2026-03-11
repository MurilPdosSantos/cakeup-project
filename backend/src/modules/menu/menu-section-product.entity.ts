import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from "typeorm";

@Entity({ name: "menu_section_products" })
export class MenuSectionProduct {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ name: "menu_section_id", type: "uuid" })
  menuSectionId: string;

  @Index()
  @Column({ name: "product_id", type: "uuid" })
  productId: string;

  @Column({ type: "int", default: 0 })
  position: number;

  @Column({ type: "boolean", default: false })
  featured: boolean;

  @Column({ type: "boolean", default: true })
  visible: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
