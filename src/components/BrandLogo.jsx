const ICON_SRC = "/assets/iconoGreenHouse.jpg";

/**
 * Logo GreenHouse (invernadero + IA).
 * @param {object} props
 * @param {"sm" | "md" | "lg"} [props.size]
 * @param {boolean} [props.showText]
 * @param {string} [props.subtitle]
 */
export default function BrandLogo({ size = "md", showText = true, subtitle }) {
  const box =
    size === "sm" ? "h-9 w-9" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const img =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/20`}
      >
        <img
          src={ICON_SRC}
          alt=""
          className={`${img} rounded-lg object-cover`}
          width={48}
          height={48}
        />
      </span>
      {showText ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">GreenHouse</p>
          {subtitle ? (
            <p className="truncate text-xs text-farm-green-light/80">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { ICON_SRC };
