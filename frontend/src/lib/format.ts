// Evita el desfase de 1 día al renderizar fechas puras "YYYY-MM-DD":
// new Date("2026-09-17") se interpreta como medianoche UTC y en zonas
// como Perú (UTC-5) se mostraría como 16/09. Se parsea en hora local.
export const parseDate = (dateString: string): Date => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateString);
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "—";
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateLong = (dateString: string | undefined | null): string => {
  if (!dateString) return "—";
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};