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
    <article className="group overflow-hidden rounded-lg bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/proyectos/${project.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={project.hero_image || HERO_IMAGE}
            alt={project.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-sm bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-netland-primary backdrop-blur">
            {typeLabel}
          </span>
        </div>
      </Link>

      <div className="p-7">
        <h3 className="font-display text-3xl font-semibold text-netland-dark">
          <Link to={`/proyectos/${project.slug}`} className="hover:text-netland-primary">
            {project.short_name}
          </Link>
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-netland-muted">
          <MapPin className="h-4 w-4 text-netland-accent" />
          {project.location}
        </p>
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-netland-muted">
          {project.description}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-netland-light pt-5">
          <span className="text-sm font-semibold text-netland-primary">
            {project.available_count} lotes disponibles
          </span>
          <div className="flex gap-3">
            <Link
              to={`/proyectos/${project.slug}`}
              className="btn-outline !border-netland-primary !py-2 !text-xs !text-netland-primary hover:!bg-netland-primary hover:!text-white"
            >
              Ver proyecto
            </Link>
            <Link
              to={`/proyectos/${project.slug}?tab=lotes`}
              className="btn-primary !py-2 !text-xs"
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
    <section className="relative overflow-hidden bg-netland-dark pt-36 pb-20 text-white">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(185,146,78,0.5), transparent 40%), radial-gradient(circle at 80% 70%, rgba(20,83,45,0.6), transparent 45%)",
        }}
      />
      <div className="container-netland relative z-10">
        <Reveal>
          <p className="eyebrow">Netland</p>
          <h1 className="max-w-2xl text-balance font-display text-5xl font-semibold sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-white/75">{subtitle}</p>
        </Reveal>
      </div>
    </section>
  );
}