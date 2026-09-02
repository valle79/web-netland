import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
} from "lucide-react";

export type AlertType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading";

export interface AlertOptions {
  title?: string;
  duration?: number;
}

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface AlertData {
  id: number;
  type: AlertType;
  message: string;
  title?: string;
  duration: number;
}

export interface ToastApi {
  (message: string, type?: AlertType): void;
  (
    message: string,
    options?: AlertOptions & { type?: AlertType }
  ): void;
  success(message: string, options?: AlertOptions): void;
  error(message: string, options?: AlertOptions): void;
  info(message: string, options?: AlertOptions): void;
  warning(message: string, options?: AlertOptions): void;
  loading(message: string, options?: AlertOptions): number;
  dismiss(id: number): void;
  confirm(options: ConfirmOptions | string): Promise<boolean>;
}

interface AlertContextValue {
  toast: ToastApi;
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

interface ConfirmationState extends ConfirmOptions {
  resolve: (approved: boolean) => void;
}

const DEFAULT_DURATION: Record<AlertType, number> = {
  success: 3500,
  error: 6000,
  info: 4500,
  warning: 4500,
  loading: 8000,
};

const ALERT_ICONS: Record<AlertType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

const ACCENT_STYLES: Record<AlertType, string> = {
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  info: "border-l-sky-500",
  warning: "border-l-amber-500",
  loading: "border-l-netland-primary",
};

const ICON_STYLES: Record<AlertType, string> = {
  success: "bg-emerald-50 text-emerald-600",
  error: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  warning: "bg-amber-50 text-amber-600",
  loading: "bg-netland-light text-netland-primary",
};

const PROGRESS_STYLES: Record<
  AlertType,
  { className: string; color: string }
> = {
  success: { className: "bg-emerald-500", color: "#10b981" },
  error: { className: "bg-red-500", color: "#ef4444" },
  info: { className: "bg-sky-500", color: "#0ea5e9" },
  warning: { className: "bg-amber-500", color: "#f59e0b" },
  loading: {
    className: "bg-netland-primary",
    color: "var(--netland-primary)",
  },
};

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [confirmation, setConfirmation] =
    useState<ConfirmationState | null>(null);

  const dismiss = useCallback((id: number) => {
    setAlerts((items) => items.filter((item) => item.id !== id));
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions | string) =>
      new Promise<boolean>((resolve) => {
        setConfirmation({
          ...(typeof options === "string"
            ? { message: options }
            : options),
          resolve,
        });
      }),
    []
  );

  const resolveConfirm = useCallback(
    (approved: boolean) => {
      confirmation?.resolve(approved);
      setConfirmation(null);
    },
    [confirmation]
  );

  const push = useCallback(
    (message: string, type: AlertType, options?: AlertOptions) => {
      const id = Date.now() + Math.random();
      const duration = options?.duration ?? DEFAULT_DURATION[type];

      setAlerts((items) => [
        ...items,
        { id, type, message, title: options?.title, duration },
      ]);

      window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo<ToastApi>(() => {
    const show = ((
      message: string,
      options?: AlertType | (AlertOptions & { type?: AlertType })
    ) => {
      if (typeof options === "string") {
        push(message, options);
      } else {
        push(message, options?.type ?? "success", options);
      }
    }) as ToastApi;

    show.success = (message, options) => push(message, "success", options);
    show.error = (message, options) => push(message, "error", options);
    show.info = (message, options) => push(message, "info", options);
    show.warning = (message, options) => push(message, "warning", options);
    show.loading = (message, options) => push(message, "loading", options);
    show.dismiss = dismiss;
    show.confirm = confirm;

    return show;
  }, [push, dismiss, confirm]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <AlertContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-3 sm:right-5 sm:top-5"
      >
        {alerts.map((alert) => {
          const Icon = ALERT_ICONS[alert.type];
          const progress = PROGRESS_STYLES[alert.type];

          return (
            <div
              key={alert.id}
              role="alert"
              className={`animate-alert-in pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border border-l-4 border-netland-muted/15 bg-white p-4 pr-9 shadow-soft ${ACCENT_STYLES[alert.type]}`}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_STYLES[alert.type]}`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    alert.type === "loading" ? "animate-spin" : ""
                  }`}
                />
              </span>

              <p className="min-w-0 flex-1">
                {alert.title && (
                  <span className="block text-sm font-semibold text-netland-dark">
                    {alert.title}
                  </span>
                )}
                <span
                  className={`block text-sm ${
                    alert.title
                      ? "text-netland-muted"
                      : "font-medium text-netland-dark"
                  }`}
                >
                  {alert.message}
                </span>
              </p>

              <button
                type="button"
                aria-label="Cerrar alerta"
                onClick={() => dismiss(alert.id)}
                className="absolute right-2.5 top-2.5 rounded-md p-1 text-netland-muted transition-colors hover:bg-netland-light hover:text-netland-dark"
              >
                <X className="h-4 w-4" />
              </button>

              <span
                className={`animate-alert-progress absolute inset-x-0 bottom-0 h-0.5 ${progress.className}`}
                style={{
                  animationDuration: `${alert.duration}ms`,
                  backgroundColor: progress.color,
                }}
              />
            </div>
          );
        })}
      </div>

      {confirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmation.title ?? "Confirmar acción"}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-netland-dark/50 p-4 backdrop-blur-sm"
          onClick={() => resolveConfirm(false)}
        >
          <div
            className="animate-fadeUp w-full max-w-sm rounded-2xl border border-netland-muted/15 bg-white p-6 shadow-lift"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  confirmation.danger === false
                    ? "bg-netland-light text-netland-primary"
                    : "bg-red-50 text-red-600"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-netland-dark">
                  {confirmation.title ??
                    "¿Estás seguro?"}
                </h3>

                <p className="mt-1 whitespace-pre-line text-sm text-netland-muted">
                  {confirmation.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="rounded-lg border border-netland-muted/20 px-4 py-2 text-sm font-medium text-netland-dark transition-colors hover:bg-netland-light"
              >
                {confirmation.cancelText ?? "Cancelar"}
              </button>

              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  confirmation.danger === false
                    ? "bg-netland-primary hover:bg-netland-primaryDark"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmation.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert debe usarse dentro de AlertProvider");
  }
  return ctx;
}