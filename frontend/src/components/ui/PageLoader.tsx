import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-netland-background">
      <div className="flex flex-col items-center gap-3 text-netland-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-xs uppercase tracking-[0.3em]">Netland</span>
      </div>
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}