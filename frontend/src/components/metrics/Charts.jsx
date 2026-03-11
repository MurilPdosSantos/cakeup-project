import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatNumber } from "./formatters.js";

function DefaultTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-[#F48FB1]/40 bg-white px-3 py-2 text-xs text-[#4A2C2A] shadow">
      <p className="font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1">
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function TimeSeriesChart({ data, lines }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F48FB1" opacity={0.2} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend verticalAlign="top" height={24} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonAreaChart({ data }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="currentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F48FB1" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#F48FB1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F48FB1" opacity={0.2} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend verticalAlign="top" height={24} />
          <Area
            type="monotone"
            dataKey="previous"
            name="Período anterior"
            stroke="#9CA3AF"
            fill="#E5E7EB"
            fillOpacity={0.3}
            isAnimationActive
          />
          <Area
            type="monotone"
            dataKey="current"
            name="Período atual"
            stroke="#F48FB1"
            fill="url(#currentFill)"
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({ data, dataKey = "value", color = "#F48FB1" }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F48FB1" opacity={0.2} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
          <Tooltip content={<DefaultTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StackedBarChart({ data }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F48FB1" opacity={0.2} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={formatNumber} />
          <Tooltip content={<DefaultTooltip />} />
          <Legend verticalAlign="top" height={24} />
          <Bar dataKey="newCount" name="Novos" stackId="a" fill="#FBCFE8" />
          <Bar dataKey="returningCount" name="Recorrentes" stackId="a" fill="#F48FB1" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeatmapChart({ days, hours, values }) {
  const valueMap = new Map(values.map((item) => [`${item.day}-${item.hour}`, item.value]));
  const maxValue = values.reduce((max, item) => Math.max(max, item.value || 0), 0);
  return (
    <div className="overflow-x-auto">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${hours.length + 1}, minmax(24px, 1fr))` }}>
        <div />
        {hours.map((hour) => (
          <div key={hour} className="text-[10px] text-[#4A2C2A]/60">
            {hour}
          </div>
        ))}
        {days.map((day) => (
          <div key={day} className="contents">
            <div className="text-[10px] text-[#4A2C2A]/60">{day.slice(5)}</div>
            {hours.map((hour) => {
              const value = valueMap.get(`${day}-${hour}`) || 0;
              const opacity = maxValue ? Math.max(0.15, value / maxValue) : 0.1;
              return (
                <div
                  key={`${day}-${hour}`}
                  title={`${day} ${hour}h: ${formatNumber(value)}`}
                  className="h-6 rounded-sm"
                  style={{ backgroundColor: `rgba(244, 143, 177, ${opacity})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
