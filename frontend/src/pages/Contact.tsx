import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { api } from "../lib/api";
import { whatsappLink } from "../lib/constants";
import type { Advisor, Project } from "../types";
import { Reveal } from "../components/Reveal";
import { useLeadForm } from "../features/leads/useLeadForm";
import { PageHero } from "./Projects";
import { CheckCircle2 } from "lucide-react";

export default function Contact() {
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/projects?published_only=true"),
  });
  const { data: advisors } = useQuery({
    queryKey: ["advisors"],
    queryFn: () => api.get<Advisor[]>("/advisors"),
  });
  const { submit, submitting, submitted } = useLeadForm();
  const [form, setForm] = useState({
    name: "",
    last_name: "",
    phone: "",
    email: "",
    project_id: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({
      name: form.name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email || null,
      project_id: form.project_id ? Number(form.project_id) : null,
      message: form.message,
      source: "contacto",
    });
  };

  return (
    <div>
      <PageHero
        title="Contacto"
        subtitle="Habla con un asesor, agenda una visita o resuelve todas tus dudas."
      />

      <section className="section-padding bg-netland-background">
        <div className="container-netland grid gap-14 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Reveal>
              <h2 className="mb-2 font-display text-3xl font-semibold text-netland-dark">
                Escríbenos
              </h2>
              <p className="mb-8 text-netland-muted">
                Completa el formulario y un asesor de Netland te contactará muy
                pronto.
              </p>
            </Reveal>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 rounded-lg bg-white py-16 text-center shadow-soft">
                <CheckCircle2 className="h-14 w-14 text-netland-primary" />
                <h3 className="font-display text-2xl font-semibold text-netland-dark">
                  ¡Mensaje enviado!
                </h3>
                <p className="max-w-sm text-sm text-netland-muted">
                  Gracias por contactarnos. Un asesor de Netland se comunicará
                  contigo a la brevedad.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-lg bg-white p-8 shadow-soft"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Nombre"
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                    placeholder="Tu nombre"
                    required
                  />
                  <Field
                    label="Apellidos"
                    value={form.last_name}
                    onChange={(v) => setForm({ ...form, last_name: v })}
                    placeholder="Tus apellidos"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Teléfono / WhatsApp"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                    placeholder="999 888 777"
                    required
                  />
                  <Field
                    label="Correo electrónico"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    placeholder="tucorreo@email.com"
                    type="email"
                  />
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
                    Proyecto de interés
                  </span>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary"
                  >
                    <option value="">Todos / No estoy seguro</option>
                    {projects?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.short_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
                    Mensaje
                  </span>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    placeholder="Cuéntanos qué buscas..."
                    className="w-full resize-none rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {submitting ? "Enviando..." : "Enviar mensaje"}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Reveal delay={100}>
              <div className="rounded-lg bg-netland-dark p-7 text-white">
                <h3 className="mb-5 font-display text-2xl font-semibold">
                  Contacto directo
                </h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-netland-accent" />
                    985 928 062
                  </li>
                  <li>
                    <a
                      href={whatsappLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp w-full"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp directo
                    </a>
                  </li>
                  <li className="flex items-start gap-3 pt-2 text-white/75">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-netland-accent" />
                    Cañete, Lima, Perú
                  </li>
                </ul>
              </div>
            </Reveal>

            {advisors && advisors.length > 0 && (
              <Reveal delay={180}>
                <div className="rounded-lg bg-white p-7 shadow-soft">
                  <h3 className="mb-5 font-display text-2xl font-semibold text-netland-dark">
                    Nuestro equipo
                  </h3>
                  <div className="space-y-4">
                    {advisors.map((advisor) => (
                      <div key={advisor.id} className="flex items-center gap-4">
                        {advisor.photo_url ? (
                          <img
                            src={advisor.photo_url}
                            alt={advisor.name}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-netland-light font-display text-xl font-semibold text-netland-primary">
                            {advisor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-netland-dark">{advisor.name}</p>
                          <p className="text-xs uppercase tracking-wider text-netland-muted">
                            {advisor.role_title}
                          </p>
                          <a
                            href={whatsappLink(
                              `Hola ${advisor.name.split(" ")[0]}, estoy interesado en los proyectos de Netland.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-netland-accent hover:underline"
                          >
                            Hablar con {advisor.name.split(" ")[0]}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary"
      />
    </label>
  );
}