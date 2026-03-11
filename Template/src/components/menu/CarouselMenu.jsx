import MenuItemCard from "./MenuItemCard.jsx";

export default function CarouselMenu({ products, config }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-3 pr-1">
      {products.map((product) => (
        <div key={product.id} className="min-w-[240px] max-w-[260px] flex-1">
          <MenuItemCard product={product} config={config} />
        </div>
      ))}
    </div>
  );
}
