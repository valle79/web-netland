import { useState } from "react";
import { CheckCircle2, MessageCircle, X } from "lucide-react";
import type { Lot, Project } from "../types";
import { Modal } from "./ui/Modal";
import {
  formatArea,
  formatSoles,
  LOT_STATUS_COLORS,
  LOT_STATUS_LABELS,
  lotWhatsappMessage,
  whatsappLink,
} from "../lib/constants";
import { useLeadForm } from "../features/leads/useLeadForm";

interface LotModalProps {
  lot: Lot | null;
  project: Project;
  onClose: () => void;
}

export function LotModal({ lot, project, onClose }: LotModalProps) {
  const [showForm, setShowForm] = useState(false);
  const { submit, submitting, submitted } = useLeadForm();

  if (!lot) return null;

  const price = lot.promo_price ?? lot.price;
  const statusColor = LOT_STATUS_COLORS[lot.status];

  const handleRequest = async (data: {
    name: string;
    last_name: string;
    phone: string;
    email?: string;
    message?: string;
  }) => {
    await submit({
      ...data,
      project_id: project.id,
      lot_id: lot.id,
      source: "lote",
    });
  };

  return (
    <Modal open={!!lot} onClose={onClose} title={`LOTE ${lot.code}`}>
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between rounded-md bg-netland-light px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-netland-muted">Área</p>
            <p className="font-display text-xl font-semibold text-netland-dark">
              {formatArea(lot.area_m2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-netland-muted">Estado</p>
            <p
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: statusColor }}
            >
              {LOT_STATUS_LABELS[lot.status]}
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-netland-muted">Precio</span>
            <span className="font-semibold text-netland-dark">
              {formatSoles(lot.price)}
            </span>
          </div>
          {lot.promo_price !== null && lot.promo_price !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-netland-muted">Promoción</span>
              <span className="font-semibold text-netland-accent">
                {formatSoles(lot.promo_price)}
              </span>
            </div>
          )}
        </div>

        {!showForm ? (
          <div className="space-y-3">
            <a
              href={whatsappLink(
                lotWhatsappMessage(project.short_name, lot.code, price)
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp w-full"
            >
              <MessageCircle className="h-4 w-4" />
              Quiero este lote
            </a>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary w-full"
            >
              Solicitar información
            </button>
            <a
              href={whatsappLink(lotWhatsappMessage(project.short_name, lot.code, price))}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm font-medium text-netland-secondary hover:text-netland-accent"
            >
              Consultar por WhatsApp
            </a>
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-netland-primary" />
            <p className="font-display text-xl font-semibold text-netland-dark">
              ¡Solicitud enviada!
            </p>
            <p className="text-sm text-netland-muted">
              Un asesor de Netland te contactará muy pronto con la información del
              lote {lot.code}.
            </p>
          </div>
        ) : (
          <LeadForm
            lot={lot}
            submitting={submitting}
            onCancel={() => setShowForm(false)}
            onSubmit={handleRequest}
          />
        )}

        {lot.notes && (
          <p className="mt-4 border-t border-netland-light pt-4 text-xs text-netland-muted">
            {lot.notes}
          </p>
        )}
      </div>
    </Modal>
  );
}

interface LeadFormProps {
  lot: Lot;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    name: string;
    last_name: string;
    phone: string;
    email?: string;
    message?: string;
  }) => Promise<void>;
}

function LeadForm({ lot, submitting, onCancel, onSubmit }: LeadFormProps) {
  const [form, setForm] = useState({
    name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Ingresa al menos tu nombre y teléfono.");
      return;
    }
    setError("");
    await onSubmit({
      ...form,
      message: `Interesado en el lote ${lot.code}.`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Tu nombre" />
        <Field label="Apellidos" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} placeholder="Tus apellidos" />
      </div>
      <Field label="Teléfono / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="999 888 777" />
      <Field label="Correo (opcional)" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="tucorreo@email.com" type="email" />
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1 disabled:opacity-60"
        >
          {submitting ? "Enviando..." : "Enviar solicitud"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm border border-netland-light px-5 text-sm text-netland-muted hover:text-netland-dark"
        >
          Volver
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-netland-light bg-netland-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-netland-primary"
      />
    </label>
  );
}

export { X };