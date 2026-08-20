import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  HandCoins,
  Landmark,
  Leaf,
  ShieldCheck,
} from "lucide-react";
import { PageHero } from "./Projects";
import { Reveal } from "../components/Reveal";
import { whatsappLink } from "../lib/constants";

const values = [
  {
    icon: Leaf,
    title: "Origen en Cañete",
    text: "Nacimos en Cañete y crecemos junto a nuestra tierra, desarrollando proyectos que impulsan el desarrollo de la zona.",
  },
  {
    icon: ShieldCheck,
    title: "Confianza",
    text: "Empresa peruana legalmente constituida, con proyectos registrados en SUNARP y procesos transparentes.",
  },
  {
    icon: Building2,
    title: "Crecimiento",
    text: "Creamos oportunidades de inversión y calidad de vida para familias e inversionistas.",
  },
  {
    icon: HandCoins,
    title: "Acceso a financiamiento",
    text: "Financiamiento directo con cuotas sin intereses para que concretar tu lote sea más sencillo.",
  },
  {
    icon: FileCheck2,
    title: "Transparencia",
    text: "Orientación completa, asesoría legal y documentación clara en cada etapa del proceso.",
  },
  {
    icon: Landmark,
    title: "Respaldo",
    text: "Proyectos pensados para mejorar la calidad de vida, con visitas guiadas y atención personalizada.",
  },
];

export default function About() {
  return (
    <div>
      <PageHero
        title="Nosotros"
        subtitle="Netland Corporación Inmobiliaria: empresa peruana con raíces en Cañete, dedicada al desarrollo y comercialización de proyectos inmobiliarios."
      />

      <section className="section-padding bg-netland-background">
        <div className="container-netland">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <p className="eyebrow">Nuestra historia</p>
              <h2 className="font-display text-4xl font-semibold text-netland-dark sm:text-5xl">
                Construimos el lugar donde mereces vivir
              </h2>
              <p className="mt-6 leading-relaxed text-netland-muted">
                En Netland nos dedicamos al desarrollo y comercialización de
                proyectos inmobiliarios en Cañete. Nuestra propuesta se basa en la
                confianza, el respaldo y el crecimiento: cada proyecto está pensado
                para mejorar la calidad de vida de las familias y generar
                oportunidades reales de inversión.
              </p>
              <p className="mt-4 leading-relaxed text-netland-muted">
                Trabajamos con seriedad y transparencia. Ofrecemos visitas guiadas,
                orientación completa, asesoría legal y financiamiento directo con
                cuotas sin intereses.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/proyectos" className="btn-primary">
                  Ver proyectos
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  Hablar con un asesor
                </a>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-netland-primary p-8 text-white">
                  <p className="font-display text-5xl font-semibold">Cañete</p>
                  <p className="mt-2 text-sm uppercase tracking-wider text-white/70">
                    Nuestro origen
                  </p>
                </div>
                <div className="rounded-lg bg-netland-dark p-8 text-white">
                  <p className="font-display text-5xl font-semibold">100%</p>
                  <p className="mt-2 text-sm uppercase tracking-wider text-white/70">
                    Respaldo y seriedad
                  </p>
                </div>
                <div className="rounded-lg bg-netland-accent p-8 text-white">
                  <p className="font-display text-5xl font-semibold">S/ 0</p>
                  <p className="mt-2 text-sm uppercase tracking-wider text-white/80">
                    Intereses en cuotas
                  </p>
                </div>
                <div className="rounded-lg bg-netland-light p-8 text-netland-dark">
                  <p className="font-display text-5xl font-semibold">SUNARP</p>
                  <p className="mt-2 text-sm uppercase tracking-wider text-netland-muted">
                    Proyectos registrados
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-netland-dark py-20 text-white">
        <div className="container-netland">
          <Reveal>
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <p className="eyebrow justify-center">Nuestros valores</p>
              <h2 className="font-display text-4xl font-semibold sm:text-5xl">
                Lo que nos define
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 80}>
                <div className="h-full rounded-md border border-white/10 bg-white/5 p-7 transition-colors hover:border-netland-accent/40">
                  <value.icon className="mb-4 h-9 w-9 text-netland-accent" />
                  <h3 className="mb-2 font-display text-2xl font-semibold">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/70">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}