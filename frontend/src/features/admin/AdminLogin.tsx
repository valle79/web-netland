import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Lock, LogIn } from "lucide-react";
import { Logo } from "../../components/Logo";
import { useAuth } from "./AuthContext";
import { Spinner } from "../../components/ui/PageLoader";

export default function AdminLogin() {
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-netland-dark p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo light size="md" />
        </div>
        <div className="rounded-lg bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-netland-light text-netland-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-netland-dark">
                Panel administrativo
              </h1>
              <p className="text-xs uppercase tracking-wider text-netland-muted">
                Acceso restringido
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
                Correo
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary"
                placeholder="admin@netlandcorp.com"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-netland-muted">
                Contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-sm border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none focus:border-netland-primary"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? <Spinner className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-netland-muted">
            Acceso exclusivo para el equipo de Netland.
          </p>
        </div>
      </div>
    </div>
  );
}