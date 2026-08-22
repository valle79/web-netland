import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Move, Save } from "lucide-react";
import { api } from "../../../lib/api";
import type { Block, Lot, Project } from "../../../types";
import { LOT_STATUS_COLORS } from "../../../lib/constants";
import { PageHeader, Button, Card, Field, Input } from "../ui";
import { useToast } from "../../../components/ui/Toast";
import { Skeleton } from "../../../components/ui/Skeleton";

const SVG_W = 1200;
const SVG_H = 800;

export default function PlanEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{
    id: number;
    startX: number;
    startY: number;
    lotX: number;
    lotY: number;
  } | null>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get<Project>(`/projects/${projectId}`),
    enabled: !!projectId,
  });

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ["admin-plan-lots", projectId],
    queryFn: () => api.get<Lot[]>(`/projects/${projectId}/lots`),
    enabled: !!projectId,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ["admin-blocks", projectId],
    queryFn: () => api.get<Block[]>(`/projects/${projectId}/blocks`),
    enabled: !!projectId,
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/projects/lots/${id}`, data, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plan-lots"] });
    },
    onError: (e) => toast(e.message, "error"),
  });

  const selected = lots.find((l) => l.id === selectedLotId) ?? null;

  const updateSelected = (patch: Partial<Lot>) => {
    if (!selected) return;
    saveMutation.mutate({
      id: selected.id,
      data: {
        ...patch,
        x: patch.x ?? selected.x,
        y: patch.y ?? selected.y,
        width: patch.width ?? selected.width,
        height: patch.height ?? selected.height,
      },
    });
  };

  const handleSvgMouseDown = (e: React.MouseEvent, lot: Lot) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    setSelectedLotId(lot.id);
    setDragging({
      id: lot.id,
      startX: x,
      startY: y,
      lotX: Number(lot.x ?? 0),
      lotY: Number(lot.y ?? 0),
    });
  };

  const handleSvgMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const scaleX = SVG_W / rect.width;
    const scaleY = SVG_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const newX = Math.max(0, Math.min(SVG_W - 30, dragging.lotX + (x - dragging.startX)));
    const newY = Math.max(0, Math.min(SVG_H - 30, dragging.lotY + (y - dragging.startY)));
    if (selectedLotId === dragging.id) {
      updateSelected({ x: newX, y: newY });
    }
    setDragging((d) => (d ? { ...d, lotX: newX, lotY: newY } : d));
  };

  const handleSvgMouseUp = () => setDragging(null);

  if (isLoading || !project) return <Skeleton className="h-96 rounded-lg" />;

  return (
    <div>
      <PageHeader
        title={`Plano interactivo — ${project.short_name}`}
        subtitle="Arrastra los lotes para posicionarlos sobre el plano (coordenadas SVG 1200×800)."
        action={
          <Link to="/admin/lotes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Volver a lotes
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm text-netland-muted">
              <Move className="h-4 w-4" />
              Selecciona y arrastra un lote para moverlo. Elige un lote para editar
              sus coordenadas con precisión.
            </div>
            <div
              className="overflow-hidden rounded-md border border-netland-light"
              onMouseMove={handleSvgMouseMove}
              onMouseUp={handleSvgMouseUp}
              onMouseLeave={handleSvgMouseUp}
            >
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="h-auto w-full cursor-crosshair"
              >
                <rect width={SVG_W} height={SVG_H} fill="#f5f5f0" rx="8" />
                {lots.map((lot, index) => {
                  const pos = {
                    x: Number(lot.x) || 0,
                    y: Number(lot.y) || 0,
                    w: Number(lot.width) || 100,
                    h: Number(lot.height) || 70,
                  };
                  const isSelected = lot.id === selectedLotId;
                  const color = LOT_STATUS_COLORS[lot.status];
                  if (!lot.x && !lot.y) {
                    const cols = 5;
                    pos.x = (index % cols) * (SVG_W / cols) + 20;
                    pos.y = Math.floor(index / cols) * (SVG_H / 6) + 20;
                    pos.w = SVG_W / cols - 40;
                    pos.h = SVG_H / 6 - 40;
                  }
                  return (
                    <g
                      key={lot.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onMouseDown={(e) => handleSvgMouseDown(e, lot)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <rect
                        width={pos.w}
                        height={pos.h}
                        rx="6"
                        fill={color}
                        fillOpacity={0.85}
                        stroke={isSelected ? "#f5a623" : "#ffffff"}
                        strokeWidth={isSelected ? 5 : 2}
                      />
                      <text
                        x={pos.w / 2}
                        y={pos.h / 2}
                        textAnchor="middle"
                        fontSize="16"
                        fontWeight="600"
                        fill="#ffffff"
                      >
                        {lot.code}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="mb-4 font-display text-xl font-semibold text-netland-dark">
              {selected ? `Lote ${selected.code}` : "Lote seleccionado"}
            </h3>
            {!selected ? (
              <p className="text-sm text-netland-muted">
                Haz clic en un lote del plano para editar su posición y tamaño.
              </p>
            ) : (
              <div className="space-y-3">
                <Field label="X (izquierda)">
                  <Input
                    type="number"
                    value={selected.x ?? ""}
                    onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Y (arriba)">
                  <Input
                    type="number"
                    value={selected.y ?? ""}
                    onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ancho">
                    <Input
                      type="number"
                      value={selected.width ?? ""}
                      onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Alto">
                    <Input
                      type="number"
                      value={selected.height ?? ""}
                      onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <p className="text-xs text-netland-muted">
                  Sistema de coordenadas: el plano usa un lienzo de 1200×800. El
                  administrador puede subir una imagen de fondo del plano desde el
                  módulo Multimedia.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-display text-xl font-semibold text-netland-dark">
              Manzanas
            </h3>
            <ul className="space-y-2 text-sm">
              {blocks.length === 0 && (
                <p className="text-netland-muted">Aún no hay manzanas registradas.</p>
              )}
              {blocks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-md bg-netland-light/60 px-4 py-2.5"
                >
                  <span className="font-semibold text-netland-dark">
                    MZ {b.code}
                  </span>
                  <span className="text-netland-muted">{b.lots_count} lotes</span>
                </li>
              ))}
            </ul>
          </Card>

          <Button
            className="w-full"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-plan-lots"] });
              toast("Cambios sincronizados.");
            }}
          >
            <Save className="h-4 w-4" />
            Sincronizar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}