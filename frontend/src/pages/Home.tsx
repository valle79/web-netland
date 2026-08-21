import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  FileCheck2,
  HandCoins,
  HeartHandshake,
  Landmark,
  MapPin,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { api } from "../lib/api";
import { whatsappLink } from "../lib/constants";
import type { Project } from "../types";
import { Reveal } from "../components/Reveal";
import { CardSkeleton } from "../components/ui/Skeleton";
import { useState } from "react";

interface SiteConfig {
  hero_video_url?: string;
  hero_video_title?: string;
  [key: string]: string | undefined;
}

const trustItems = [
  { icon: Landmark, title: "Empresa legalmente constituida" },
  { icon: FileCheck2, title: "Proyectos registrados en SUNARP" },
  { icon: UserCheck, title: "Asesoría completa" },
  { icon: CalendarCheck, title: "Visitas guiadas" },
  { icon: HandCoins, title: "Financiamiento directo" },
  { icon: TrendingUp, title: "Cuotas sin intereses" },
  { icon: HeartHandshake, title: "Atención personalizada" },
];

const whyItems = [
  {
    icon: ShieldCheck,
    title: "Garantía",
    text: "Respaldo de una empresa peruana sólida, con proyectos desarrollados de forma ordenada y transparente.",
  },
  {
    icon: Building2,
    title: "Responsabilidad",
    text: "Acompañamos cada etapa del proceso con orientación completa, desde la elección del lote hasta la compra.",
  },
  {
    icon: Sparkles,
    title: "Calidad",
    text: "Proyectos pensados para mejorar la calidad de vida de las familias, con espacios y entornos cuidados.",
  },
  {
    icon: ShieldCheck,
    title: "Seguridad",
    text: "Documentación en regla y procesos claros para que tu inversión esté protegida.",
  },
];

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80";

const VIDEO_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\ w-]{11})/;

function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

export default function Home() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/projects?published_only=true"),
  });

  const { data: config } = useQuery<SiteConfig>({
    queryKey: ["public-config"],
    queryFn: () => api.get("/config/public"),
  });

  return (
    <div>
      <Hero config={config} />
      <ProjectsSection projects={projects} loading={isLoading} />
      <TrustSection />
      <WhySection />
      <StatsStrip />
      <CtaSection />
    </div>
  );
}

