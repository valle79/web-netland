import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <SearchX className="h-10 w-10 text-netland-muted" />
      <p className="font-display text-lg font-semibold text-netland-dark">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-netland-muted">{description}</p>
      )}
    </div>
  );
}