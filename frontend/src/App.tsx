import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { WhatsAppFloat } from "./components/layout/WhatsAppFloat";
import { PageLoader } from "./components/ui/PageLoader";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider, useAuth } from "./features/admin/AuthContext";

const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"];
const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { user } = useAuth();
  const role = (user?.role ?? "").toUpperCase();
  if (!roles.includes(role)) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Advisors = lazy(() => import("./pages/Advisors"));
const ReferAndEarn = lazy(() => import("./pages/ReferAndEarn"));

const AdminLogin = lazy(() => import("./features/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./features/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./features/admin/pages/Dashboard"));
const AdminProjects = lazy(() => import("./features/admin/pages/Projects"));
const AdminProjectForm = lazy(() => import("./features/admin/pages/ProjectForm"));
const AdminProjectGallery = lazy(() => import("./features/admin/pages/ProjectGallery"));
const AdminProjectDocuments = lazy(() => import("./features/admin/pages/ProjectDocuments"));
const AdminLots = lazy(() => import("./features/admin/pages/Lots"));
const AdminLeads = lazy(() => import("./features/admin/pages/Leads"));
const AdminCapturedClients = lazy(() =>
  import("./features/admin/pages/CapturedClients")
);
const AdminAdvisors = lazy(() => import("./features/admin/pages/Advisors"));
const AdminPromotions = lazy(() => import("./features/admin/pages/Promotions"));
const AdminQuotes = lazy(() => import("./features/admin/pages/Quotes"));
const AdminVisits = lazy(() => import("./features/admin/pages/Visits"));
const AdminMedia = lazy(() => import("./features/admin/pages/Media"));
const AdminUsers = lazy(() => import("./features/admin/pages/Users"));
const AdminSiteSettings = lazy(() => import("./features/admin/pages/SiteSettings"));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route
              path="proyectos"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminProjects />
                </RequireRole>
              }
            />
            <Route
              path="proyectos/nuevo"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminProjectForm />
                </RequireRole>
              }
            />
            <Route
              path="proyectos/:id/editar"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminProjectForm />
                </RequireRole>
              }
            />
            <Route
              path="proyectos/:id/galeria"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminProjectGallery />
                </RequireRole>
              }
            />
            <Route
              path="proyectos/:id/documentos"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminProjectDocuments />
                </RequireRole>
              }
            />
            <Route path="lotes" element={<AdminLots />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="clientes-captados" element={<AdminCapturedClients />} />
            <Route
              path="asesores"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminAdvisors />
                </RequireRole>
              }
            />
            <Route
              path="promociones"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminPromotions />
                </RequireRole>
              }
            />
            <Route path="cotizaciones" element={<AdminQuotes />} />
            <Route path="visitas" element={<AdminVisits />} />
            <Route
              path="multimedia"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminMedia />
                </RequireRole>
              }
            />
            <Route
              path="configuracion"
              element={
                <RequireRole roles={ADMIN_ROLES}>
                  <AdminSiteSettings />
                </RequireRole>
              }
            />
            <Route
              path="usuarios"
              element={
                <RequireRole roles={SUPER_ADMIN_ROLES}>
                  <AdminUsers />
                </RequireRole>
              }
            />
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/proyectos" element={<Projects />} />
            <Route path="/proyectos/:slug" element={<ProjectDetail />} />
            <Route path="/asesores" element={<Advisors />} />
            <Route path="/refiere-y-gana" element={<ReferAndEarn />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/nosotros" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
    </ToastProvider>
  );
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}