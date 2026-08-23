import { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { Logo } from "../../components/Logo";
import logoNetland from "../../images/logo-netland.png";
import { useAuth } from "./AuthContext";
import { Spinner } from "../../components/ui/PageLoader";

import loginImage from "../../images/casacampo.jpg";

export default function AdminLogin() {
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">

{/* =====================================================
    PANEL IZQUIERDO - IMAGEN
====================================================== */}
<section className="relative hidden min-h-screen overflow-hidden lg:block">

  {/* Imagen */}
  <img
    src={loginImage}
    alt="Proyecto inmobiliario Netland"
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* Gradiente suave */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#0d7a44]/20 via-transparent to-[#063d27]/15" />

  {/* Contenido sobre la imagen */}
  <div className="relative z-10 flex min-h-screen flex-col justify-between p-10 xl:p-14">

    {/* Logo */}
    <div>
      <Logo light size="md" />
    </div>

    {/* Mensaje */}
    <div className="max-w-xl text-white">

      <div className="mb-6 flex items-center gap-3">
        <div className="h-px w-12 bg-[#f5a623]" />

        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f5a623]">
          Netland Corporación Inmobiliaria
        </span>
      </div>

      <h1 className="font-display text-5xl font-semibold leading-[1.08] xl:text-6xl">
        Construimos espacios
        <span className="block text-[#f5a623]">
          para tu futuro.
        </span>
      </h1>

      <p className="mt-6 max-w-lg text-base leading-7 text-white/85">
        Gestiona proyectos, lotes, clientes y disponibilidad
        desde el centro administrativo de Netland.
      </p>

      <div className="mt-8 flex items-center gap-3 text-sm text-white/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <ShieldCheck className="h-4 w-4" />
        </div>

        <span>
          Plataforma segura para la gestión inmobiliaria
        </span>
      </div>

    </div>

    {/* Pie */}
    <div className="flex items-center justify-between border-t border-white/15 pt-6 text-xs text-white/60">
      <span>
        © {new Date().getFullYear()} Netland
      </span>

      <span>
        Cañete, Lima, Perú
      </span>
    </div>

  </div>

</section>


      {/* =====================================================
          PANEL DERECHO - LOGIN
      ====================================================== */}
      <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-16 xl:px-24">

        <div className="w-full max-w-md">

{/* Logo móvil */}
<div className="mb-10 flex justify-center">
  <img
    src={logoNetland}
    alt="NETLAND Corporación Inmobiliaria"
    className="h-auto w-32 object-contain"
  />
</div>


          {/* Encabezado */}
          <div className="mb-10 text-center">

            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.25em]"
              style={{
                color: "var(--netland-primary)",
              }}
            >
              Administración
            </p>

            <h2
              className="font-display text-3xl font-semibold tracking-tight"
              style={{
                color: "var(--netland-dark)",
              }}
            >
              Bienvenido de nuevo
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ingresa a tu cuenta para administrar los proyectos
              y operaciones de Netland.
            </p>
          </div>


          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

              <p>{error}</p>
            </div>
          )}


          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* CORREO */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
                style={{
                  color: "var(--netland-text)",
                }}
              >
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@netlandcorp.com"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0d7a44] focus:bg-white focus:ring-4 focus:ring-[#0d7a44]/10"
              />
            </div>


            {/* CONTRASEÑA */}
            <div>
              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{
                    color: "var(--netland-text)",
                  }}
                >
                  Contraseña
                </label>

              </div>

              <div className="relative">

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#0d7a44] focus:bg-white focus:ring-4 focus:ring-[#0d7a44]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:text-[#0d7a44]"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>
            </div>


            {/* BOTÓN */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl px-5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              style={{
                backgroundColor: "var(--netland-primary)",
              }}
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />

                  <span>Ingresar al panel</span>

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

          </form>


          {/* Seguridad */}
          <div className="mt-10 border-t border-slate-100 pt-6">

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">

              <ShieldCheck className="h-4 w-4 text-[#0d7a44]" />

              <span>
                Acceso protegido y exclusivo para el equipo de Netland
              </span>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}