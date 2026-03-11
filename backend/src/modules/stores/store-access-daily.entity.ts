import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";

@Entity({ name: "store_access_daily" })
@Unique(["storeId", "day"])
export class StoreAccessDaily {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "store_id", type: "uuid" })
  storeId: string;

  @Column({ type: "date" })
  day: Date;

  @Column({ type: "int", default: 0 })
  count: number;

  @Column({ name: "new_count", type: "int", default: 0 })
  newCount: number;

  @Column({ name: "returning_count", type: "int", default: 0 })
  returningCount: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
