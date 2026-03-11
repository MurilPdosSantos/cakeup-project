import MenuItemCard from "./MenuItemCard.jsx";

export default function ListMenu({ products, config }) {
  return (
    <div className="flex flex-col gap-4">
      {products.map((product) => (
        <MenuItemCard
          key={product.id}
          product={product}
          config={config}
          layout="horizontal"
          className="items-start"
          imageClassName="h-24 w-28"
        />
      ))}
    </div>
  );
}
