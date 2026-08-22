export const API_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api";

export const WHATSAPP_NUMBER: string =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string) || "51985928062";

export const whatsappLink = (
  message = "Hola Luis, estoy interesado en conocer los lotes disponibles de Netland."
) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const formatSoles = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return `S/ ${value.toLocaleString("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const formatArea = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : `${value} m²`;

export const LOT_STATUS_LABELS: Record<string, string> = {
  available: "DISPONIBLE",
  reserved: "RESERVADO",
  sold: "VENDIDO",
  not_available: "NO DISPONIBLE",
};

export const LOT_STATUS_COLORS: Record<string, string> = {
  available: "#16a34a",
  reserved: "#eab308",
  sold: "#dc2626",
  not_available: "#9ca3af",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "NUEVO",
  contacted: "CONTACTADO",
  interested: "INTERESADO",
  visit_scheduled: "VISITA PROGRAMADA",
  negotiation: "NEGOCIACIÓN",
  reserved: "RESERVADO",
  sold: "VENDIDO",
  discarded: "DESCARTADO",
};

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "visit_scheduled",
  "negotiation",
  "reserved",
  "sold",
  "discarded",
];

export const lotWhatsappMessage = (
  projectName: string,
  lotCode: string,
  price?: number | null
) =>
  `Hola Luis, estoy interesado en el lote ${lotCode} de ${projectName}${
    price ? ` con precio de S/ ${price.toLocaleString("es-PE")}` : ""
  }.`;

export const CAPTURED_SOURCES = ["campo", "llamada", "referido", "whatsapp"] as const;

export const CAPTURED_SOURCE_LABELS: Record<string, string> = {
  campo: "EN CAMPO",
  llamada: "LLAMADA",
  referido: "REFERIDO",
  whatsapp: "WHATSAPP",
};

export const CAPTURED_SOURCE_COLORS: Record<string, string> = {
  campo: "#0d9488",
  llamada: "#4f46e5",
  referido: "#db2777",
  whatsapp: "#16a34a",
};