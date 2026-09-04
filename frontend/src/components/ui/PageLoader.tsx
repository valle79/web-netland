import { Loader2 } from "lucide-react";
import { CoreSpinLoader } from "./CoreSpinLoader";

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-netland-background">
      <CoreSpinLoader />
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}