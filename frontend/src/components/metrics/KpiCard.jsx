import { formatCompact, formatPercent } from "./formatters.js";

export default function KpiCard({ label, value, helper, delta, highlight }) {
  const deltaValue = typeof delta === "number" ? delta : null;
  const deltaColor =
    deltaValue === null ? "text-[#4A2C2A]/60" : deltaValue >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm",
        highlight ? "border-[#F48FB1]" : "border-[#F48FB1]/60"
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#4A2C2A]/60">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#4A2C2A]">{formatCompact(value)}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-[#4A2C2A]/60">{helper}</span>
        <span className={deltaColor}>{formatPercent(deltaValue)}</span>
      </div>
    </div>
  );
}
