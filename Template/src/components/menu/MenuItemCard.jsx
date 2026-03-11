import { useMemo } from "react";

function formatPrice(value) {
  if (!value) return "";
  const numeric = Number(String(value).replace(",", "."));
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numeric);
}

export default function MenuItemCard({
  product,
  config,
  layout = "vertical",
  className = "",
  imageClassName = ""
}) {
  const mediaUrl = useMemo(() => {
    const list = Array.isArray(product.mediaUrls) ? product.mediaUrls : [];
    return list.find(Boolean) || "";
  }, [product.mediaUrls]);

  const showImage = Boolean(config.show_image) && Boolean(mediaUrl);
  const showDescription = Boolean(config.show_description) && product.description;
  const showPrice = Boolean(config.show_price) && product.estimatedPrice;
  const showButton = Boolean(config.show_button);
  const buttonText = config.button_text || "Pedir agora";

  const containerClass =
    layout === "horizontal"
      ? `flex gap-4 ${className}`
      : `flex flex-col gap-4 ${className}`;

  const mediaClass =
    layout === "horizontal"
      ? `h-24 w-24 flex-none rounded-2xl object-cover ${imageClassName}`
      : `h-44 w-full rounded-2xl object-cover ${imageClassName}`;

  return (
    <div className={`rounded-3xl border border-white/10 bg-white/5 p-5 ${containerClass}`}>
      {showImage && product.mediaType === "video" ? (
        <video
          src={mediaUrl}
          className={mediaClass}
          muted
          playsInline
          preload="metadata"
        />
      ) : showImage ? (
        <img
          src={mediaUrl}
          alt={product.name}
          className={mediaClass}
          loading="lazy"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-2">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          {showDescription && (
            <p className="mt-2 text-sm text-rose-800">{product.description}</p>
          )}
        </div>
        {showPrice && (
          <p className="text-sm font-semibold text-rose-800">
            {formatPrice(product.estimatedPrice)}
          </p>
        )}
        {showButton && (
          <div className="mt-auto">
            <a
              href="/#pedido"
              className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
            >
              {buttonText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
