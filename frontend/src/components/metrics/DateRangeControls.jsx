export default function DateRangeControls({
  start,
  end,
  onChange,
  presets = []
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-[#2E2E2C]">
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase text-[#2E2E2C]/60">Início</label>
        <input
          type="date"
          value={start}
          onChange={(event) => onChange({ start: event.target.value, end })}
          className="rounded-md border border-[#1A6F4A]/60 px-3 py-1 text-xs"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase text-[#2E2E2C]/60">Fim</label>
        <input
          type="date"
          value={end}
          onChange={(event) => onChange({ start, end: event.target.value })}
          className="rounded-md border border-[#1A6F4A]/60 px-3 py-1 text-xs"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.range)}
            className="rounded-full border border-[#1A6F4A]/60 px-3 py-1 text-xs text-[#2E2E2C] hover:border-[#1A6F4A]"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
