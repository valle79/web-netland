import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../../lib/api";
import type { Advisor } from "../../../types";
import { whatsappLink } from "../../../lib/constants";
import { PageHeader, Button, Card, Field, Input, Textarea, Table, Badge } from "../ui";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { EmptyState } from "../../../components/ui/EmptyState";

const emptyForm = {
  name: "",
  role_title: "Asesor Inmobiliario",
  photo_url: "",
  phone: "",
  whatsapp: "",
  email: "",
  project_ids: "",
  is_available: true,
  bio: "",
  sort_order: 0,
};

export default function AdminAdvisors() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Advisor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: advisors } = useQuery({
    queryKey: ["advisors-admin"],
    queryFn: () => api.get<Advisor[]>("/advisors"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? api.put(`/advisors/${editing.id}`, form, true)
        : api.post("/advisors", form, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisors-admin"] });
      toast(editing ? "Asesor actualizado." : "Asesor creado.");
      setModalOpen(false);
    },
    onError: (e) => toast(e.message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/advisors/${id}`, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advisors-admin"] });
      toast("Asesor eliminado.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (advisor: Advisor) => {
    setEditing(advisor);
    setForm({
      name: advisor.name,
      role_title: advisor.role_title,
      photo_url: advisor.photo_url,
      phone: advisor.phone,
      whatsapp: advisor.whatsapp,
      email: advisor.email ?? "",
      project_ids: advisor.project_ids,
      is_available: advisor.is_available,
      bio: advisor.bio,
      sort_order: advisor.sort_order,
    });
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Asesores"
        subtitle="Equipo comercial de Netland."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo asesor
          </Button>
        }
      />

      {!advisors || advisors.length === 0 ? (
        <Card>
          <EmptyState title="Sin asesores" description="Agrega el equipo comercial de Netland." />
        </Card>
      ) : (
        <Table headers={["Asesor", "Cargo", "Contacto", "Proyectos", "Estado", "Acciones"]}>
          {advisors.map((advisor) => (
            <tr key={advisor.id} className="hover:bg-netland-light/30">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  {advisor.photo_url ? (
                    <img src={advisor.photo_url} alt={advisor.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-netland-light font-display font-semibold text-netland-primary">
                      {advisor.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold text-netland-dark">{advisor.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-netland-muted">{advisor.role_title}</td>
              <td className="px-5 py-3">
                <p className="text-netland-muted">{advisor.phone || "—"}</p>
                <a
                  href={whatsappLink(`Hola ${advisor.name.split(" ")[0]}, te contactamos desde Netland.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-netland-accent hover:underline"
                >
                  WhatsApp →
                </a>
              </td>
              <td className="px-5 py-3 text-netland-muted">{advisor.project_ids || "—"}</td>
              <td className="px-5 py-3">
                <Badge color={advisor.is_available ? "#16a34a" : "#9ca3af"}>
                  {advisor.is_available ? "Disponible" : "No disponible"}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" className="!px-2.5 !py-1.5" onClick={() => openEdit(advisor)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-2.5 !py-1.5"
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${advisor.name}?`)) {
                        deleteMutation.mutate(advisor.id);
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
        title={editing ? `Editar ${editing.name}` : "Nuevo asesor"}
      >
        <div className="space-y-4 p-6">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Cargo">
            <Input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="985928062" />
          </Field>
          <Field label="WhatsApp (con código de país)">
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="51985928062" />
          </Field>
          <Field label="Correo">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Foto (URL Cloudinary)">
            <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
          </Field>
          <Field label="Proyectos asignados (IDs separados por coma)">
            <Input value={form.project_ids} onChange={(e) => setForm({ ...form, project_ids: e.target.value })} placeholder="1,2" />
          </Field>
          <Field label="Bio">
            <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              className="h-4 w-4 accent-netland-primary"
            />
            Disponible para nuevos clientes
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {editing ? "Guardar" : "Crear asesor"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}