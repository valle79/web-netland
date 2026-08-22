import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "../Logo";
import { whatsappLink } from "../../lib/constants";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/proyectos", label: "Proyectos" },
  { to: "/asesores", label: "Asesores" },
  { to: "/nosotros", label: "Nosotros" },
  { to: "/contacto", label: "Contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const isDark = scrolled || location.pathname !== "/";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isDark
          ? "bg-white/95 shadow-soft backdrop-blur"
          : "bg-transparent"
      }`}
    >
      <div className="container-netland flex h-20 items-center justify-between">
        <Link to="/" aria-label="Netland - Inicio">
          <Logo light={!isDark} />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium uppercase tracking-wider transition-colors ${
                  isDark ? "text-netland-text" : "text-white"
                } ${
                  isActive
                    ? "text-netland-accent"
                    : "hover:text-netland-accent"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent !px-5 !py-2.5"
          >
            <Phone className="h-4 w-4" />
            Hablar con un asesor
          </a>
        </nav>

        <button
          className={`md:hidden ${isDark ? "text-netland-dark" : "text-white"}`}
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-netland-light bg-white px-5 py-6 md:hidden">
          <nav className="flex flex-col gap-5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-base font-medium uppercase tracking-wider ${
                    isActive ? "text-netland-accent" : "text-netland-text"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-2"
            >
              Hablar con un asesor
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}