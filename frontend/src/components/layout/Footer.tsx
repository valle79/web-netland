import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "../Logo";
import { whatsappLink } from "../../lib/constants";

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: "var(--netland-dark)" }}
    >
      {/* Línea superior de identidad */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: "var(--netland-primary)" }}
      />

      <div className="container-netland relative z-10 py-16">

        {/* CONTENIDO */}
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.8fr_0.9fr_1.2fr]">

          {/* MARCA */}
          <div>
            <Logo light />

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              El lugar donde mereces vivir. Proyectos inmobiliarios
              en Cañete con respaldo, confianza y oportunidades
              para construir tu futuro.
            </p>

            {/* Detalle de marca */}
            <div className="mt-6 flex items-center gap-2">
              <span
                className="h-1 w-8 rounded-full"
                style={{
                  backgroundColor: "var(--netland-primary)",
                }}
              />

              <span
                className="h-1 w-3 rounded-full"
                style={{
                  backgroundColor: "var(--netland-accent)",
                }}
              />
            </div>
          </div>

          {/* EXPLORA */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Explora
            </h4>

            <ul className="space-y-3">

              {[
                ["Inicio", "/"],
                ["Proyectos", "/proyectos"],
                ["Asesores", "/asesores"],
                ["Refiere y gana", "/refiere-y-gana"],
                ["Nosotros", "/nosotros"],
                ["Contacto", "/contacto"],
              ].map(([label, path]) => (
                <li key={path}>
                  <Link
                    to={path}
                    className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    <span
                      className="h-1 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      style={{
                        backgroundColor: "var(--netland-accent)",
                      }}
                    />

                    <span className="transition-transform group-hover:translate-x-1">
                      {label}
                    </span>
                  </Link>
                </li>
              ))}

            </ul>
          </div>

          {/* INFORMACIÓN */}
          <div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Información
            </h4>

            <ul className="space-y-3">

              <li>
                <Link
                  to="/contacto"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Política de privacidad
                </Link>
              </li>

              <li>
                <Link
                  to="/contacto"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Términos y condiciones
                </Link>
              </li>

              <li>
                <Link
                  to="/contacto"
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  Libro de reclamaciones
                </Link>
              </li>

            </ul>

            <Link
              to="/proyectos"
              className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold"
              style={{
                color: "var(--netland-accent)",
              }}
            >
              Conoce nuestros proyectos

              <ArrowUpRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </div>

          {/* CONTACTO */}
          <div>

            <h4 className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-white">
              Hablemos
            </h4>

            <div className="space-y-4">

              {/* WhatsApp */}
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <MessageCircle className="h-4 w-4 text-green-400" />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    WhatsApp
                  </p>

                  <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                    985 928 062
                  </p>
                </div>
              </a>

              {/* Teléfono */}
              <a
                href="tel:+51985928062"
                className="group flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <Phone
                    className="h-4 w-4"
                    style={{
                      color: "var(--netland-accent)",
                    }}
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Teléfono
                  </p>

                  <p className="text-sm font-medium text-slate-200 group-hover:text-white">
                    985 928 062
                  </p>
                </div>
              </a>

              {/* Ubicación */}
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                  <MapPin
                    className="h-4 w-4"
                    style={{
                      color: "var(--netland-primary)",
                    }}
                  />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Ubicación
                  </p>

                  <p className="text-sm font-medium text-slate-200">
                    Cañete, Lima, Perú
                  </p>
                </div>

              </div>

            </div>

            {/* REDES */}
            <div className="mt-7 flex gap-3">

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:-translate-y-1 hover:bg-white/10 hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:-translate-y-1 hover:bg-white/10 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>

              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:-translate-y-1 hover:bg-green-500/10 hover:text-green-400"
              >
                <MessageCircle className="h-4 w-4" />
              </a>

            </div>
          </div>
        </div>

        {/* CTA */}

      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/10">

        <div className="container-netland flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-500 sm:flex-row">

          <span>
            © {new Date().getFullYear()} NETLAND CORPORACIÓN INMOBILIARIA.
            Todos los derechos reservados.
          </span>

          <span className="flex items-center gap-2">
            <MapPin
              className="h-3.5 w-3.5"
              style={{
                color: "var(--netland-accent)",
              }}
            />

            Cañete, Perú
          </span>

        </div>

      </div>
    </footer>
  );
}