import MenuItemCard from "./MenuItemCard.jsx";

export default function FeaturedMenu({ products, config }) {
  if (!products.length) {
    return null;
  }

  const highlighted =
    products.find((product) => product.featured) || products[0];
  const others = products.filter((product) => product.id !== highlighted.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <MenuItemCard product={highlighted} config={config} />
      <div className="flex flex-col gap-4">
        {others.slice(0, 3).map((product) => (
          <MenuItemCard
            key={product.id}
            product={product}
            config={config}
            layout="horizontal"
            className="items-start"
            imageClassName="h-24 w-24"
          />
        ))}
      </div>
    </div>
  );
}
