import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Plus } from "lucide-react";
import { api } from "../../lib/api";

interface SiteConfig {
  company_facebook?: string;
  company_instagram?: string;
  company_tiktok?: string;
  [key: string]: string | undefined;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 448 512"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
    </svg>
  );
}

type SocialKey = "company_facebook" | "company_instagram" | "company_tiktok";

const SOCIAL_ITEMS: {
  key: SocialKey;
  label: string;
  hoverClass: string;
  icon: (className: string) => ReactNode;
}[] = [
  {
    key: "company_tiktok",
    label: "TikTok",
    hoverClass: "hover:bg-[#010101]",
    icon: (cls) => <TikTokIcon className={cls} />,
  },
  {
    key: "company_facebook",
    label: "Facebook",
    hoverClass: "hover:bg-[#1877F2]",
    icon: (cls) => <Facebook className={cls} />,
  },
  {
    key: "company_instagram",
    label: "Instagram",
    hoverClass: "hover:bg-[#E4405F]",
    icon: (cls) => <Instagram className={cls} />,
  },
];

export function SocialFloat() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { data: config } = useQuery<SiteConfig>({
    queryKey: ["public-config"],
    queryFn: ({ signal }) => api.get("/config/public", false, signal),
    staleTime: 5 * 60 * 1000,
  });

  const supportsHover = useMemo(
    () =>
      typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches,
    []
  );

  const links = useMemo(() => {
    if (!config) return [];
    return SOCIAL_ITEMS.filter((item) => (config[item.key] ?? "").trim());
  }, [config]);

  const socials = config ?? ({} as SiteConfig);
  const hasLinks = SOCIAL_ITEMS.some((item) => (socials[item.key] ?? "").trim());
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!hasLinks) return null;

  return (
    <div
      ref={rootRef}
      className="fixed bottom-6 left-6 z-50"
      onMouseEnter={supportsHover ? () => setOpen(true) : undefined}
      onMouseLeave={supportsHover ? () => setOpen(false) : undefined}
    >
      {/* Panel de redes */}
      <div
        id="social-float-panel"
        className="absolute bottom-16 left-0 flex flex-col items-start gap-3"
      >
        {links.map((item, index) => {
          const href = socials[item.key]?.trim() ?? "";
          return (
            <a
              key={item.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className={`group flex items-center transition-all duration-300 ${
                open
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${index * 55}ms` : "0ms" }}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white text-netland-dark shadow-lift transition-colors duration-300 hover:text-white ${item.hoverClass}`}
              >
                {item.icon("h-5 w-5")}
              </span>

              <span className="pointer-events-none ml-3 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </span>
            </a>
          );
        })}
      </div>

      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Redes sociales de Netland"
        aria-expanded={open}
        aria-controls="social-float-panel"
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lift transition-transform duration-300 hover:scale-110"
        style={{ backgroundColor: "var(--netland-primary)" }}
      >
        <Plus
          className="h-7 w-7 transition-transform duration-300"
          style={{ transform: open ? "rotate(135deg)" : "rotate(0deg)" }}
        />
      </button>
    </div>
  );
}