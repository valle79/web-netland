import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Save } from "lucide-react";
import { api } from "../../../lib/api";
import type { Project } from "../../../types";
import { PageHeader, Button, Card, Field, Input, Select, Textarea } from "../ui";
import { useToast } from "../../../components/ui/Toast";
import { Skeleton } from "../../../components/ui/Skeleton";

const emptyProject = {
  slug: "",
  name: "",
  short_name: "",
  project_type: "lotes",
  tagline: "",
  description: "",
  long_description: "",
  features: "",
  location: "",
  reference: "",
  map_link: "",
  color_primary: "#14532d",
  color_secondary: "#1e3a5f",
  hero_image: "",
  hero_video: "",
  logo_url: "",
  status: "active",
  is_published: true,
  legal_info: "",
  seo_title: "",
  seo_description: "",
  og_image: "",
};

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyProject);

  const { isLoading } = useQuery({
    queryKey: ["project-form", id],
    queryFn: async () => {
      if (!id) return null;
      const project = await api.get<Project>(`/projects/${id}`);
      setForm({
        slug: project.slug,
        name: project.name,
        short_name: project.short_name,
        project_type: project.project_type,
        tagline: project.tagline,
        description: project.description,
        long_description: project.long_description,
        features: project.features,
        location: project.location,
        reference: project.reference,
        map_link: project.map_link,
        color_primary: project.color_primary,
        color_secondary: project.color_secondary,
        hero_image: project.hero_image,
        hero_video: project.hero_video,
        logo_url: project.logo_url,
        status: project.status,
        is_published: project.is_published,
        legal_info: project.legal_info,
        seo_title: project.seo_title,
        seo_description: project.seo_description,
        og_image: project.og_image,
      });
      return project;
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      id
        ? api.put<Project>(`/projects/${id}`, form, true)
        : api.post<Project>("/projects", form, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects-admin"] });
      toast(id ? "Proyecto actualizado." : "Proyecto creado.");
      navigate("/admin/proyectos");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const set = (key: keyof typeof emptyProject, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) return <Skeleton className="h-96 rounded-lg" />;

  return (
    <div>
      <PageHeader
        title={id ? "Editar proyecto" : "Nuevo proyecto"}
        subtitle="Información general e identidad visual del proyecto."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <Card className="space-y-4">
          <h3 className="font-display text-xl font-semibold text-netland-dark">Información general</h3>
          <Field label="Slug (URL amigable)">
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="villa-del-sur" required />
          </Field>
          <Field label="Nombre completo">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Condominio Campestre Villa del Sur" required />
          </Field>
          <Field label="Nombre corto">
            <Input value={form.short_name} onChange={(e) => set("short_name", e.target.value)} placeholder="Villa del Sur" required />
          </Field>
          <Field label="Tipo de proyecto">
            <Select value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
              <option value="lotes">Lotes</option>
              <option value="condominio_campestre">Condominio Campestre</option>
              <option value="urbanizacion">Urbanización</option>
            </Select>
          </Field>
          <Field label="Slogan / tagline">
            <Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
          <Field label="Descripción corta">
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Descripción larga">
            <Textarea rows={5} value={form.long_description} onChange={(e) => set("long_description", e.target.value)} />
          </Field>
          <Field label="Beneficios (uno por línea)" hint="Escribe cada beneficio en una línea.">
            <Textarea rows={4} value={form.features} onChange={(e) => set("features", e.target.value)} />
          </Field>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="font-display text-xl font-semibold text-netland-dark">Ubicación</h3>
            <Field label="Ubicación">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Almenares, Cañete" />
            </Field>
            <Field label="Referencia">
              <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="A 7 minutos de la Plaza de Armas de Imperial" />
            </Field>
            <Field label="Link del mapa (embed de Google Maps)">
              <Input value={form.map_link} onChange={(e) => set("map_link", e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." />
            </Field>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-display text-xl font-semibold text-netland-dark">Identidad visual</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Color principal">
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color_primary} onChange={(e) => set("color_primary", e.target.value)} className="h-10 w-14 rounded-sm border border-netland-light" />
                  <Input value={form.color_primary} onChange={(e) => set("color_primary", e.target.value)} />
                </div>
              </Field>
              <Field label="Color secundario">
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color_secondary} onChange={(e) => set("color_secondary", e.target.value)} className="h-10 w-14 rounded-sm border border-netland-light" />
                  <Input value={form.color_secondary} onChange={(e) => set("color_secondary", e.target.value)} />
                </div>
              </Field>
            </div>
            <Field label="Imagen de portada (URL Cloudinary)">
              <Input value={form.hero_image} onChange={(e) => set("hero_image", e.target.value)} />
            </Field>
            <Field label="Video principal (URL YouTube o Cloudinary)">
              <Input value={form.hero_video} onChange={(e) => set("hero_video", e.target.value)} />
            </Field>
            <Field label="Logo del proyecto (URL)">
              <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} />
            </Field>
          </Card>

          <Card className="space-y-4">
            <h3 className="font-display text-xl font-semibold text-netland-dark">Publicación y SEO</h3>
            <Field label="Información legal">
              <Textarea rows={3} value={form.legal_info} onChange={(e) => set("legal_info", e.target.value)} />
            </Field>
            <Field label="SEO Title">
              <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
            </Field>
            <Field label="SEO Description">
              <Textarea rows={2} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
                className="h-4 w-4 accent-netland-primary"
              />
              Publicado (visible en el sitio)
            </label>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to="/admin/proyectos">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4" />
              Guardar proyecto
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}