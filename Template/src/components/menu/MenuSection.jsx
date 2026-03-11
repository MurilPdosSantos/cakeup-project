import CarouselMenu from "./CarouselMenu.jsx";
import FeaturedMenu from "./FeaturedMenu.jsx";
import GridMenu from "./GridMenu.jsx";
import ListMenu from "./ListMenu.jsx";

const DEFAULT_CONFIG = {
  columns_desktop: 3,
  columns_mobile: 1,
  show_price: true,
  show_description: true,
  show_image: true,
  show_button: true,
  button_text: "Pedir agora"
};

function normalizeConfig(config) {
  const incoming = config && typeof config === "object" ? config : {};
  return {
    ...DEFAULT_CONFIG,
    ...incoming
  };
}

function resolveLayout(displayType) {
  switch (displayType) {
    case "list":
      return ListMenu;
    case "carousel":
      return CarouselMenu;
    case "featured":
      return FeaturedMenu;
    case "grid":
    default:
      return GridMenu;
  }
}

export default function MenuSection({ section }) {
  const products = Array.isArray(section.products) ? section.products : [];
  const displayType = section.displayType || section.display_type || "grid";
  const Layout = resolveLayout(displayType);
  const config = normalizeConfig(section.config);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-rose-700">
          Cardápio
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{section.name}</h3>
      </div>
      <Layout products={products} config={config} />
    </div>
  );
}
