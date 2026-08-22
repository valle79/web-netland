import { Filter, X, Calendar, Search } from "lucide-react";
import { Card, Field, Select, Input, Button } from "../ui";
import type { Advisor } from "../../../types";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "../../../lib/constants";

export interface LeadFiltersState {
  status: string;
  advisor_id: string;
  date_from: string;
  date_to: string;
  search: string;
  source?: string;
}

interface LeadFiltersProps {
  filters: LeadFiltersState;
  onFilterChange: (key: keyof LeadFiltersState, value: string) => void;
  onClearFilters: () => void;
  advisors?: Advisor[];
  showAdvisorFilter?: boolean;
  showSourceFilter?: boolean;
  sourceOptions?: Array<{ value: string; label: string }>;
  isOpen: boolean;
  onToggle: () => void;
}

export function LeadFilters({
  filters,
  onFilterChange,
  onClearFilters,
  advisors,
  showAdvisorFilter = true,
  showSourceFilter = false,
  sourceOptions = [],
  isOpen,
  onToggle,
}: LeadFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const activeCount = Object.values(filters).filter((v) => v !== "").length;

  return (
    <>
      {/* Botón de filtros */}
      <Button onClick={onToggle} variant="outline">
        <Filter className="h-4 w-4" />
        Filtros {hasActiveFilters && `(${activeCount})`}
      </Button>

      {/* Panel de filtros */}
      {isOpen && (
        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-netland-dark">Filtros avanzados</h3>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-2 text-sm text-netland-accent hover:text-netland-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Filtro de Estado */}
              <Field label="Estado">
                <Select
                  value={filters.status}
                  onChange={(e) => onFilterChange("status", e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>

              {/* Filtro de Asesor */}
              {showAdvisorFilter && (
                <Field label="Asesor asignado">
                  <Select
                    value={filters.advisor_id}
                    onChange={(e) => onFilterChange("advisor_id", e.target.value)}
                  >
                    <option value="">Todos los asesores</option>
                    <option value="0">Sin asignar</option>
                    {advisors?.map((advisor) => (
                      <option key={advisor.id} value={advisor.id}>
                        {advisor.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {/* Filtro de Fecha Desde */}
              <Field label="Fecha desde">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netland-muted" />
                  <Input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => onFilterChange("date_from", e.target.value)}
                    className="!pl-9"
                  />
                </div>
              </Field>

              {/* Filtro de Fecha Hasta */}
              <Field label="Fecha hasta">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netland-muted" />
                  <Input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => onFilterChange("date_to", e.target.value)}
                    className="!pl-9"
                  />
                </div>
              </Field>
            </div>

            {/* Segunda fila de filtros */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Filtro de Origen (opcional) */}
              {showSourceFilter && (
                <Field label="Origen de captación">
                  <Select
                    value={filters.source || ""}
                    onChange={(e) => onFilterChange("source", e.target.value)}
                  >
                    <option value="">Todos los orígenes</option>
                    {sourceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}

              {/* Búsqueda */}
              <Field label="Buscar por nombre o teléfono">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-netland-muted" />
                  <Input
                    placeholder="Escribe para buscar..."
                    value={filters.search}
                    onChange={(e) => onFilterChange("search", e.target.value)}
                    className="!pl-9"
                  />
                </div>
              </Field>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
