import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Calculator, CheckCircle2, Download } from "lucide-react";
import type { Lot, Project } from "../types";
import { API_URL, formatSoles } from "../lib/constants";
import { useLeadForm } from "../features/leads/useLeadForm";

interface QuoteCalculatorProps {
  project: Project;
  lots: Lot[];
  initialLotId?: number | null;
}

export function QuoteCalculator({ project, lots, initialLotId }: QuoteCalculatorProps) {
  const availableLots = lots.filter((l) => l.status === "available");
  const [lotId, setLotId] = useState<number | "">(initialLotId ?? "");
  const [initial, setInitial] = useState(0);
  const [installments, setInstallments] = useState(24);
  const { submit, submitting, submitted } = useLeadForm();

  const selectedLot = useMemo(
    () => availableLots.find((l) => l.id === lotId),
    [availableLots, lotId]
  );

  useEffect(() => {
    if (initialLotId) setLotId(initialLotId);
  }, [initialLotId]);

  const price = selectedLot?.promo_price ?? selectedLot?.price ?? 0;
  const balance = Math.max(price - initial, 0);
  const installmentValue = installments > 0 ? balance / installments : 0;

  const handleRequest = async () => {
    if (!selectedLot) return;
    await submit({
      name: "",
      last_name: "",
      phone: "",
      message: `Solicito cotización del lote ${selectedLot.code} (inicial S/ ${initial}, ${installments} cuotas).`,
      project_id: project.id,
      lot_id: selectedLot.id,
      budget: price,
      source: "cotizador",
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-netland-muted">
            Selecciona tu lote
          </span>
          <select
            value={lotId}
            onChange={(e) =>
              setLotId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-sm border border-netland-light bg-white px-4 py-3 text-sm outline-none focus:border-netland-primary"
          >
            <option value="">Elige un lote disponible...</option>
            {availableLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.code} — {lot.area_m2} m² —{" "}
                {formatSoles(lot.promo_price ?? lot.price)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-netland-muted">
            Inicial (S/)
          </span>
          <input
            type="number"
            min={0}
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value) || 0)}
            className="w-full rounded-sm border border-netland-light bg-white px-4 py-3 text-sm outline-none focus:border-netland-primary"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-netland-muted">
            Número de cuotas
          </span>
          <select
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
            className="w-full rounded-sm border border-netland-light bg-white px-4 py-3 text-sm outline-none focus:border-netland-primary"
          >
            {[6, 12, 18, 24, 36, 48, 60].map((n) => (
              <option key={n} value={n}>
                {n} cuotas
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col rounded-lg bg-netland-dark p-6 text-white">
        <div className="mb-4 flex items-center gap-2 text-netland-accent">
          <Calculator className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em]">
            Resumen de inversión
          </span>
        </div>

        {!selectedLot ? (
          <p className="py-10 text-center text-sm text-white/60">
            Selecciona un lote para calcular tu inversión.
          </p>
        ) : (
          <>
            <dl className="space-y-3 text-sm">
              <Row label="Lote" value={selectedLot.code} />
              <Row label="Área" value={`${selectedLot.area_m2} m²`} />
              <Row label="Precio del lote" value={formatSoles(price)} highlight />
              <Row label="Inicial" value={formatSoles(initial)} />
              <Row label="Saldo a financiar" value={formatSoles(balance)} />
              <Row label="Cuotas" value={`${installments}`} />
              <Row label="Valor de cuota" value={formatSoles(installmentValue)} bold />
            </dl>

            {submitted ? (
              <div className="mt-6 flex items-center gap-2 rounded-md bg-white/10 px-4 py-3 text-sm">
                <CheckCircle2 className="h-5 w-5 text-netland-accent" />
                Solicitud de cotización enviada. Un asesor te contactará.
              </div>
            ) : (
              <button
                onClick={handleRequest}
                disabled={submitting}
                className="btn-accent mt-6 w-full disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Quiero esta cotización"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-white/60">{label}</dt>
      <dd
        className={`${
          highlight ? "text-netland-accent" : ""
        } ${bold ? "font-semibold" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function QuoteDownloadButton({ quoteId }: { quoteId: number }) {
  const { refetch, isFetching } = useQuery({
    queryKey: ["quote-pdf", quoteId],
    queryFn: async () => {
      const token = localStorage.getItem("netland_token");
      const res = await fetch(
        `${API_URL}/quotes/${quoteId}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${quoteId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    },
    enabled: false,
  });

  return (
    <button
      onClick={() => refetch()}
      disabled={isFetching}
      className="btn-primary !py-2.5 text-xs"
    >
      <Download className="h-4 w-4" />
      {isFetching ? "Generando..." : "Descargar PDF"}
    </button>
  );
}