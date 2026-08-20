import { useState } from "react";
import { Map } from "lucide-react";
import type { Lot } from "../types";
import { LOT_STATUS_COLORS, LOT_STATUS_LABELS } from "../lib/constants";

interface PlanInteractiveProps {
  lots: Lot[];
  projectName: string;
  onSelect?: (lot: Lot) => void;
  selectedId?: number | null;
  compact?: boolean;
}

const SVG_W = 1200;
const SVG_H = 800;

const STATUS_OPACITY: Record<string, number> = {
  available: 0.95,
  reserved: 0.95,
  sold: 0.5,
  not_available: 0.35,
};

export function PlanInteractive({
  lots,
  projectName,
  onSelect,
  selectedId,
  compact,
}: PlanInteractiveProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const positioned = lots.filter(
    (l) => l.x !== null && l.y !== null && l.width !== null && l.height !== null
  );
  const useCoords = positioned.length > 0;

  const renderGrid = useCoords ? positioned : lots;

  const fallbackCols = Math.ceil(Math.sqrt(renderGrid.length));
  const fallbackCellW = SVG_W / fallbackCols;
  const fallbackCellH = SVG_H / fallbackCols;

  const getPosition = (lot: Lot, index: number) => {
    if (useCoords) {
      return {
        x: Number(lot.x),
        y: Number(lot.y),
        w: Number(lot.width),
        h: Number(lot.height),
      };
    }
    const col = index % fallbackCols;
    const row = Math.floor(index / fallbackCols);
    return {
      x: col * fallbackCellW + 10,
      y: row * fallbackCellH + 10,
      w: fallbackCellW - 20,
      h: fallbackCellH - 20,
    };
  };

  const fontSize = useCoords ? 18 : Math.min(fallbackCellW, fallbackCellH) / 5;

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-netland-muted">
          <Map className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">
            Plano de lotes — toca un lote para ver detalles
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-[11px] font-medium">
          {Object.entries(LOT_STATUS_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: LOT_STATUS_COLORS[key] }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-netland-light bg-white p-2 shadow-soft sm:p-4">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-auto w-full touch-manipulation"
          role="img"
          aria-label={`Plano interactivo de ${projectName}`}
        >
          <rect width={SVG_W} height={SVG_H} fill="#f5f5f0" rx="8" />
          {renderGrid.map((lot, index) => {
            const { x, y, w, h } = getPosition(lot, index);
            const isSelected = lot.id === selectedId;
            const isHovered = hovered === lot.code;
            const color = LOT_STATUS_COLORS[lot.status];
            return (
              <g
                key={lot.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                onClick={() => onSelect?.(lot)}
                onMouseEnter={() => setHovered(lot.code)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  width={w}
                  height={h}
                  rx="6"
                  fill={color}
                  fillOpacity={STATUS_OPACITY[lot.status] ?? 0.6}
                  stroke={isSelected || isHovered ? "#b9924e" : "#ffffff"}
                  strokeWidth={isSelected || isHovered ? 6 : 3}
                  className="transition-all duration-200"
                />
                <text
                  x={w / 2}
                  y={h / 2 - fontSize * 0.2}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill="#ffffff"
                >
                  {lot.code.replace(/^MZ /, "").replace(/\s+/g, " ")}
                </text>
                {lot.area_m2 !== null && lot.area_m2 !== undefined && (
                  <text
                    x={w / 2}
                    y={h / 2 + fontSize * 0.9}
                    textAnchor="middle"
                    fontSize={fontSize * 0.7}
                    fill="#ffffff"
                    fillOpacity="0.9"
                  >
                    {lot.area_m2} m²
                  </text>
                )}
                {!compact && (isHovered || isSelected) && (
                  <text
                    x={w / 2}
                    y={h / 2 + fontSize * 1.9}
                    textAnchor="middle"
                    fontSize={fontSize * 0.7}
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {lot.status === "available" ? "VER LOTE" : LOT_STATUS_LABELS[lot.status]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}