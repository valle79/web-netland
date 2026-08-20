import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../../lib/api";
import type { Promotion, Project } from "../../../types";
import { formatSoles } from "../../../lib/constants";
import { PageHeader, Button, Card, Field, Input, Textarea, Table, Badge } from "../ui";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { EmptyState } from "../../../components/ui/EmptyState";

interface FormState {
  project_id: string;
  name: string;
  description: string;
  old_price: string;
  promo_price: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  project_id: "",
  name: "",
  description: "",
  old_price: "",
  promo_price: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

export default function AdminPromotions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: promotions } = useQuery({
    queryKey: ["promotions-admin"],
    queryFn: () => api.get<Promotion[]>("/projects/promotions?only_active=false"),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-admin"],
    queryFn: () => api.get<Project[]>("/projects"),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        project_id: Number(form.project_id),
        name: form.name,
        description: form.description,
        old_price: form.old_price ? Number(form.old_price) : null,
        promo_price: form.promo_price ? Number(form.promo_price) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
      };
      return editing
        ? api.put(`/projects/promotions/${editing.id}`, payload, true)
        : api.post("/projects/promotions", payload, true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      toast(editing ? "Promoción actualizada." : "Promoción creada.");
      setModalOpen(false);
    },
    onError: (e) => toast(e.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/projects/promotions/${id}`, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions-admin"] });
      toast("Promoción eliminada.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, project_id: projects?.[0]?.id?.toString() ?? "" });
    setModalOpen(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditing(promo);
    setForm({
      project_id: promo.project_id.toString(),
      name: promo.name,
      description: promo.description,
      old_price: promo.old_price?.toString() ?? "",
      promo_price: promo.promo_price?.toString() ?? "",
      start_date: promo.start_date ?? "",
      end_date: promo.end_date ?? "",
      is_active: promo.is_active,
    });
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Promociones"
        subtitle="Ofertas y precios preferenciales por proyecto."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva promoción
          </Button>
        }
      />

      {!promotions || promotions.length === 0 ? (
        <Card>
          <EmptyState title="Sin promociones" description="Crea promociones desde este módulo." />
        </Card>
      ) : (
        <Table headers={["Promoción", "Proyecto", "Precio anterior", "Precio promocional", "Estado", "Acciones"]}>
          {promotions.map((promo) => (
            <tr key={promo.id} className="hover:bg-netland-light/30">
              <td className="px-5 py-3">
                <p className="font-semibold text-netland-dark">{promo.name}</p>
                {promo.description && (
                  <p className="max-w-xs truncate text-xs text-netland-muted">{promo.description}</p>
                )}
              </td>
              <td className="px-5 py-3 text-netland-muted">
                {projects?.find((p) => p.id === promo.project_id)?.short_name ?? "—"}
              </td>
              <td className="px-5 py-3 text-netland-muted line-through">
                {formatSoles(promo.old_price)}
              </td>
              <td className="px-5 py-3 font-semibold text-netland-accent">
                {formatSoles(promo.promo_price)}
              </td>
              <td className="px-5 py-3">
                <Badge color={promo.is_active ? "#16a34a" : "#9ca3af"}>
                  {promo.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" className="!px-2.5 !py-1.5" onClick={() => openEdit(promo)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-2.5 !py-1.5"
                    onClick={() => {
                      if (confirm(`¿Eliminar la promoción ${promo.name}?`)) {
                        deleteMutation.mutate(promo.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar promoción" : "Nueva promoción"}
        wide
      >
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Nombre">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Promoción especial" />
            </Field>
          </div>
          <Field label="Proyecto">
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full rounded-sm border border-netland-light bg-netland-background px-3.5 py-2.5 text-sm outline-none focus:border-netland-primary"
            >
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.short_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select
              value={form.is_active ? "1" : "0"}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === "1" })}
              className="w-full rounded-sm border border-netland-light bg-netland-background px-3.5 py-2.5 text-sm outline-none focus:border-netland-primary"
            >
              <option value="1">Activa</option>
              <option value="0">Inactiva</option>
            </select>
          </Field>
          <Field label="Precio anterior (S/)">
            <Input type="number" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} />
          </Field>
          <Field label="Precio promocional (S/)">
            <Input type="number" value={form.promo_price} onChange={(e) => setForm({ ...form, promo_price: e.target.value })} />
          </Field>
          <Field label="Fecha inicio">
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </Field>
          <Field label="Fecha fin">
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción">
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {editing ? "Guardar" : "Crear promoción"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}