import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  FileCheck2,
  HandCoins,
  Landmark,
  Leaf,
  ShieldCheck,
  Target,
  Users,
  Award,
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
    title: "Financiamiento accesible",
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

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "Familias confían en nosotros",
  },
  {
    icon: Building2,
    value: "100%",
    label: "Proyectos registrados",
  },
  {
    icon: Award,
    value: "0%",
    label: "Intereses en cuotas",
  },
  {
    icon: Target,
    value: "Cañete",
    label: "Ubicación estratégica",
  },
];

export default function About() {
  return (
    <div>
      <PageHero
        title="Nosotros"
        subtitle="Desarrollamos proyectos inmobiliarios que transforman vidas y crean oportunidades reales de inversión en Cañete."
      />

      {/* Historia y Misión */}
      <section className="section-padding bg-white">
        <div className="container-netland">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <Reveal>
              <div className="space-y-6">
                <p className="eyebrow">Quiénes somos</p>
                <h2 className="font-display text-4xl font-bold leading-tight text-netland-dark lg:text-5xl">
                  Construimos el lugar donde mereces vivir
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-netland-muted">
                  <p>
                    <span className="font-semibold text-netland-dark">Netland Corporación Inmobiliaria</span> es una empresa peruana con raíces en Cañete, dedicada al desarrollo y comercialización de proyectos inmobiliarios que transforman vidas.
                  </p>
                  <p>
                    Nuestra propuesta se basa en tres pilares fundamentales: <span className="font-semibold text-netland-dark">confianza, respaldo y crecimiento</span>. Cada proyecto está pensado para mejorar la calidad de vida de las familias y generar oportunidades reales de inversión.
                  </p>
                  <p>
                    Trabajamos con seriedad y transparencia absoluta. Ofrecemos visitas guiadas, orientación completa, asesoría legal y financiamiento directo con cuotas sin intereses, porque creemos que todos merecen tener un lugar propio.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className="group relative overflow-hidden rounded-xl border border-netland-light bg-netland-background p-8 transition-all duration-300 hover:border-netland-primary hover:shadow-soft"
                    >
                      <stat.icon className="mb-4 h-8 w-8 text-netland-accent transition-transform duration-300 group-hover:scale-110" />
                      <p className="mb-2 font-display text-4xl font-bold text-netland-dark">
                        {stat.value}
                      </p>
                      <p className="text-sm font-medium text-netland-muted">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Nuestra Visión */}
      <section className="section-padding bg-netland-dark text-white">
        <div className="container-netland">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <div className="text-center">
                <p className="eyebrow justify-center">Visión</p>
                <h2 className="font-display text-4xl font-bold leading-tight lg:text-5xl">
                  Transformar Cañete en un referente de desarrollo inmobiliario sostenible
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-white/80">
                  Aspiramos a ser la inmobiliaria líder en Cañete, reconocida por la calidad, transparencia y compromiso con nuestros clientes. Buscamos crear comunidades prósperas donde las familias puedan construir su futuro con confianza.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Nuestros Valores */}
      <section className="section-padding bg-netland-background">
        <div className="container-netland">
          <Reveal>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <p className="eyebrow justify-center">Valores</p>
              <h2 className="font-display text-4xl font-bold text-netland-dark lg:text-5xl">
                Lo que nos define
              </h2>
              <p className="mt-4 text-netland-muted">
                Principios fundamentales que guían cada decisión y proyecto que desarrollamos.
              </p>
            </div>
          </Reveal>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <Reveal key={value.title} delay={i * 80}>
                <div className="group h-full rounded-xl border border-netland-light bg-white p-8 transition-all duration-300 hover:border-netland-primary hover:shadow-soft">
                  <div className="mb-5 inline-flex rounded-lg bg-netland-primary/5 p-3">
                    <value.icon className="h-7 w-7 text-netland-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="mb-3 font-display text-2xl font-bold text-netland-dark">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-netland-muted">
                    {value.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="section-padding bg-white">
        <div className="container-netland">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <Reveal>
              <div>
                <p className="eyebrow">Nuestro compromiso</p>
                <h2 className="font-display text-4xl font-bold leading-tight text-netland-dark lg:text-5xl">
                  ¿Por qué elegir Netland?
                </h2>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-netland-primary">
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-netland-dark">
                        Empresa legalmente constituida
                      </p>
                      <p className="mt-1 text-sm text-netland-muted">
                        Todos nuestros proyectos están debidamente registrados en SUNARP con documentación transparente.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-netland-primary">
                      <HandCoins className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-netland-dark">
                        Financiamiento sin intereses
                      </p>
                      <p className="mt-1 text-sm text-netland-muted">
                        Ofrecemos planes de financiamiento directo con cuotas sin intereses, adaptados a tu economía.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-netland-primary">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-netland-dark">
                        Atención personalizada
                      </p>
                      <p className="mt-1 text-sm text-netland-muted">
                        Acompañamiento completo desde la visita hasta la escritura pública, con asesoría legal incluida.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-netland-primary">
                      <Landmark className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-netland-dark">
                        Visitas guiadas
                      </p>
                      <p className="mt-1 text-sm text-netland-muted">
                        Conoce cada proyecto personalmente con visitas guiadas para resolver todas tus dudas.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-2xl bg-netland-dark p-10 text-white">
                <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-netland-accent">
                  Respaldo legal
                </p>
                <h3 className="mb-6 font-display text-3xl font-bold">
                  Documentación completa y transparente
                </h3>
                <div className="space-y-3 text-sm text-white/80">
                  <p className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-netland-accent" />
                    Partida registral de cada proyecto
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-netland-accent" />
                    Planos visados por la municipalidad
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-netland-accent" />
                    Memoria descriptiva de cada lote
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-netland-accent" />
                    Contratos de separación y compraventa
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-netland-accent" />
                    Asesoría legal durante todo el proceso
                  </p>
                </div>
                <div className="mt-8 flex gap-4">
                  <Link to="/proyectos" className="btn-accent">
                    Ver proyectos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding bg-netland-primary text-white">
        <div className="container-netland">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <h2 className="font-display text-4xl font-bold leading-tight lg:text-5xl">
                ¿Listo para invertir en tu futuro?
              </h2>
              <p className="mt-6 text-lg text-white/90">
                Agenda una visita guiada a nuestros proyectos y descubre por qué más de 500 familias han confiado en Netland para construir su patrimonio.
              </p>
              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/proyectos" className="btn-accent">
                  Explorar proyectos
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={whatsappLink("Hola, quiero más información sobre los proyectos de Netland")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  Hablar con un asesor
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
