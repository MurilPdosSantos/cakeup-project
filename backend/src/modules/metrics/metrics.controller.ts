import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StoresService } from "../stores/stores.service";

type AuthedRequest = { user?: { storeId: string } };

type DailyPoint = {
  label: string;
  value: number;
  date: string;
  newCount: number;
  returningCount: number;
  ma7?: number;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function getUtcDay(date: Date | string = new Date()) {
  const resolved = toDate(date);
  return new Date(
    Date.UTC(resolved.getUTCFullYear(), resolved.getUTCMonth(), resolved.getUTCDate())
  );
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcWeek(date: Date) {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  return addUtcDays(date, -diff);
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value?: string) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function diffDays(startDay: Date, endDay: Date) {
  const ms = endDay.getTime() - startDay.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function clampRange(startDay: Date, endDay: Date) {
  if (startDay <= endDay) return { startDay, endDay };
  return { startDay: endDay, endDay: startDay };
}

function buildDailySeries(
  rows: Array<{ day: Date | string; count: number }>,
  startDay: Date,
  days: number
) {
  const map = new Map(rows.map((row) => [toKey(getUtcDay(row.day)), row.count]));
  return Array.from({ length: days }, (_, index) => {
    const day = addUtcDays(startDay, index);
    return { label: formatDayLabel(day), value: map.get(toKey(day)) ?? 0 };
  });
}

function withMovingAverage<T extends { value: number }>(series: T[], window = 7): Array<T & { ma7: number }> {
  const values = series.map((item) => Number(item.value) || 0);
  return series.map((item, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = values.slice(start, index + 1);
    const avg = slice.reduce((sum, value) => sum + value, 0) / slice.length;
    return { ...item, ma7: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0 };
  });
}

function buildBucketSeries(
  rows: Array<{ bucket: Date; count: string | number }>,
  startBucket: Date,
  buckets: number,
  stepDays: number,
  formatLabel: (date: Date) => string
) {
  const map = new Map(
    rows.map((row) => [toKey(getUtcDay(new Date(row.bucket))), Number(row.count) || 0])
  );
  return Array.from({ length: buckets }, (_, index) => {
    const bucket = addUtcDays(startBucket, index * stepDays);
    return { label: formatLabel(bucket), value: map.get(toKey(bucket)) ?? 0 };
  });
}

function addUtcMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function buildMonthlySeries(
  rows: Array<{ bucket: Date; count: string | number }>,
  startMonth: Date,
  months: number
) {
  const map = new Map(
    rows.map((row) => {
      const bucket = new Date(row.bucket);
      const normalized = new Date(Date.UTC(bucket.getUTCFullYear(), bucket.getUTCMonth(), 1));
      return [toKey(normalized), Number(row.count) || 0];
    })
  );
  return Array.from({ length: months }, (_, index) => {
    const month = addUtcMonths(startMonth, index);
    return { label: formatMonthLabel(month), value: map.get(toKey(month)) ?? 0 };
  });
}

@Controller("metrics")
export class MetricsController {
  constructor(private readonly storesService: StoresService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMetrics(
    @Req() req: AuthedRequest,
    @Query("start") start?: string,
    @Query("end") end?: string
  ) {
    const storeId = req.user?.storeId;
    if (!storeId) {
      return {
        kpis: {},
        series: {},
        distributions: {},
        heatmap: {},
        topDays: [],
        comparison: {}
      };
    }

    const store = await this.storesService.findById(storeId);
    if (!store) {
      return {
        kpis: {},
        series: {},
        distributions: {},
        heatmap: {},
        topDays: [],
        comparison: {}
      };
    }

    const today = getUtcDay();
    const parsedStart = parseDateParam(start);
    const parsedEnd = parseDateParam(end);
    const defaultEnd = parsedEnd ?? today;
    const defaultStart = parsedStart ?? addUtcDays(defaultEnd, -29);
    const { startDay, endDay } = clampRange(defaultStart, defaultEnd);
    const rangeDays = diffDays(startDay, endDay) + 1;

    const previousStart = addUtcDays(startDay, -rangeDays);
    const previousEnd = addUtcDays(startDay, -1);

    const [dailyRows, previousRows] = await Promise.all([
      this.storesService.getDailyAccessRange(storeId, startDay, endDay),
      this.storesService.getDailyAccessRange(storeId, previousStart, previousEnd)
    ]);

    const dailyMeta = new Map(
      dailyRows.map((row) => [
        toKey(getUtcDay(row.day)),
        { newCount: row.newCount ?? 0, returningCount: row.returningCount ?? 0 }
      ])
    );
    const dailySeriesRaw: DailyPoint[] = buildDailySeries(dailyRows, startDay, rangeDays).map(
      (item, index) => {
        const dateKey = toKey(addUtcDays(startDay, index));
        const meta = dailyMeta.get(dateKey) || { newCount: 0, returningCount: 0 };
        return {
          ...item,
          date: dateKey,
          newCount: meta.newCount,
          returningCount: meta.returningCount
        };
      }
    );
    const dailySeries = withMovingAverage(dailySeriesRaw, 7);
    const previousDailySeries = buildDailySeries(previousRows, previousStart, rangeDays);
    const cumulativeSeries = dailySeries.reduce((acc, item) => {
      const lastValue = acc.length ? acc[acc.length - 1].value : 0;
      acc.push({ label: item.label, value: lastValue + Number(item.value || 0) });
      return acc;
    }, [] as Array<{ label: string; value: number }>);

    const total = dailySeries.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const prevTotal = previousRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const growthPct =
      prevTotal > 0 ? Number((((total - prevTotal) / prevTotal) * 100).toFixed(2)) : null;

    const todayValue = dailySeries[dailySeries.length - 1]?.value ?? 0;
    const weekStart = addUtcDays(endDay, -6);
    const weekRows = await this.storesService.getDailyAccessRange(storeId, weekStart, endDay);
    const weekTotal = weekRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const monthStart = addUtcDays(endDay, -29);
    const monthRows = await this.storesService.getDailyAccessRange(storeId, monthStart, endDay);
    const monthTotal = monthRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const avgDaily = rangeDays > 0 ? Number((total / rangeDays).toFixed(2)) : 0;

    const topDays = [...dailySeries]
      .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
      .slice(0, 5);

    const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const weekdayMap = new Map<number, number>();
    dailySeries.forEach((item) => {
      const day = new Date(item.date).getUTCDay();
      weekdayMap.set(day, (weekdayMap.get(day) || 0) + Number(item.value || 0));
    });
    const weekdayDistribution = Array.from({ length: 7 }, (_, index) => ({
      label: weekdayLabels[index],
      value: weekdayMap.get(index) || 0
    }));

    const heatmapStart = addUtcDays(endDay, -6);
    const hourlyRows = await this.storesService.getHourlyAccessRange(
      storeId,
      heatmapStart,
      endDay
    );
    const heatmapDays = Array.from({ length: 7 }, (_, index) =>
      toKey(addUtcDays(heatmapStart, index))
    );
    const heatmapValues = hourlyRows.map((row) => ({
      day: toKey(getUtcDay(row.day)),
      hour: Number(row.hour),
      value: Number(row.count) || 0
    }));

    const weeklyRows = await this.storesService.getWeeklyAccessTotals(
      storeId,
      startOfUtcWeek(addUtcDays(endDay, -35))
    );
    const monthlyRows = await this.storesService.getMonthlyAccessTotals(
      storeId,
      new Date(Date.UTC(endDay.getUTCFullYear(), endDay.getUTCMonth() - 5, 1))
    );

    return {
      kpis: {
        total,
        today: todayValue,
        week: weekTotal,
        month: monthTotal,
        avgDaily,
        growthPct
      },
      series: {
        daily: dailySeries,
        previousDaily: previousDailySeries,
        weekly: buildBucketSeries(
          weeklyRows,
          startOfUtcWeek(addUtcDays(endDay, -35)),
          6,
          7,
          formatDayLabel
        ),
        monthly: buildMonthlySeries(
          monthlyRows,
          new Date(Date.UTC(endDay.getUTCFullYear(), endDay.getUTCMonth() - 5, 1)),
          6
        ),
        cumulative: cumulativeSeries
      },
      comparison: {
        current: { start: toKey(startDay), end: toKey(endDay), total },
        previous: { start: toKey(previousStart), end: toKey(previousEnd), total: prevTotal },
        growthPct
      },
      distributions: {
        weekday: weekdayDistribution,
        newReturning: {
          totals: {
            new: dailySeries.reduce((sum, item) => sum + Number(item.newCount || 0), 0),
            returning: dailySeries.reduce((sum, item) => sum + Number(item.returningCount || 0), 0)
          },
          series: dailySeries.map((item) => ({
            label: item.label,
            newCount: item.newCount || 0,
            returningCount: item.returningCount || 0
          }))
        }
      },
      heatmap: {
        days: heatmapDays,
        hours: Array.from({ length: 24 }, (_, index) => index),
        values: heatmapValues
      },
      topDays
    };
  }
}
