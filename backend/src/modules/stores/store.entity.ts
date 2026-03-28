import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { GLOBAL_MODULES, StoreModule } from "./store-module.enum";

@Entity({ name: "stores" })
export class Store {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 120 })
  name: string;

  @Column({ unique: true, length: 255 })
  domain: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column({ name: "page_views", type: "int", default: 0 })
  pageViews: number;

  @Column({
    name: "top_product_name",
    type: "varchar",
    length: 255,
    nullable: true
  })
  topProductName: string | null;

  @Column({ name: "top_product_quantity", type: "int", default: 0 })
  topProductQuantity: number;

  @Column({
    name: "modules",
    type: "simple-array",
    nullable: true,
    default: GLOBAL_MODULES.join(",")
  })
  modules: StoreModule[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ default: true })
  active: boolean;
}
