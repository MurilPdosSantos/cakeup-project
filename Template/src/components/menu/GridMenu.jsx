import MenuItemCard from "./MenuItemCard.jsx";

function clampColumns(value, fallback) {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) return fallback;
  return Math.min(Math.max(Math.round(numeric), 1), 6);
}

export default function GridMenu({ products, config }) {
  const columnsDesktop = clampColumns(config.columns_desktop, 3);
  const columnsMobile = clampColumns(config.columns_mobile, 1);

  return (
    <div
      className="grid gap-6 [grid-template-columns:repeat(var(--columns-mobile),minmax(0,1fr))] md:[grid-template-columns:repeat(var(--columns-desktop),minmax(0,1fr))]"
      style={{
        "--columns-mobile": columnsMobile,
        "--columns-desktop": columnsDesktop
      }}
    >
      {products.map((product) => (
        <MenuItemCard key={product.id} product={product} config={config} />
      ))}
    </div>
  );
}
