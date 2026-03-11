import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from "typeorm";

@Entity({ name: "store_access_hourly" })
@Unique(["storeId", "day", "hour"])
export class StoreAccessHourly {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "store_id", type: "uuid" })
  storeId: string;

  @Column({ type: "date" })
  day: Date;

  @Column({ type: "smallint" })
  hour: number;

  @Column({ type: "int", default: 0 })
  count: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
