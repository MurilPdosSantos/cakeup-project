export function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-[#F48FB1]/40 bg-white p-4 shadow-sm">
      <div className="h-3 w-24 animate-pulse rounded bg-[#F48FB1]/20" />
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-[#F48FB1]/20" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-[#F48FB1]/10" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-[#F48FB1]/40 bg-white p-6 shadow-sm">
      <div className="h-4 w-40 animate-pulse rounded bg-[#F48FB1]/20" />
      <div className="mt-5 h-32 w-full animate-pulse rounded bg-[#F48FB1]/10" />
    </div>
  );
}
