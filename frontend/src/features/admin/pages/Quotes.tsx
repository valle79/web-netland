import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileText, Plus, Search, Send, User, X } from "lucide-react";
import { api } from "../../../lib/api";
import type { Quote, QuoteInput, Project, Lot, Lead } from "../../../types";
import { formatSoles, API_URL } from "../../../lib/constants";
import { PageHeader, Card, Table, Button, Badge } from "../ui";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";

const statusColors: Record<string, string> = {
  draft: "#6b7280",
  sent: "#0891b2",
  accepted: "#16a34a",
  rejected: "#dc2626",
};

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export default function AdminQuotes() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const queryClient = useQueryClient();

  const { data: quotes } = useQuery({
    queryKey: ["quotes-admin"],
    queryFn: () => api.get<Quote[]>("/quotes", true),
  });

  const downloadPdf = async (id: number) => {
    const token = localStorage.getItem("netland_token");
    const res = await fetch(`${API_URL}/quotes/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cotizacion-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendWhatsApp = (quote: Quote) => {
    const phone = quote.client_phone || "";
    const greeting = quote.client_name
      ? `¡Hola ${quote.client_name}!`
      : "¡Hola!";
    const message = `${greeting} 👋 Te envío la cotización ${quote.quote_number} del lote ${quote.lot_code} en ${quote.project_name}. Total: ${formatSoles(quote.total_amount)}. Para ver el PDF completo: ${API_URL}/quotes/${quote.id}/pdf`;
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle="Genera cotizaciones profesionales con descuentos y planes de financiamiento."
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        }
      />

      {!quotes || quotes.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin cotizaciones"
            description="Crea tu primera cotización profesional para tus clientes."
          />
          <div className="flex justify-center pb-6">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Cotización
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Table
            headers={[
              "Número",
              "Cliente",
              "Proyecto / Lote",
              "Tipo Pago",
              "Inicial",
              "Cuotas",
              "Cuota",
              "Total",
              "Estado",
              "Acciones",
            ]}
          >
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-netland-light/30">
                <td className="px-5 py-3">
                  <div className="font-semibold text-netland-dark">{quote.quote_number}</div>
                  <div className="text-xs text-netland-muted">{quote.advisor_name || "—"}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium">{quote.client_name || "Por confirmar"}</div>
                  {quote.client_phone && (
                    <div className="text-xs text-netland-muted">{quote.client_phone}</div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="font-medium">{quote.project_name ?? "—"}</div>
                  <div className="text-xs text-netland-muted">
                    Lote {quote.lot_code} {quote.lot_area ? `· ${quote.lot_area} m²` : ""}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge color={quote.payment_type === "cash" ? "#059669" : "#0891b2"}>
                    {quote.payment_type === "cash" ? "Contado" : "Crédito"}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-sm">{formatSoles(quote.initial_payment)}</td>
                <td className="px-5 py-3 text-sm">{quote.installments || "—"}</td>
                <td className="px-5 py-3 text-sm">{formatSoles(quote.installment_value)}</td>
                <td className="px-5 py-3">
                  <div className="font-bold text-netland-primary">{formatSoles(quote.total_amount)}</div>
                  {quote.discount_type !== "none" && (quote.discount_value || 0) > 0 && (
                    <div className="text-xs text-orange-600">Con descuento</div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <Badge color={statusColors[quote.status] ?? "#6b7280"}>
                    {statusLabels[quote.status] || quote.status}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="!px-3 !py-1.5"
                      onClick={() => setDetailQuote(quote)}
                      title="Ver detalles"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      className="!px-3 !py-1.5"
                      onClick={() => downloadPdf(quote.id)}
                      title="Descargar PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {quote.client_phone && (
                      <Button
                        variant="outline"
                        className="!px-3 !py-1.5 !border-green-600 !text-green-600 hover:!bg-green-50"
                        onClick={() => sendWhatsApp(quote)}
                        title="Enviar por WhatsApp"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {showCreateModal && (
        <CreateQuoteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["quotes-admin"] });
            setShowCreateModal(false);
          }}
        />
      )}

      {/* MODAL DETALLES COTIZACIÓN */}
      {detailQuote && (
        <QuoteDetailModal
          quote={detailQuote}
          onClose={() => setDetailQuote(null)}
          onDownloadPdf={downloadPdf}
          onSendWhatsApp={sendWhatsApp}
        />
      )}
    </div>
  );
}

function CreateQuoteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("credit");
  const [initialPayment, setInitialPayment] = useState(0);
  const [installments, setInstallments] = useState(12);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [notes, setNotes] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects-for-quote"],
    queryFn: () => api.get<Project[]>("/projects", false),
  });

  const { data: lots } = useQuery({
    queryKey: ["lots-for-quote", selectedProjectId],
    queryFn: () => api.get<Lot[]>(`/projects/${selectedProjectId}/lots`, true),
    enabled: !!selectedProjectId,
  });

  const { data: leads } = useQuery({
    queryKey: ["leads-for-quote"],
    queryFn: () => api.get<Lead[]>("/leads", true),
  });

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    const term = clientSearch.trim().toLowerCase();
    if (!term) return leads;
    return leads.filter((lead) => {
      const haystack = [
        lead.client?.name,
        lead.client?.last_name,
        lead.client?.phone,
        lead.client?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [leads, clientSearch]);

  const selectedLead = leads?.find((l) => l.id === selectedLeadId);

  const clientName = selectedLead
    ? `${selectedLead.client?.name ?? ""} ${selectedLead.client?.last_name ?? ""}`.trim()
    : "";
  const clientPhone = selectedLead?.client?.phone ?? "";
  const clientEmail = selectedLead?.client?.email ?? "";

  const selectedLot = lots?.find((l) => l.id === selectedLotId);
  const lotPrice = selectedLot ? (selectedLot.promo_price || selectedLot.price || 0) : 0;

  const discountAmount =
    discountType === "percentage"
      ? lotPrice * (discountValue / 100)
      : discountType === "fixed"
        ? discountValue
        : 0;
  const finalPrice = Math.max(lotPrice - discountAmount, 0);

  const balance = paymentType === "credit" ? Math.max(finalPrice - initialPayment, 0) : 0;
  const monthlyPayment = paymentType === "credit" && installments > 0 ? balance / installments : 0;

  const createMutation = useMutation({
    mutationFn: (data: QuoteInput) => api.post<Quote>("/quotes", data, true),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedLotId) return;

    createMutation.mutate({
      lead_id: selectedLeadId,
      project_id: selectedProjectId,
      lot_id: selectedLotId,
      lot_price: lotPrice,
      discount_type: discountType,
      discount_value: discountValue,
      payment_type: paymentType,
      initial_payment: paymentType === "credit" ? initialPayment : 0,
      installments: paymentType === "credit" ? installments : 0,
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail,
      notes,
    });
  };

  return (
    <Modal open={true} onClose={onClose} wide={true}>
      <div className="flex items-center justify-between border-b pb-4 mb-6 px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-netland-primary/10">
            <FileText className="h-5 w-5 text-netland-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-netland-dark">Nueva Cotización</h3>
            <p className="text-sm text-netland-muted">Genera una cotización profesional</p>
          </div>
        </div>
        <button onClick={onClose} className="text-netland-muted hover:text-netland-dark">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6">
        {/* Selección de Proyecto y Lote */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-netland-dark mb-2">
              Proyecto <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProjectId || ""}
              onChange={(e) => {
                setSelectedProjectId(Number(e.target.value) || null);
                setSelectedLotId(null);
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
              required
            >
              <option value="">Seleccionar proyecto</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-netland-dark mb-2">
              Lote <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedLotId || ""}
              onChange={(e) => setSelectedLotId(Number(e.target.value) || null)}
              className="w-full px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
              disabled={!selectedProjectId}
              required
            >
              <option value="">Seleccionar lote</option>
              {lots
                ?.filter((l) => l.status === "available")
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} - {formatSoles(l.promo_price || l.price)} {l.area_m2 ? `(${l.area_m2} m²)` : ""}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Precio del lote */}
        {selectedLot && (
          <div className="p-4 bg-netland-light/30 rounded-lg border border-netland-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-netland-dark">Precio del lote:</span>
              <span className="text-lg font-bold text-netland-primary">{formatSoles(lotPrice)}</span>
            </div>
            {selectedLot.area_m2 && (
              <div className="text-xs text-netland-muted mt-1">
                Área: {selectedLot.area_m2} m²
              </div>
            )}
          </div>
        )}

        {/* Descuento */}
        <div>
          <label className="block text-sm font-semibold text-netland-dark mb-2">Descuento</label>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
            >
              <option value="none">Sin descuento</option>
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo (S/)</option>
            </select>

            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              disabled={discountType === "none"}
              min="0"
              step="0.01"
              placeholder={discountType === "percentage" ? "%" : "S/"}
              className="px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          {discountAmount > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-orange-600 font-medium">
                Descuento: -{formatSoles(discountAmount)}
              </span>
              <span className="ml-3 text-netland-primary font-bold">
                Precio final: {formatSoles(finalPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Tipo de pago */}
        <div>
          <label className="block text-sm font-semibold text-netland-dark mb-2">
            Tipo de Pago <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentType("cash")}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                paymentType === "cash"
                  ? "border-netland-primary bg-netland-primary/10 text-netland-primary"
                  : "border-netland-muted/30 text-netland-muted hover:border-netland-primary/30"
              }`}
            >
              Al Contado
            </button>
            <button
              type="button"
              onClick={() => setPaymentType("credit")}
              className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                paymentType === "credit"
                  ? "border-netland-primary bg-netland-primary/10 text-netland-primary"
                  : "border-netland-muted/30 text-netland-muted hover:border-netland-primary/30"
              }`}
            >
              A Crédito
            </button>
          </div>
        </div>

        {/* Financiamiento (solo si es crédito) */}
        {paymentType === "credit" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-netland-dark mb-2">
                Inicial (S/) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={initialPayment}
                onChange={(e) => setInitialPayment(Number(e.target.value))}
                min="0"
                max={finalPrice}
                step="0.01"
                className="w-full px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-netland-dark mb-2">
                Número de Cuotas <span className="text-red-500">*</span>
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
                required
              >
                {[6, 12, 18, 24, 36, 48, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} meses
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Resumen de cuota */}
        {paymentType === "credit" && selectedLot && (
          <div className="p-4 bg-gradient-to-r from-netland-primary/10 to-orange-50 rounded-lg border border-netland-primary/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-netland-muted uppercase mb-1">Saldo a financiar</div>
                <div className="text-lg font-bold text-netland-dark">{formatSoles(balance)}</div>
              </div>
              <div>
                <div className="text-xs text-netland-muted uppercase mb-1">Número de cuotas</div>
                <div className="text-lg font-bold text-netland-dark">{installments} meses</div>
              </div>
              <div>
                <div className="text-xs text-netland-muted uppercase mb-1">Cuota mensual</div>
                <div className="text-xl font-bold text-netland-primary">
                  {formatSoles(monthlyPayment)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selector de cliente captado */}
        <div>
          <label className="block text-sm font-semibold text-netland-dark mb-2">
            Cliente captado
          </label>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-netland-muted" />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
            />
          </div>

          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-netland-muted/20">
            {filteredLeads.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-netland-muted">
                {leads?.length === 0
                  ? "No hay clientes captados registrados."
                  : "No se encontraron resultados."}
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const name = `${lead.client?.name ?? ""} ${lead.client?.last_name ?? ""}`.trim();
                const isSelected = lead.id === selectedLeadId;
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      setSelectedLeadId(isSelected ? null : lead.id);
                      setClientSearch("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-netland-muted/10 last:border-0 ${
                      isSelected
                        ? "bg-netland-primary/10"
                        : "hover:bg-netland-light/50"
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-netland-primary/10 text-netland-primary shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-netland-dark truncate">{name || "Sin nombre"}</p>
                      <p className="text-xs text-netland-muted truncate">
                        {lead.client?.phone}
                        {lead.client?.email ? ` · ${lead.client.email}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <Badge color="#16a34a">Seleccionado</Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {selectedLead && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Badge color="#16a34a">
                {`${selectedLead.client?.name ?? ""} ${selectedLead.client?.last_name ?? ""}`.trim()}
              </Badge>
              <span className="text-netland-muted">·</span>
              <span className="text-netland-muted">{selectedLead.client?.phone}</span>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="ml-auto text-xs text-red-500 hover:text-red-700"
              >
                Quitar selección
              </button>
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-semibold text-netland-dark mb-2">
            Observaciones adicionales
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Agregar notas, condiciones especiales, promociones..."
            className="w-full px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!selectedProjectId || !selectedLotId || createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? "Generando..." : "Generar Cotización"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function QuoteDetailModal({
  quote,
  onClose,
  onDownloadPdf,
  onSendWhatsApp,
}: {
  quote: Quote;
  onClose: () => void;
  onDownloadPdf: (id: number) => void;
  onSendWhatsApp: (quote: Quote) => void;
}) {
  const hasDiscount = quote.discount_type !== "none" && (quote.discount_value || 0) > 0;
  const isCredit = quote.payment_type === "credit";

  const discountAmount = hasDiscount
    ? quote.discount_type === "percentage"
      ? (quote.lot_price || 0) * ((quote.discount_value || 0) / 100)
      : quote.discount_value || 0
    : 0;

  return (
    <Modal open={true} onClose={onClose} wide>
      <div className="px-6 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-netland.png"
              alt="Netland"
              className="h-10 w-10 rounded-lg object-contain"
            />
            <div>
              <h3 className="text-xl font-bold text-netland-dark">{quote.quote_number}</h3>
              <p className="text-sm text-netland-muted">
                {new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <Badge color={statusColors[quote.status] ?? "#6b7280"}>
            {statusLabels[quote.status] || quote.status}
          </Badge>
        </div>

        {/* Info grid */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {/* Cliente */}
          <div className="rounded-xl bg-netland-light/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-netland-muted mb-2">
              Cliente
            </p>
            <p className="font-semibold text-netland-dark">{quote.client_name || "Sin cliente"}</p>
            {quote.client_phone && (
              <p className="text-sm text-netland-muted mt-0.5">{quote.client_phone}</p>
            )}
            {quote.client_email && (
              <p className="text-sm text-netland-muted">{quote.client_email}</p>
            )}
          </div>

          {/* Proyecto / Lote */}
          <div className="rounded-xl bg-netland-light/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-netland-muted mb-2">
              Proyecto / Lote
            </p>
            <p className="font-semibold text-netland-dark">{quote.project_name || "—"}</p>
            <p className="text-sm text-netland-muted mt-0.5">
              Lote {quote.lot_code}
              {quote.lot_area ? ` · ${quote.lot_area} m²` : ""}
            </p>
            {quote.advisor_name && (
              <p className="text-sm text-netland-muted mt-0.5">Asesor: {quote.advisor_name}</p>
            )}
          </div>

          {/* Tipo de pago */}
          <div className="rounded-xl bg-netland-light/50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-netland-muted mb-2">
              Tipo de pago
            </p>
            <Badge color={isCredit ? "#0891b2" : "#059669"}>
              {isCredit ? "A Crédito" : "Al Contado"}
            </Badge>
            {isCredit && (
              <p className="text-sm text-netland-muted mt-2">
                {quote.installments} cuotas de {formatSoles(quote.installment_value)}
              </p>
            )}
          </div>
        </div>

        {/* Desglose financiero */}
        <div className="rounded-xl border border-netland-muted/20 overflow-hidden mb-6">
          <div className="bg-netland-light/30 px-5 py-3 border-b border-netland-muted/20">
            <p className="text-xs font-semibold uppercase tracking-wider text-netland-muted">
              Desglose financiero
            </p>
          </div>

          <div className="divide-y divide-netland-muted/10">
            {/* Precio lote */}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-netland-muted">Precio del lote</span>
              <span className="font-medium text-netland-dark">{formatSoles(quote.lot_price)}</span>
            </div>

            {/* Descuento */}
            {hasDiscount && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-netland-muted">
                  Descuento
                  {quote.discount_type === "percentage"
                    ? ` (${quote.discount_value}%)`
                    : ""}
                </span>
                <span className="font-medium text-orange-600">-{formatSoles(discountAmount)}</span>
              </div>
            )}

            {/* Inicial */}
            {isCredit && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-netland-muted">Cuota inicial</span>
                <span className="font-medium text-netland-dark">{formatSoles(quote.initial_payment)}</span>
              </div>
            )}

            {/* Cuotas */}
            {isCredit && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-netland-muted">
                  {quote.installments} cuotas mensuales
                </span>
                <span className="font-medium text-netland-dark">{formatSoles(quote.installment_value)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-netland-primary/5">
              <span className="text-sm font-bold text-netland-dark uppercase tracking-wider">Total</span>
              <span className="text-xl font-bold text-netland-primary">{formatSoles(quote.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notas */}
        {quote.notes && (
          <div className="rounded-xl border border-netland-muted/20 p-4 mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-netland-muted mb-1.5">
              Observaciones
            </p>
            <p className="text-sm text-netland-dark whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-netland-muted/20">
          <Button
            variant="outline"
            onClick={() => onDownloadPdf(quote.id)}
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>

          {quote.client_phone && (
            <Button
              variant="outline"
              className="!border-green-600 !text-green-600 hover:!bg-green-50"
              onClick={() => onSendWhatsApp(quote)}
            >
              <Send className="h-4 w-4" />
              Enviar por WhatsApp
            </Button>
          )}

          <div className="ml-auto">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
