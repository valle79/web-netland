import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { api } from "../../../lib/api";
import type { Lead } from "../../../types";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  whatsappLink,
  formatSoles,
} from "../../../lib/constants";
import { PageHeader, Card, Badge, Field, Select, Button, Textarea, Table } from "../ui";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { EmptyState } from "../../../components/ui/EmptyState";

const statusColors: Record<string, string> = {
  new: "#2563eb",
  contacted: "#7c3aed",
  interested: "#ea580c",
  visit_scheduled: "#0891b2",
  negotiation: "#db2777",
  reserved: "#eab308",
  sold: "#16a34a",
  discarded: "#6b7280",
};

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [followUp, setFollowUp] = useState("");

  const { data: leads } = useQuery({
    queryKey: ["leads", filter],
    queryFn: () => api.get<Lead[]>(`/leads${filter ? `?status=${filter}` : ""}`, true),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/leads/${id}`, { status }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Estado del lead actualizado.");
      setSelected(null);
    },
    onError: (e) => toast(e.message, "error"),
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, follow_up }: { id: number; follow_up: string }) =>
      api.patch(`/leads/${id}`, { follow_up }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast("Seguimiento registrado.");
      setFollowUp("");
    },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Gestiona clientes potenciales y su seguimiento."
      />

      <div className="mb-6 max-w-xs">
        <Field label="Filtrar por estado">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {!leads || leads.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin leads"
            description="Los formularios del sitio y de los lotes generarán leads aquí."
          />
        </Card>
      ) : (
        <Table headers={["Cliente", "Contacto", "Proyecto / Lote", "Presupuesto", "Estado", "Acciones"]}>
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-netland-light/30">
              <td className="px-5 py-3">
                <p className="font-semibold text-netland-dark">
                  {lead.client?.name} {lead.client?.last_name}
                </p>
                <p className="text-xs text-netland-muted">
                  {new Date(lead.created_at ?? "").toLocaleDateString("es-PE")}
                </p>
              </td>
              <td className="px-5 py-3">
                <p className="text-netland-muted">{lead.client?.phone}</p>
                {lead.client?.whatsapp && (
                  <a
                    href={whatsappLink(
                      `Hola ${lead.client?.name}, te escribimos de Netland por tu consulta.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-netland-accent hover:underline"
                  >
                    WhatsApp →
                  </a>
                )}
              </td>
              <td className="px-5 py-3">
                <p className="text-netland-dark">{lead.project_name ?? "—"}</p>
                <p className="text-xs text-netland-muted">{lead.lot_code ?? ""}</p>
              </td>
              <td className="px-5 py-3">{formatSoles(lead.budget)}</td>
              <td className="px-5 py-3">
                <Badge color={statusColors[lead.status] ?? "#6b7280"}>
                  {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                </Badge>
              </td>
              <td className="px-5 py-3">
                <Button
                  variant="outline"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => {
                    setSelected(lead);
                    setFollowUp(lead.follow_up ?? "");
                  }}
                >
                  Gestionar
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.client?.name} ${selected.client?.last_name}` : ""}
        wide
      >
        {selected && (
          <div className="p-6">
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-netland-light/60 p-4">
                <p className="text-xs uppercase tracking-wider text-netland-muted">Contacto</p>
                <p className="mt-1 font-medium text-netland-dark">{selected.client?.phone}</p>
                <p className="text-sm text-netland-muted">{selected.client?.email ?? "—"}</p>
              </div>
              <div className="rounded-md bg-netland-light/60 p-4">
                <p className="text-xs uppercase tracking-wider text-netland-muted">Interés</p>
                <p className="mt-1 font-medium text-netland-dark">
                  {selected.project_name ?? "—"}
                </p>
                <p className="text-sm text-netland-muted">
                  {selected.lot_code ?? ""} · {formatSoles(selected.budget)}
                </p>
              </div>
            </div>

            {selected.message && (
              <div className="mb-6 rounded-md border border-netland-light p-4 text-sm text-netland-muted">
                {selected.message}
              </div>
            )}

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netland-muted">
                Estado del lead
              </p>
              <div className="flex flex-wrap gap-2">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate({ id: selected.id, status: s })}
                    className={`rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      selected.status === s
                        ? "text-white"
                        : "bg-netland-light text-netland-muted hover:bg-netland-light/70"
                    }`}
                    style={
                      selected.status === s
                        ? { backgroundColor: statusColors[s] }
                        : undefined
                    }
                  >
                    {LEAD_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netland-muted">
                Seguimiento
              </p>
              <Textarea
                rows={3}
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Notas del último contacto, siguiente paso..."
              />
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() =>
                    followUpMutation.mutate({ id: selected.id, follow_up: followUp })
                  }
                  disabled={followUpMutation.isPending}
                >
                  Guardar seguimiento
                </Button>
                <a
                  href={whatsappLink(
                    `Hola ${selected.client?.name}, te escribimos de Netland por tu consulta.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp !py-2.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar
                </a>
              </div>
            </div>

            {selected.follow_up && (
              <div className="rounded-md bg-netland-light/40 p-4 text-sm text-netland-muted">
                <span className="font-semibold text-netland-dark">Último seguimiento: </span>
                {selected.follow_up}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}