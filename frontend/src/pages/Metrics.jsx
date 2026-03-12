import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChartCard from "../components/metrics/ChartCard.jsx";
import DateRangeControls from "../components/metrics/DateRangeControls.jsx";
import KpiCard from "../components/metrics/KpiCard.jsx";
import { ChartSkeleton, KpiSkeleton } from "../components/metrics/Skeletons.jsx";
import {
  ComparisonAreaChart,
  HeatmapChart,
  SimpleBarChart,
  StackedBarChart,
  TimeSeriesChart
} from "../components/metrics/Charts.jsx";
import { formatNumber, formatPercent } from "../components/metrics/formatters.js";

const API_BASE = "/api";
const AUTH_KEY = "cakeup_auth";

function toDateInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function Metrics() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState("Carregando métricas...");
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("daily");
  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = addDays(end, -29);
    return { start: toDateInput(start), end: toDateInput(end) };
  });

  function handleUnauthorized() {
    localStorage.removeItem(AUTH_KEY);
    navigate("/login");
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        const url = new URL(`${API_BASE}/metrics`, window.location.origin);
        url.searchParams.set("start", range.start);
        url.searchParams.set("end", range.end);
        const dataRes = await fetch(url.toString(), { credentials: "include" });
        if (dataRes.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!dataRes.ok) {
          throw new Error("Falha ao carregar métricas");
        }
        const data = await dataRes.json();
        if (!isMounted) return;
        setMetrics(data || null);
        setStatus("");
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setMetrics(null);
        setStatus("Não há métricas para exibir no momento.");
        setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [range.end, range.start]);

  const presets = useMemo(() => {
    const today = new Date();
    return [
      { label: "7 dias", range: { start: toDateInput(addDays(today, -6)), end: toDateInput(today) } },
      { label: "30 dias", range: { start: toDateInput(addDays(today, -29)), end: toDateInput(today) } },
      { label: "90 dias", range: { start: toDateInput(addDays(today, -89)), end: toDateInput(today) } }
    ];
  }, []);

  const dailySeries = metrics?.series?.daily || [];
  const previousDaily = metrics?.series?.previousDaily || [];
  const weeklySeries = metrics?.series?.weekly || [];
  const monthlySeries = metrics?.series?.monthly || [];
  const cumulativeSeries = metrics?.series?.cumulative || [];
  const comparisonData = dailySeries.map((item, index) => ({
    label: item.label,
    current: item.value,
    previous: previousDaily[index]?.value || 0
  }));
  const peakDay = metrics?.topDays?.[0];
  const weekdayDistribution = metrics?.distributions?.weekday || [];
  const newReturningSeries = metrics?.distributions?.newReturning?.series || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangeControls start={range.start} end={range.end} onChange={setRange} presets={presets} />
        <div className="flex items-center gap-2">
          {["daily", "weekly", "monthly"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={[
                "rounded-full border px-4 py-1 text-xs uppercase tracking-wide",
                view === item
                  ? "border-[#F48FB1] bg-[#F48FB1]/20 text-[#4A2C2A]"
                  : "border-[#F48FB1]/50 text-[#4A2C2A]/70"
              ].join(" ")}
            >
              {item === "daily" ? "Diário" : item === "weekly" ? "Semanal" : "Mensal"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <KpiSkeleton key={index} />
          ))}
        </div>
      ) : metrics?.kpis ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total de acessos"
            value={metrics.kpis.total}
            helper={`Período ${metrics.comparison?.current?.start || ""}`}
            delta={metrics.kpis.growthPct}
            highlight
          />
          <KpiCard label="Acessos hoje" value={metrics.kpis.today} helper="Último dia" />
          <KpiCard label="Acessos 7 dias" value={metrics.kpis.week} helper="Últimos 7 dias" />
          <KpiCard label="Acessos 30 dias" value={metrics.kpis.month} helper="Últimos 30 dias" />
          <KpiCard
            label="Média diária"
            value={metrics.kpis.avgDaily}
            helper="Por dia"
          />
          <KpiCard
            label="Crescimento"
            value={metrics.kpis.total}
            helper="Vs período anterior"
            delta={metrics.kpis.growthPct}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#F48FB1] bg-white p-6 text-sm text-[#4A2C2A]">
          {status || "Não há métricas para exibir no momento."}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard
              title="Tendência de acessos"
              subtitle="Linha principal e média móvel de 7 dias"
              action={peakDay ? `Pico: ${peakDay.label} (${formatNumber(peakDay.value)})` : ""}
            >
              <TimeSeriesChart
                data={
                  view === "daily"
                    ? dailySeries
                    : view === "weekly"
                    ? weeklySeries
                    : monthlySeries
                }
                lines={[
                  { dataKey: "value", name: "Acessos", color: "#F48FB1" },
                  view === "daily"
                    ? { dataKey: "ma7", name: "Média 7 dias", color: "#F59E0B" }
                    : null
                ].filter(Boolean)}
              />
            </ChartCard>
            <ChartCard
              title="Comparativo período atual x anterior"
              subtitle={`Crescimento: ${formatPercent(metrics?.comparison?.growthPct)}`}
            >
              <ComparisonAreaChart data={comparisonData} />
            </ChartCard>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Novos vs recorrentes" subtitle="Distribuição diária">
              <StackedBarChart data={newReturningSeries} />
            </ChartCard>
            <ChartCard title="Top dias" subtitle="Maiores picos no período">
              <SimpleBarChart data={metrics?.topDays || []} />
            </ChartCard>
            <ChartCard title="Distribuição por dia da semana" subtitle="Onde o tráfego se concentra">
              <SimpleBarChart data={weekdayDistribution} color="#FB7185" />
            </ChartCard>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <ChartCard title="Crescimento acumulado" subtitle="Soma progressiva de acessos">
              <TimeSeriesChart
                data={cumulativeSeries}
                lines={[{ dataKey: "value", name: "Acumulado", color: "#F48FB1" }]}
              />
            </ChartCard>
            <ChartCard title="Heatmap por hora" subtitle="Últimos 7 dias">
              <HeatmapChart
                days={metrics?.heatmap?.days || []}
                hours={metrics?.heatmap?.hours || []}
                values={metrics?.heatmap?.values || []}
              />
            </ChartCard>
          </>
        )}
      </div>
    </div>
  );
}
