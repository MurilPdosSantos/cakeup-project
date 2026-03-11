export default function ChartCard({ title, subtitle, action, children }) {
  return (
    <div className="rounded-2xl border border-[#F48FB1] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#4A2C2A]">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-[#4A2C2A]/70">{subtitle}</p> : null}
        </div>
        {action ? <div className="text-xs text-[#4A2C2A]/70">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
