import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../../lib/api";
import type { Project } from "../../../types";
import { PageHeader, Button, Card, Badge, Table } from "../ui";
import { useToast } from "../../../components/ui/Toast";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";

export default function AdminProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-admin"],
    queryFn: () => api.get<Project[]>("/projects"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/projects/${id}`, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-admin"] });
      toast("Proyecto eliminado.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <div>
      <PageHeader
        title="Proyectos"
        subtitle="Administra los desarrollos inmobiliarios."
        action={
          <Link to="/admin/proyectos/nuevo">
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin proyectos"
            description="Crea tu primer proyecto inmobiliario."
          />
        </Card>
      ) : (
        <Table headers={["Proyecto", "Ubicación", "Lotes", "Disponibles", "Estado", "Acciones"]}>
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-netland-light/30">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-md"
                    style={{
                      backgroundColor: project.color_primary,
                      backgroundImage: project.hero_image
                        ? `url(${project.hero_image})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div>
                    <p className="font-semibold text-netland-dark">{project.short_name}</p>
                    <p className="text-xs text-netland-muted">/{project.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-netland-muted">{project.location}</td>
              <td className="px-5 py-4">{project.lots_count}</td>
              <td className="px-5 py-4 font-semibold text-netland-primary">
                {project.available_count}
              </td>
              <td className="px-5 py-4">
                <Badge color={project.is_published ? "#16a34a" : "#9ca3af"}>
                  {project.is_published ? "Publicado" : "Oculto"}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  <Link to={`/admin/proyectos/${project.id}/editar`}>
                    <Button variant="outline" className="!px-3 !py-2">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/admin/plano/${project.id}`}>
                    <Button variant="outline" className="!px-3 !py-2">
                      Plano
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    className="!px-3 !py-2"
                    onClick={() => {
                      if (confirm(`¿Eliminar el proyecto ${project.short_name}?`)) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}