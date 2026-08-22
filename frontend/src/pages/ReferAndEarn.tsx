import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Gift, Handshake, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "../components/Reveal";
import { useLeadForm } from "../features/leads/useLeadForm";

const benefits = [
  {
    icon: Gift,
    title: "Un beneficio por recomendar",
    text: "Cuando tu referido avance con Netland, nuestro equipo te contactará para coordinar tu beneficio.",
  },
  {
    icon: Handshake,
    title: "Acompañamiento cercano",
    text: "Cuidamos la experiencia de la persona que recomiendas desde el primer contacto.",
  },
  {
    icon: ShieldCheck,
    title: "Proceso transparente",
    text: "Registramos cada recomendación y te mantenemos informado de forma clara y responsable.",
  },
];

export default function ReferAndEarn() {
  const { submit, submitting, submitted, error } = useLeadForm();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    referrerName: "",
    referrerPhone: "",
    name: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
    consent: false,
  });

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = [
      "Programa Refiere y gana",
      `Referente: ${form.referrerName}`,
      `Contacto del referente: ${form.referrerPhone}`,
      form.notes ? `Interés comentado: ${form.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await submit({
      name: form.name,
      last_name: form.lastName,
      phone: form.phone,
      email: form.email || null,
      message,
      source: "referido",
    });
  };

  const canContinue = form.referrerName.trim().length >= 2 && form.referrerPhone.trim().length >= 6;

  return (
    <div>
      <section className="relative overflow-hidden bg-netland-dark pb-20 pt-36 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(245,166,35,0.22),transparent_32%),linear-gradient(120deg,#0b1624_0%,#0d7a44_100%)]" />
        <div className="container-netland relative z-10 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <Reveal>
            <p className="eyebrow !text-netland-accent">Una recomendación que sí importa</p>
            <h1 className="max-w-3xl text-balance font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
              Comparte una buena oportunidad. <span className="text-netland-accent">Gana con ella.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
              Recomienda a alguien que busca invertir o encontrar un lugar para vivir en Cañete. Nosotros nos encargamos de acompañarlo con la atención que merece.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div className="border-l border-white/25 pl-6 lg:mb-3">
              <Sparkles className="mb-4 h-8 w-8 text-netland-accent" />
              <p className="font-display text-2xl font-semibold">Tu confianza abre nuevas historias.</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">Déjanos los datos y un asesor se pondrá en contacto con tu referido.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-padding bg-netland-background">
        <div className="container-netland grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Reveal>
              <p className="eyebrow">El programa</p>
              <h2 className="font-display text-4xl font-semibold text-netland-dark">Recomendar también es construir comunidad.</h2>
              <p className="mt-5 leading-relaxed text-netland-muted">Comparte los datos de una persona interesada y nuestro equipo la atenderá de manera personalizada. Si la recomendación se concreta, coordinaremos contigo el beneficio correspondiente.</p>
            </Reveal>
            <div className="mt-10 space-y-7">
              {benefits.map(({ icon: Icon, title, text }, index) => (
                <Reveal key={title} delay={index * 90}>
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-netland-accent/15 text-netland-accent"><Icon className="h-5 w-5" /></div>
                    <div><h3 className="font-display text-lg font-semibold text-netland-dark">{title}</h3><p className="mt-1 text-sm leading-relaxed text-netland-muted">{text}</p></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={120}>
            <div className="rounded-xl bg-white p-7 shadow-lift sm:p-10">
              {submitted ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-netland-primary/10 text-netland-primary"><Check className="h-8 w-8" /></div>
                  <h2 className="mt-6 font-display text-3xl font-semibold text-netland-dark">Recomendación recibida</h2>
                  <p className="mt-3 max-w-sm leading-relaxed text-netland-muted">Gracias por confiar en Netland. Un asesor se pondrá en contacto con tu referido muy pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex items-center gap-3" aria-label={`Paso ${step} de 2`}>
                    {[1, 2].map((item) => (
                      <div key={item} className="flex flex-1 items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step >= item ? "bg-netland-primary text-white" : "bg-netland-light text-netland-muted"}`}>{step > item ? <Check className="h-4 w-4" /> : item}</div>
                        <span className={`hidden text-xs font-bold uppercase tracking-wider sm:block ${step >= item ? "text-netland-primary" : "text-netland-muted"}`}>{item === 1 ? "Tu información" : "Tu referido"}</span>
                        {item < 2 && <div className={`h-px flex-1 ${step > item ? "bg-netland-primary" : "bg-netland-light"}`} />}
                      </div>
                    ))}
                  </div>

                  {step === 1 ? (
                    <div className="space-y-7">
                      <div><p className="eyebrow">Paso 1 de 2</p><h2 className="font-display text-2xl font-semibold text-netland-dark">Cuéntanos quién eres</h2><p className="mt-1 text-sm text-netland-muted">Usaremos estos datos para reconocer tu recomendación.</p></div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Input label="Tu nombre" value={form.referrerName} onChange={(value) => update("referrerName", value)} required placeholder="Nombre completo" />
                        <Input label="Tu WhatsApp" value={form.referrerPhone} onChange={(value) => update("referrerPhone", value)} required placeholder="999 888 777" type="tel" />
                      </div>
                      <button type="button" onClick={() => canContinue && setStep(2)} disabled={!canContinue} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">Continuar <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <div><p className="eyebrow">Paso 2 de 2</p><h2 className="font-display text-2xl font-semibold text-netland-dark">Presenta a tu referido</h2><p className="mt-1 text-sm text-netland-muted">Lo contactaremos con cuidado y sin compromiso.</p></div>
                      <div className="rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm"><span className="text-netland-muted">Recomendado por </span><strong className="text-netland-dark">{form.referrerName}</strong></div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Input label="Nombre" value={form.name} onChange={(value) => update("name", value)} required placeholder="Nombre" />
                        <Input label="Apellidos" value={form.lastName} onChange={(value) => update("lastName", value)} placeholder="Apellidos" />
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Input label="WhatsApp" value={form.phone} onChange={(value) => update("phone", value)} required placeholder="999 888 777" type="tel" />
                        <Input label="Correo electrónico" value={form.email} onChange={(value) => update("email", value)} placeholder="correo@ejemplo.com" type="email" />
                      </div>
                      <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">¿Qué está buscando?</span><textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} placeholder="Proyecto, lote o tipo de inversión" className="w-full resize-none rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary" /></label>
                      <label className="flex items-start gap-3 text-sm text-netland-muted"><input type="checkbox" checked={form.consent} onChange={(event) => update("consent", event.target.checked)} required className="mt-1 h-4 w-4 accent-netland-primary" /><span>Confirmo que cuento con autorización para compartir estos datos.</span></label>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button type="button" onClick={() => setStep(1)} className="btn-outline !border-netland-primary !text-netland-primary sm:w-1/3"><ArrowLeft className="h-4 w-4" /> Atrás</button>
                        <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">{submitting ? "Enviando recomendación..." : "Enviar recomendación"}</button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="w-full rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary" /></label>;
}
