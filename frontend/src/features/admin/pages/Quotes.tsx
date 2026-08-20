import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { api } from "../../../lib/api";
import type { Quote } from "../../../types";
import { formatSoles, API_URL } from "../../../lib/constants";
import { PageHeader, Card, Table, Button, Badge } from "../ui";
import { EmptyState } from "../../../components/ui/EmptyState";

const statusColors: Record<string, string> = {
  draft: "#6b7280",
  sent: "#0891b2",
  accepted: "#16a34a",
  rejected: "#dc2626",
};

export default function AdminQuotes() {
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

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle="Cotizaciones generadas por el cotizador y el equipo."
      />

      {!quotes || quotes.length === 0 ? (
        <Card>
          <EmptyState title="Sin cotizaciones" description="Las cotizaciones se generan desde el cotizador del sitio o el panel." />
        </Card>
      ) : (
        <Table headers={["Número", "Proyecto", "Lote", "Total", "Inicial", "Cuotas", "Cuota", "Estado", "PDF"]}>
          {quotes.map((quote) => (
            <tr key={quote.id} className="hover:bg-netland-light/30">
              <td className="px-5 py-3 font-semibold text-netland-dark">{quote.quote_number}</td>
              <td className="px-5 py-3 text-netland-muted">{quote.project_name ?? "—"}</td>
              <td className="px-5 py-3 text-netland-muted">{quote.lot_code ?? "—"}</td>
              <td className="px-5 py-3 font-medium">{formatSoles(quote.total_amount)}</td>
              <td className="px-5 py-3">{formatSoles(quote.initial_payment)}</td>
              <td className="px-5 py-3">{quote.installments}</td>
              <td className="px-5 py-3">{formatSoles(quote.installment_value)}</td>
              <td className="px-5 py-3">
                <Badge color={statusColors[quote.status] ?? "#6b7280"}>{quote.status}</Badge>
              </td>
              <td className="px-5 py-3">
                <Button variant="outline" className="!px-3 !py-1.5" onClick={() => downloadPdf(quote.id)}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}