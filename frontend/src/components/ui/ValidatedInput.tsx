import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  validateField,
  type ValidationType,
} from "../../lib/validations";

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: ValidationType;
  placeholder?: string;
  inputType?: string;
  required?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  wrapperClassName?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ValidatedInput({
  label,
  value,
  onChange,
  type,
  placeholder,
  inputType,
  required = false,
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",
  wrapperClassName = "",
  icon: Icon,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (newValue: string) => {
    if (type === "phone") {
      const digits = newValue.replace(/\D/g, "");
      if (digits.length > 9) return;
      newValue = digits;
    }
    onChange(newValue);
    if (touched) {
      setError(validateField(type, newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateField(type, value));
  };

  return (
    <label className={`block ${wrapperClassName}`}>
      <span
        className={`mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted ${labelClassName}`}
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-netland-muted">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          type={inputType ?? (type === "email" ? "email" : "text")}
          inputMode={type === "phone" ? "tel" : undefined}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full rounded-sm border bg-netland-background px-4 py-3 text-sm outline-none transition-colors ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-netland-light focus:border-netland-primary"
          } ${inputClassName}`}
        />
      </div>
      {error && (
        <span
          className={`mt-1 flex items-center gap-1 text-xs text-red-500 ${errorClassName}`}
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}
