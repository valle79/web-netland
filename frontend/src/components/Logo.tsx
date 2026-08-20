interface LogoProps {
  light?: boolean;
  size?: "sm" | "md";
}

export function Logo({ light = false, size = "md" }: LogoProps) {
  const textSize = size === "md" ? "text-xl" : "text-lg";
  return (
    <div className="flex items-center gap-3">
      <svg
        width={size === "md" ? 44 : 36}
        height={size === "md" ? 44 : 36}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <rect width="48" height="48" rx="4" fill={light ? "#ffffff" : "#14532d"} />
        <path
          d="M24 8 L40 38 H8 Z"
          fill={light ? "#14532d" : "#ffffff"}
          opacity="0.9"
        />
        <path
          d="M24 18 L31 34 H17 Z"
          fill="#b9924e"
        />
      </svg>
      <div className="leading-tight">
        <span
          className={`font-display font-semibold tracking-wider ${
            textSize
          } ${light ? "text-white" : "text-netland-dark"}`}
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