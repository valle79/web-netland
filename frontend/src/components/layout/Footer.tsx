import { Link } from "react-router-dom";
import { Facebook, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "../Logo";
import { whatsappLink } from "../../lib/constants";

export function Footer() {
  return (
    <footer className="bg-netland-dark text-white">
      <div className="container-netland grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo light />
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            El lugar donde mereces vivir. Proyectos inmobiliarios en Cañete con
            respaldo, confianza y oportunidades de crecimiento.
          </p>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-netland-accent">
            Enlaces
          </h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li><Link className="hover:text-netland-accent" to="/">Inicio</Link></li>
            <li><Link className="hover:text-netland-accent" to="/nosotros">Nosotros</Link></li>
            <li><Link className="hover:text-netland-accent" to="/proyectos">Proyectos</Link></li>
            <li><Link className="hover:text-netland-accent" to="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-netland-accent">
            Legal
          </h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li><Link className="hover:text-netland-accent" to="/contacto">Política de privacidad</Link></li>
            <li><Link className="hover:text-netland-accent" to="/contacto">Términos y condiciones</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-netland-accent">
            Contacto
          </h4>
          <ul className="space-y-4 text-sm text-white/70">
            <li className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-netland-accent" />
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-netland-accent"
              >
                985 928 062
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-netland-accent" />
              <span>985 928 062</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-netland-accent" />
              <span>Cañete, Lima, Perú</span>
            </li>
          </ul>
          <div className="mt-6 flex gap-4">
            <a href="#" aria-label="Facebook" className="text-white/60 hover:text-netland-accent">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Instagram" className="text-white/60 hover:text-netland-accent">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-netland flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/50 sm:flex-row">
          <span>© {new Date().getFullYear()} NETLAND CORPORACIÓN INMOBILIARIA. Todos los derechos reservados.</span>
          <span>Cañete, Perú</span>
        </div>
      </div>
    </footer>
  );
}