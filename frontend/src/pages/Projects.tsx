import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { api } from "../lib/api";
import type { Project } from "../types";
import { Reveal } from "../components/Reveal";
import { CardSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=80";

export default function Projects() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/projects?published_only=true"),
  });

  return (
    <div>
      <PageHero
        title="Nuestros proyectos"
        subtitle="Desarrollos inmobiliarios en Cañete pensados para familias e inversionistas."
      />

      <section className="section-padding bg-netland-background">
        <div className="container-netland">
          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : !projects || projects.length === 0 ? (
            <EmptyState
              title="Próximamente nuevos proyectos"
              description="Estamos preparando nuevos desarrollos. Contacta a un asesor para más información."
            />
          ) : (
            <div className="grid gap-10 md:grid-cols-2">
              {projects.map((project, i) => (
                <Reveal key={project.id} delay={i * 120}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const typeLabel =
    project.project_type === "condominio_campestre"
      ? "Condominio Campestre"
      : project.project_type === "urbanizacion"
      ? "Urbanización"
      : "Proyecto Inmobiliario";

  return (
    <article className="group overflow-hidden rounded-xl border border-netland-light bg-white transition-all duration-300 hover:border-netland-primary hover:shadow-soft">
      <Link to={`/proyectos/${project.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={project.hero_image || HERO_IMAGE}
            alt={project.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute left-5 top-5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-netland-primary backdrop-blur-sm">
            {typeLabel}
          </span>
        </div>
      </Link>

      <div className="p-8">
        <h3 className="font-display text-3xl font-bold text-netland-dark">
          <Link to={`/proyectos/${project.slug}`} className="transition-colors hover:text-netland-primary">
            {project.short_name}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-netland-muted">
          <MapPin className="h-4 w-4 text-netland-accent" />
          {project.location}
        </p>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-netland-muted">
          {project.description}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-netland-light pt-6">
          <div className="text-sm">
            <span className="block font-bold text-netland-dark">{project.available_count}</span>
            <span className="text-netland-muted">lotes disponibles</span>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/proyectos/${project.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-netland-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-netland-primary transition-all hover:bg-netland-primary hover:text-white"
            >
              Ver proyecto
            </Link>
            <Link
              to={`/proyectos/${project.slug}?tab=lotes`}
              className="inline-flex items-center gap-2 rounded-lg bg-netland-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-all hover:bg-netland-primaryDark"
            >
              Ver lotes
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PageHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="relative overflow-hidden bg-netland-dark pb-20 pt-36 text-white">
      <div className="container-netland relative z-10">
        <Reveal>
          <p className="eyebrow">Netland</p>
          <h1 className="max-w-3xl text-balance font-display text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">{subtitle}</p>
        </Reveal>
      </div>
    </section>
  );
}