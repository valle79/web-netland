import { AlertTriangle } from "lucide-react";

interface QueryErrorProps {
  title?: string;
  description?: string;
}

export function QueryError({
  title = "Error al cargar los datos",
  description = "No se pudieron cargar los datos. Vuelve a intentarlo en unos momentos.",
}: QueryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <p className="font-display text-lg font-semibold text-netland-dark">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-netland-muted">{description}</p>
      )}
    </div>
  );
}