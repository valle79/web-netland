import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageCircle,
  PhoneCall,
  Plus,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../AuthContext";
import type { Advisor, Lead, Project } from "../../../types";
import {
  CAPTURED_SOURCES,
  CAPTURED_SOURCE_COLORS,
  CAPTURED_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  formatSoles,
  whatsappLink,
} from "../../../lib/constants";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  Textarea,
} from "../ui";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../components/ui/Toast";
import { EmptyState } from "../../../components/ui/EmptyState";

const SOURCE_ICONS: Record<string, typeof MapPin> = {
  campo: MapPin,
  llamada: PhoneCall,
  referido: Users,
  whatsapp: MessageCircle,
};

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

const SOURCES_QUERY = CAPTURED_SOURCES.join(",");

const emptyForm = {
  name: "",
  last_name: "",
  phone: "",
  whatsapp: "",
  email: "",
  project_id: "",
  budget: "",
  source: "campo",
  message: "",
  advisor_id: "",
};

export default function AdminCapturedClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(
    user?.role?.toUpperCase() ?? ""
  );

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [followUp, setFollowUp] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["captured-clients"],
    queryFn: () =>
      api.get<Lead[]>(`/leads?source=${SOURCES_QUERY}`, true),
  });

  const { data: projects } = useQuery({
    queryKey: ["projects-list"],
    queryFn: () => api.get<Project[]>("/projects"),
  });

  const { data: advisors } = useQuery({
    queryKey: ["advisors-public"],
    queryFn: () => api.get<Advisor[]>("/advisors"),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Lead>(
        "/leads/captured",
        {
          name: form.name.trim(),
          last_name: form.last_name.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || form.phone.trim(),
          email: form.email.trim() || null,
          project_id: form.project_id ? Number(form.project_id) : null,
          budget: form.budget ? Number(form.budget) : null,
          source: form.source,
          message: form.message.trim(),
          ...(isAdmin && form.advisor_id ? { advisor_id: Number(form.advisor_id) } : {}),
        },
        true
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captured-clients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Cliente registrado correctamente.");
      setRegisterOpen(false);
      setForm(emptyForm);
    },
    onError: (e) => toast(e.message, "error"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/leads/${id}`, { status }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captured-clients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-lots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Estado actualizado.");
      setSelected(null);
    },
    onError: (e) => toast(e.message, "error"),
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, follow_up }: { id: number; follow_up: string }) =>
      api.patch(`/leads/${id}`, { follow_up }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captured-clients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast("Seguimiento guardado.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, advisor_id }: { id: number; advisor_id: number | null }) =>
      api.patch(`/leads/${id}`, { advisor_id }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captured-clients"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast("Cliente reasignado correctamente.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const stats = useMemo(() => {
    const list = clients ?? [];
    return {
      total: list.length,
      campo: list.filter((c) => c.source === "campo").length,
      llamada: list.filter((c) => c.source === "llamada").length,
      vendidos: list.filter((c) => c.status === "sold").length,
    };
  }, [clients]);

  const filtered = useMemo(() => {
    const list = clients ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((lead) => {
      if (sourceFilter && lead.source !== sourceFilter) return false;
      if (statusFilter && lead.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        lead.client?.name,
        lead.client?.last_name,
        lead.client?.phone,
        lead.client?.email,
        lead.project_name,
        lead.advisor_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [clients, search, sourceFilter, statusFilter]);

  const submitDisabled =
    createMutation.isPending ||
    form.name.trim().length < 2 ||
    form.phone.trim().length < 6;

  return (
    <div>
      <PageHeader
        title="Clientes captados"
        subtitle="Registra y gestiona los clientes que captaste en campo o por llamada."
        action={
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrar cliente
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total captados"
          value={stats.total}
          icon={<Users className="h-4 w-4" />}
          accent="#0d9488"
        />
        <StatCard
          label="Captados en campo"
          value={stats.campo}
          icon={<MapPin className="h-4 w-4" />}
          accent="#4f46e5"
        />
        <StatCard
          label="Captados por llamada"
          value={stats.llamada}
          icon={<PhoneCall className="h-4 w-4" />}
          accent="#db2777"
        />
        <StatCard
          label="Clientes cerrados"
          value={stats.vendidos}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="#16a34a"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 sm:max-w-xs">
          <Field label="Buscar">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netland-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, teléfono, proyecto..."
                className="!pl-9"
              />
            </div>
          </Field>
        </div>

        <Field label="Estado">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="!w-auto min-w-[170px]"
          >
            <option value="">Todos los estados</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-wrap items-center gap-2 pb-2.5">
          <button
            onClick={() => setSourceFilter("")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              sourceFilter === ""
                ? "bg-netland-dark text-white shadow-md"
                : "bg-white text-netland-muted ring-1 ring-netland-light hover:ring-netland-primary/40"
            }`}
          >
            Todos
          </button>
          {CAPTURED_SOURCES.map((source) => {
            const color = CAPTURED_SOURCE_COLORS[source];
            const Icon = SOURCE_ICONS[source] ?? Users;
            const active = sourceFilter === source;
            return (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  active ? "text-white shadow-md" : "text-netland-muted ring-1 ring-netland-light hover:text-white"
                }`}
                style={
                  active
                    ? { backgroundColor: color }
                    : undefined
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {CAPTURED_SOURCE_LABELS[source]}
              </button>
            );
          })}
        </div>
      </div>

      {!clients || clients.length === 0 ? (
        <Card>
          <EmptyState
            title="Aún no hay clientes captados"
            description="Registra aquí los clientes que captas en campo o por llamada para darles seguimiento desde el panel."
          />
          <div className="flex justify-center">
            <Button onClick={() => setRegisterOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrar tu primer cliente
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin resultados"
            description="Ningún cliente coincide con los filtros aplicados."
          />
        </Card>
      ) : isLoading ? null : (
        <Table
          headers={[
            "Cliente",
            "Contacto",
            "Origen",
            "Interés",
            "Estado",
            ...(isAdmin ? ["Asesor"] : []),
            "Acciones",
          ]}
        >
          {filtered.map((lead) => {
            const Icon = SOURCE_ICONS[lead.source] ?? Users;
            const sourceColor =
              CAPTURED_SOURCE_COLORS[lead.source] ?? "#6b7280";
            return (
              <tr key={lead.id} className="hover:bg-netland-light/30">
                <td className="px-5 py-3">
                  <p className="font-semibold text-netland-dark">
                    {lead.client?.name} {lead.client?.last_name}
                  </p>
                  <p className="text-xs text-netland-muted">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <p className="text-netland-muted">{lead.client?.phone}</p>
                  <a
                    href={whatsappLink(
                      `Hola ${lead.client?.name}, le escribimos de Netland Corporación Inmobiliaria.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-netland-accent hover:underline"
                  >
                    <MessageCircle className="h-3 w-3" />
                    WhatsApp
                  </a>
                </td>
                <td className="px-5 py-3">
                  <Badge color={sourceColor}>
                    <Icon className="h-3 w-3" />
                    {CAPTURED_SOURCE_LABELS[lead.source] ?? lead.source}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <p className="text-netland-dark">{lead.project_name ?? "—"}</p>
                  <p className="text-xs font-medium text-netland-muted">
                    {formatSoles(lead.budget)}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <Badge color={statusColors[lead.status] ?? "#6b7280"}>
                    {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                  </Badge>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3 text-netland-muted">
                    {lead.advisor_name ?? "—"}
                  </td>
                )}
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
            );
          })}
        </Table>
      )}

      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Registrar cliente captado"
        wide
      >
        <div className="space-y-5 p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netland-muted">
              ¿Cómo lo captaste?
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CAPTURED_SOURCES.map((source) => {
                const color = CAPTURED_SOURCE_COLORS[source];
                const Icon = SOURCE_ICONS[source] ?? Users;
                const active = form.source === source;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setForm({ ...form, source })}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 transition-all ${
                      active
                        ? "-translate-y-0.5 bg-white shadow-lift"
                        : "border-netland-light bg-netland-background opacity-70 hover:opacity-100"
                    }`}
                    style={active ? { borderColor: color } : undefined}
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={active ? { color } : undefined}
                    >
                      {CAPTURED_SOURCE_LABELS[source]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombres *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. María Elena"
              />
            </Field>
            <Field label="Apellidos">
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                placeholder="Ej. Torres Ríos"
              />
            </Field>
            <Field label="Teléfono *" hint="Con o sin código de país.">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="999 999 999"
                inputMode="tel"
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(e) =>
                  setForm({ ...form, whatsapp: e.target.value })
                }
                placeholder="Igual al teléfono si se deja vacío"
                inputMode="tel"
              />
            </Field>
            <Field label="Correo electrónico">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="cliente@correo.com"
              />
            </Field>
            <Field label="Proyecto de interés">
              <Select
                value={form.project_id}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value })
                }
              >
                <option value="">Sin definir</option>
                {(projects ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Presupuesto estimado (S/)">
              <Input
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="Ej. 25000"
              />
            </Field>
            {isAdmin && (
              <Field label="Asesor asignado">
                <Select
                  value={form.advisor_id}
                  onChange={(e) =>
                    setForm({ ...form, advisor_id: e.target.value })
                  }
                >
                  <option value="">Yo mismo / por defecto</option>
                  {(advisors ?? []).map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <Field label="Notas de la gestión">
            <Textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Detalle de la conversación, zona visitada, siguiente paso..."
            />
          </Field>

          <div className="flex justify-end gap-3 border-t border-netland-light pt-4">
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={submitDisabled}
            >
              <ClipboardList className="h-4 w-4" />
              Guardar cliente
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `${selected.client?.name ?? ""} ${selected.client?.last_name ?? ""}`.trim()
            : ""
        }
        wide
      >
        {selected && (
          <div className="p-6">
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-netland-light/60 p-4">
                <p className="text-xs uppercase tracking-wider text-netland-muted">
                  Contacto
                </p>
                <p className="mt-1 font-medium text-netland-dark">
                  {selected.client?.phone}
                </p>
                <p className="text-sm text-netland-muted">
                  {selected.client?.email ?? "—"}
                </p>
              </div>
              <div className="rounded-lg bg-netland-light/60 p-4">
                <p className="text-xs uppercase tracking-wider text-netland-muted">
                  Interés
                </p>
                <p className="mt-1 font-medium text-netland-dark">
                  {selected.project_name ?? "Sin definir"}
                </p>
                <p className="text-sm text-netland-muted">
                  {formatSoles(selected.budget)}
                </p>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: `${(CAPTURED_SOURCE_COLORS[selected.source] ?? "#6b7280")}12` }}>
                <p className="text-xs uppercase tracking-wider text-netland-muted">
                  Origen
                </p>
                <div className="mt-2">
                  <Badge color={CAPTURED_SOURCE_COLORS[selected.source] ?? "#6b7280"}>
                    {CAPTURED_SOURCE_LABELS[selected.source] ?? selected.source}
                  </Badge>
                </div>
                {isAdmin && (
                  <p className="mt-2 text-sm text-netland-muted">
                    Asesor: {selected.advisor_name ?? "—"}
                  </p>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="mb-6 rounded-lg border border-netland-light bg-netland-background p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netland-muted">
                  Asignar a un asesor
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={selected.advisor_id ?? ""}
                    onChange={(e) =>
                      reassignMutation.mutate({
                        id: selected.id,
                        advisor_id: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    disabled={reassignMutation.isPending}
                    className="!w-auto min-w-[220px] flex-1"
                  >
                    <option value="">Sin asignar</option>
                    {(advisors ?? []).map((advisor) => (
                      <option key={advisor.id} value={advisor.id}>
                        {advisor.name}
                      </option>
                    ))}
                  </Select>
                  <span className="text-xs text-netland-muted">
                    El cliente pasará a la bandeja del asesor elegido.
                  </span>
                </div>
              </div>
            )}

            {selected.message && (
              <div className="mb-6 rounded-lg border border-netland-light p-4 text-sm text-netland-muted">
                <span className="font-semibold text-netland-dark">
                  Notas de captación:{" "}
                </span>
                {selected.message}
              </div>
            )}

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-netland-muted">
                Estado del cliente
              </p>
              <div className="flex flex-wrap gap-2">
                {LEAD_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      statusMutation.mutate({ id: selected.id, status: s })
                    }
                    disabled={statusMutation.isPending}
                    className={`rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      selected.status === s
                        ? "text-white shadow-md"
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
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    followUpMutation.mutate({
                      id: selected.id,
                      follow_up: followUp,
                    })
                  }
                  disabled={followUpMutation.isPending}
                >
                  Guardar seguimiento
                </Button>
                <a
                  href={whatsappLink(
                    `Hola ${selected.client?.name}, le escribimos de Netland Corporación Inmobiliaria.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp !py-2.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar
                </a>
                {selected.project_name && (
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-netland-light/60 px-3 py-2.5 text-xs font-medium text-netland-muted">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Registrado el{" "}
                    {selected.created_at
                      ? new Date(selected.created_at).toLocaleDateString(
                          "es-PE"
                        )
                      : "—"}
                  </span>
                )}
              </div>
            </div>

            {selected.follow_up && (
              <div className="rounded-lg bg-netland-light/40 p-4 text-sm text-netland-muted">
                <span className="font-semibold text-netland-dark">
                  Último seguimiento:{" "}
                </span>
                {selected.follow_up}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