function Hero({ config }: { config?: SiteConfig }) {
  const [showVideo, setShowVideo] = useState(false);
  const videoUrl = config?.hero_video_url || "";
  const videoId = videoUrl ? extractVideoId(videoUrl) : null;
  const isCloudinaryVideo = videoUrl.includes("cloudinary") || videoUrl.includes(".mp4") || videoUrl.includes(".webm");
  const hasVideo = !!(videoId || isCloudinaryVideo);

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden">
      {/* Background Image or Video */}
      <div className="absolute inset-0">
        {hasVideo && showVideo ? (
          <div className="relative h-full w-full">
            {videoId ? (
              // YouTube video
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0`}
                  title={config?.hero_video_title || "Video hero"}
                  className="absolute inset-0 h-full w-full scale-150 object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{ pointerEvents: 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-netland-dark/90 via-netland-dark/40 to-netland-dark/20" />
              </>
            ) : (
              // Cloudinary or direct video
              <>
                <video
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-netland-dark/90 via-netland-dark/40 to-netland-dark/20" />
              </>
            )}
          </div>
        ) : (
          <>
            <img
              src={HERO_IMAGE}
              alt="Campo verde en Cañete"
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-netland-dark/90 via-netland-dark/50 to-netland-dark/30" />
          </>
        )}
      </div>

      <div className="container-netland relative z-10 pb-24 pt-36 text-white">
        <Reveal>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.25em] backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-netland-accent" />
            Cañete, Perú
          </p>
          <h1 className="max-w-3xl text-balance font-display text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
            El lugar donde <span className="text-netland-accent">mereces vivir</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/90">
            Invierte en proyectos inmobiliarios pensados para tu futuro, con
            respaldo, confianza y oportunidades de crecimiento en Cañete.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
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
              <MessageCircle className="h-4 w-4" />
              Hablar con un asesor
            </a>
            {hasVideo && !showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/80 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
              >
                <Play className="h-4 w-4" />
                Ver video
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ProjectsSection({
  projects,
  loading,
}: {
  projects?: Project[];
  loading: boolean;
}) {
  return (
    <section className="section-padding bg-netland-background">
      <div className="container-netland">
        <Reveal>
          <div className="mb-14 max-w-2xl">
            <p className="eyebrow">Nuestros proyectos</p>
            <h2 className="text-balance font-display text-4xl font-semibold text-netland-dark sm:text-5xl">
              Lugares pensados para crecer
            </h2>
            <p className="mt-4 text-netland-muted">
              Descubre proyectos inmobiliarios en Cañete diseñados para familias e
              inversionistas que buscan seguridad y calidad de vida.
            </p>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {projects?.map((project, i) => (
              <Reveal key={project.id} delay={i * 120}>
                <Link
                  to={`/proyectos/${project.slug}`}
                  className="group relative block overflow-hidden rounded-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={project.hero_image || HERO_IMAGE}
                      alt={project.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-netland-dark/85 via-netland-dark/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-netland-accent">
                      {project.project_type === "condominio_campestre"
                        ? "Condominio campestre"
                        : "Urbanización"}
                    </p>
                    <h3 className="font-display text-3xl font-semibold text-white">
                      {project.short_name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </p>
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <span className="font-semibold text-emerald-300">
                        {project.available_count} lotes disponibles
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white transition-colors group-hover:text-netland-accent">
                        Ver proyecto <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-netland-dark py-20 text-white md:py-28">
      <div className="container-netland">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="eyebrow justify-center">Confianza</p>
            <h2 className="font-display text-4xl font-semibold sm:text-5xl">
              Invierte con respaldo
            </h2>
            <p className="mt-4 text-white/70">
              Cada proyecto de Netland se desarrolla con seriedad, transparencia y
              cercanía con el cliente.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="flex h-full items-center gap-4 rounded-md border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:border-netland-accent/50">
                <item.icon className="h-8 w-8 shrink-0 text-netland-accent" />
                <span className="text-sm font-medium leading-snug">{item.title}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhySection() {
  return (
    <section className="section-padding bg-netland-background">
      <div className="container-netland">
        <Reveal>
          <div className="mb-14 max-w-2xl">
            <p className="eyebrow">Nuestra filosofía</p>
            <h2 className="font-display text-4xl font-semibold text-netland-dark sm:text-5xl">
              ¿Por qué Netland?
            </h2>
          </div>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="group h-full rounded-lg bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-netland-light text-netland-primary transition-colors group-hover:bg-netland-primary group-hover:text-white">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-display text-2xl font-semibold text-netland-dark">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-netland-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section className="border-y border-netland-light bg-netland-light/50 py-14">
      <div className="container-netland grid gap-8 text-center sm:grid-cols-3">
        <div>
          <p className="font-display text-5xl font-semibold text-netland-primary">100%</p>
          <p className="mt-2 text-sm uppercase tracking-wider text-netland-muted">
            Respaldo y confianza
          </p>
        </div>
        <div>
          <p className="font-display text-5xl font-semibold text-netland-primary">Cañete</p>
          <p className="mt-2 text-sm uppercase tracking-wider text-netland-muted">
            Nuestro origen y crecimiento
          </p>
        </div>
        <div>
          <p className="font-display text-5xl font-semibold text-netland-primary">
            S/ 0
          </p>
          <p className="mt-2 text-sm uppercase tracking-wider text-netland-muted">
            Intereses en cuotas
          </p>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-netland-primary py-24">
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="container-netland relative z-10 text-center text-white">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-balance font-display text-4xl font-semibold sm:text-5xl">
            Tu futuro empieza con un lote
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Consulta disponibilidad, agenda una visita o habla directamente con un
            asesor de Netland.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/proyectos" className="btn-accent">
              Ver lotes disponibles
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <MessageCircle className="h-4 w-4" />
              Agendar visita
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}