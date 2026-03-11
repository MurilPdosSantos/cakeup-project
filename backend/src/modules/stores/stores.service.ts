import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Store } from "./store.entity";
import { StoreAccessDaily } from "./store-access-daily.entity";
import { StoreAccessHourly } from "./store-access-hourly.entity";

function getUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getUtcHour(date = new Date()) {
  return date.getUTCHours();
}

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private readonly storesRepo: Repository<Store>,
    @InjectRepository(StoreAccessDaily)
    private readonly accessDailyRepo: Repository<StoreAccessDaily>,
    @InjectRepository(StoreAccessHourly)
    private readonly accessHourlyRepo: Repository<StoreAccessHourly>
  ) {}

  findById(id: string) {
    return this.storesRepo.findOne({ where: { id } });
  }

  findByName(name: string) {
    return this.storesRepo.findOne({ where: { name } });
  }

  findByDomain(domain: string) {
    return this.storesRepo.findOne({ where: { domain } });
  }

  findAll() {
    return this.storesRepo.find();
  }

  async incrementPageViews(
    storeId: string,
    options: { isReturning?: boolean; now?: Date } = {}
  ) {
    const now = options.now ?? new Date();
    const isReturning = Boolean(options.isReturning);
    await this.storesRepo.increment({ id: storeId }, "pageViews", 1);
    const day = getUtcDay(now);
    const hour = getUtcHour(now);
    const newCount = isReturning ? 0 : 1;
    const returningCount = isReturning ? 1 : 0;
    await this.accessDailyRepo
      .createQueryBuilder()
      .insert()
      .values({ storeId, day, count: 1, newCount, returningCount })
      .onConflict(
        `("store_id","day") DO UPDATE SET ` +
          `"count" = "StoreAccessDaily"."count" + EXCLUDED."count", ` +
          `"new_count" = "StoreAccessDaily"."new_count" + EXCLUDED."new_count", ` +
          `"returning_count" = "StoreAccessDaily"."returning_count" + EXCLUDED."returning_count"`
      )
      .execute();
    await this.accessHourlyRepo
      .createQueryBuilder()
      .insert()
      .values({ storeId, day, hour, count: 1 })
      .onConflict(
        `("store_id","day","hour") DO UPDATE SET "count" = "StoreAccessHourly"."count" + 1`
      )
      .execute();
  }

  async getDailyAccessRange(storeId: string, startDay: Date, endDay: Date) {
    return this.accessDailyRepo.find({
      where: { storeId, day: Between(startDay, endDay) },
      order: { day: "ASC" }
    });
  }

  async getWeeklyAccessTotals(storeId: string, startDay: Date) {
    return this.accessDailyRepo
      .createQueryBuilder("access")
      .select(`date_trunc('week', access.day)`, "bucket")
      .addSelect("SUM(access.count)", "count")
      .where("access.store_id = :storeId", { storeId })
      .andWhere("access.day >= :startDay", { startDay })
      .groupBy("bucket")
      .orderBy("bucket", "ASC")
      .getRawMany();
  }

  async getMonthlyAccessTotals(storeId: string, startMonth: Date) {
    return this.accessDailyRepo
      .createQueryBuilder("access")
      .select(`date_trunc('month', access.day)`, "bucket")
      .addSelect("SUM(access.count)", "count")
      .where("access.store_id = :storeId", { storeId })
      .andWhere("access.day >= :startMonth", { startMonth })
      .groupBy("bucket")
      .orderBy("bucket", "ASC")
      .getRawMany();
  }

  async getHourlyAccessRange(storeId: string, startDay: Date, endDay: Date) {
    return this.accessHourlyRepo
      .createQueryBuilder("access")
      .select("access.day", "day")
      .addSelect("access.hour", "hour")
      .addSelect("SUM(access.count)", "count")
      .where("access.store_id = :storeId", { storeId })
      .andWhere("access.day BETWEEN :startDay AND :endDay", { startDay, endDay })
      .groupBy("access.day")
      .addGroupBy("access.hour")
      .orderBy("access.day", "ASC")
      .addOrderBy("access.hour", "ASC")
      .getRawMany();
  }

  async create(name: string, domain: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const store = this.storesRepo.create({ name, domain, passwordHash });
    return this.storesRepo.save(store);
  }
}
