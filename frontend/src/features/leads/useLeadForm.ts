import { useState } from "react";
import { api } from "../../lib/api";
import type { LeadInput } from "../../types";

interface LeadFormData {
  name: string;
  last_name?: string;
  phone: string;
  email?: string | null;
  message?: string;
  project_id?: number | null;
  lot_id?: number | null;
  budget?: number | null;
  source?: string;
}

export function useLeadForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: LeadFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload: LeadInput = {
        name: data.name,
        last_name: data.last_name ?? "",
        phone: data.phone,
        whatsapp: data.phone,
        email: data.email || null,
        project_id: data.project_id ?? null,
        lot_id: data.lot_id ?? null,
        budget: data.budget ?? null,
        source: data.source ?? "web",
        message: data.message ?? "",
      };
      await api.post("/leads", payload);
      setSubmitted(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar la solicitud.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting, submitted, error };
}