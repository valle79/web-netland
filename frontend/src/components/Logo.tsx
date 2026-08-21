import logoNetland from "../images/logo-netland.png";

interface LogoProps {
  light?: boolean;
  size?: "sm" | "md";
}

export function Logo({ light = false, size = "md" }: LogoProps) {
  const iconSize = size === "md" ? 80 : 56;
  const textSize = size === "md" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-3">
      <img
        src={logoNetland}
        alt="Logo Netland"
        width={iconSize}
        height={iconSize}
        className="object-contain"
        style={{
          imageRendering: "auto",
        }}
      />

      <div className="leading-tight">
        <span
          className={`font-display font-semibold tracking-wider ${textSize} ${
            light ? "text-white" : "text-netland-dark"
          }`}
        >
          NETLAND
        </span>

        <span
          className={`block text-[10px] uppercase tracking-[0.25em] ${
            light ? "text-white/70" : "text-netland-muted"
          }`}
        >
          Corporación Inmobiliaria
        </span>
      </div>
    </div>
  );
}