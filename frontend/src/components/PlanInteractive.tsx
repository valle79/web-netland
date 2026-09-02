import { useState, useMemo } from "react";
import { Map, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { Lot } from "../types";
import { LOT_STATUS_COLORS, LOT_STATUS_LABELS } from "../lib/constants";

interface PlanInteractiveProps {
  lots: Lot[];
  projectName: string;
  onSelect?: (lot: Lot) => void;
  selectedId?: number | null;
  compact?: boolean;
  planPdfUrl?: string | null;
}

const SVG_W = 1200;
const SVG_H = 800;
const LOTS_PER_PAGE = 100; // 10x10 grid = 100 lotes por página

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
  planPdfUrl,
}: PlanInteractiveProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar lotes por búsqueda
  const filteredLots = useMemo(() => {
    if (!searchTerm.trim()) return lots;
    const term = searchTerm.toLowerCase();
    return lots.filter(lot => 
      lot.code.toLowerCase().includes(term) ||
      lot.status.toLowerCase().includes(term)
    );
  }, [lots, searchTerm]);

  const positioned = filteredLots.filter(
    (l) => l.x !== null && l.y !== null && l.width !== null && l.height !== null
  );
  const useCoords = positioned.length > 0;

  // Aplicar paginación
  const totalPages = Math.ceil(filteredLots.length / LOTS_PER_PAGE);
  const startIndex = (currentPage - 1) * LOTS_PER_PAGE;
  const endIndex = startIndex + LOTS_PER_PAGE;
  const paginatedLots = filteredLots.slice(startIndex, endIndex);

  const renderGrid = useCoords ? paginatedLots.filter(
    (l) => l.x !== null && l.y !== null && l.width !== null && l.height !== null
  ) : paginatedLots;

  // Calcular columnas dinámicamente: 10 columnas para un grid de 10x10
  const fallbackCols = 10; // Fijo en 10 columnas para grid 10x10
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

  const fontSize = useCoords ? 18 : Math.min(fallbackCellW, fallbackCellH) / 4; // Aumentado de /5 a /4

  // Resetear a página 1 cuando cambia la búsqueda
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // No hacer scroll, mantener la posición actual
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-netland-muted">
          <Map className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wider">
            Plano de lotes — toca un lote para ver detalles
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {planPdfUrl && (
            <div className="flex gap-2">
              <a
                href={planPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md bg-netland-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-netland-primary/90 hover:shadow-md"
              >
                <FileText className="h-4 w-4" />
                Ver PDF del plano
              </a>
              <a
                href={planPdfUrl}
                download
                className="flex items-center gap-2 rounded-md border border-netland-primary bg-white px-4 py-2 text-sm font-semibold text-netland-primary transition-all hover:bg-netland-primary/5"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar PDF
              </a>
            </div>
          )}
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
      </div>

      {/* Buscador y contador */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netland-muted" />
          <input
            type="text"
            placeholder="Buscar por código de lote..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-netland-light bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
          />
        </div>
        <div className="text-sm text-netland-muted">
          {filteredLots.length === lots.length ? (
            <span>{lots.length} {lots.length === 1 ? 'lote' : 'lotes'} en total</span>
          ) : (
            <span>{filteredLots.length} de {lots.length} {lots.length === 1 ? 'lote' : 'lotes'}</span>
          )}
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
                  stroke={isSelected || isHovered ? "#f5a623" : "#ffffff"}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-netland-light bg-white text-netland-dark transition-all hover:bg-netland-light disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Mostrar solo páginas cercanas a la actual
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex h-9 min-w-[36px] items-center justify-center rounded-md border px-3 text-sm font-medium transition-all ${
                      page === currentPage
                        ? "border-netland-primary bg-netland-primary text-white"
                        : "border-netland-light bg-white text-netland-dark hover:bg-netland-light"
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 text-netland-muted">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-netland-light bg-white text-netland-dark transition-all hover:bg-netland-light disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {filteredLots.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-netland-muted">
            No se encontraron lotes que coincidan con tu búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}