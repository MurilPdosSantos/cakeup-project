const numberFormatter = new Intl.NumberFormat("pt-BR");
const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatCompact(value) {
  return compactFormatter.format(Number(value) || 0);
}

export function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2).replace(".", ",")}%`;
}

export function formatDateLabel(value) {
  return value || "";
}
