import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Plus, Send, X } from "lucide-react";
import { api } from "../../../lib/api";
import type { Quote, QuoteInput, Project, Lot } from "../../../types";
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
    const message = `¡Hola! 👋 Te envío la cotización ${quote.quote_number} del lote ${quote.lot_code} en ${quote.project_name}. Total: ${formatSoles(quote.total_amount)}. Para ver el PDF completo: ${API_URL}/quotes/${quote.id}/pdf`;
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
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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

  const selectedLot = lots?.find((l) => l.id === selectedLotId);
  const lotPrice = selectedLot ? (selectedLot.promo_price || selectedLot.price || 0) : 0;

  // Calcular descuento
  const discountAmount =
    discountType === "percentage"
      ? lotPrice * (discountValue / 100)
      : discountType === "fixed"
        ? discountValue
        : 0;
  const finalPrice = Math.max(lotPrice - discountAmount, 0);

  // Calcular cuota
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

        {/* Datos del cliente */}
        <div>
          <label className="block text-sm font-semibold text-netland-dark mb-3">
            Datos del Cliente
          </label>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre completo"
              className="px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
            />
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Teléfono / WhatsApp"
              className="px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
            />
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Email (opcional)"
              className="px-4 py-2.5 rounded-lg border border-netland-muted/30 focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20 outline-none"
            />
          </div>
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
