import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-white p-6 shadow-soft ${className}`}>{children}</div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold text-netland-dark">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-netland-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "outline" | "danger" | "whatsapp";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60";
  const variants = {
    primary: "bg-netland-primary text-white hover:bg-netland-primaryDark",
    outline: "border border-netland-light text-netland-dark hover:border-netland-primary hover:text-netland-primary",
    danger: "bg-red-600 text-white hover:bg-red-700",
    whatsapp: "bg-[#25D366] text-white hover:opacity-90",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ children, color = "#16a34a" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "#14532d",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-netland-muted">
          {label}
        </p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}15`, color: accent }}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-4xl font-semibold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-netland-muted">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-sm border border-netland-light bg-netland-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-netland-primary";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} resize-y ${props.className ?? ""}`} />;
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-soft">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-netland-light bg-netland-light/50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-netland-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-netland-light">{children}</tbody>
      </table>
    </div>
  );
}