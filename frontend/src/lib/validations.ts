export type ValidationType = "phone" | "name" | "email";

export function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "El teléfono es obligatorio";
  if (!digits.startsWith("9")) return "El teléfono debe empezar con 9";
  if (digits.length !== 9) return "El teléfono debe tener 9 dígitos";
  return null;
}

export function validateName(value: string): string | null {
  if (!value.trim()) return "Este campo es obligatorio";
  if (/\d/.test(value)) return "No puede contener números";
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Ingrese un correo válido";
  return null;
}

export function validateField(
  type: ValidationType,
  value: string
): string | null {
  switch (type) {
    case "phone":
      return validatePhone(value);
    case "name":
      return validateName(value);
    case "email":
      return validateEmail(value);
  }
}
