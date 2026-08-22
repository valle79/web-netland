import { Link } from "react-router-dom";
import { Facebook, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "../Logo";
import { whatsappLink } from "../../lib/constants";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#2a2520] via-[#3d3630] to-[#2a2520] text-white">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-5">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      {/* Formas decorativas */}
      <div className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-[#f5a623]/10 blur-3xl" />
      <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-netland-primary/10 blur-3xl" />

      <div className="container-netland relative z-10 grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-slate-200">
            El lugar donde mereces vivir. Proyectos inmobiliarios en Cañete con
            respaldo, confianza y oportunidades de crecimiento.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#f5a623]">
            Enlaces
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-200">
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/">
                Inicio
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/proyectos">
                Proyectos
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/asesores">
                Asesores
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/nosotros">
                Nosotros
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/contacto">
                Contacto
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#f5a623]">
            Legal
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-200">
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/contacto">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-[#f5a623]" to="/contacto">
                Términos y condiciones
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#f5a623]">
            Contacto
          </h4>
          <ul className="space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-3 transition-colors hover:text-[#f5a623]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <MessageCircle className="h-4 w-4 text-green-400" />
              </div>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#f5a623]"
              >
                985 928 062
              </a>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5a623]/10">
                <Phone className="h-4 w-4 text-[#f5a623]" />
              </div>
              <span>985 928 062</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-netland-primary/10">
                <MapPin className="h-4 w-4 text-netland-primary" />
              </div>
              <span>Cañete, Lima, Perú</span>
            </li>
          </ul>
          <div className="mt-5 flex gap-3">
            <a 
              href="#" 
              aria-label="Facebook" 
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50 transition-all hover:bg-[#f5a623] hover:scale-110"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              aria-label="Instagram" 
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50 transition-all hover:bg-[#f5a623] hover:scale-110"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-[#4a4035]">
        <div className="container-netland flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-300 sm:flex-row">
          <span>© {new Date().getFullYear()} NETLAND CORPORACIÓN INMOBILIARIA. Todos los derechos reservados.</span>
          <span className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-[#f5a623]" />
            Cañete, Perú
          </span>
        </div>
      </div>
    </footer>
  );
}
