import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { WhatsAppFloat } from "./components/layout/WhatsAppFloat";
import { PageLoader } from "./components/ui/PageLoader";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider } from "./features/admin/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));

const AdminLogin = lazy(() => import("./features/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./features/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./features/admin/pages/Dashboard"));
const AdminProjects = lazy(() => import("./features/admin/pages/Projects"));
const AdminProjectForm = lazy(() => import("./features/admin/pages/ProjectForm"));
const AdminLots = lazy(() => import("./features/admin/pages/Lots"));
const AdminPlan = lazy(() => import("./features/admin/pages/PlanEditor"));
const AdminPlanImport = lazy(() => import("./features/admin/pages/PlanImport"));
const AdminLeads = lazy(() => import("./features/admin/pages/Leads"));
const AdminAdvisors = lazy(() => import("./features/admin/pages/Advisors"));
const AdminPromotions = lazy(() => import("./features/admin/pages/Promotions"));
const AdminQuotes = lazy(() => import("./features/admin/pages/Quotes"));
const AdminVisits = lazy(() => import("./features/admin/pages/Visits"));
const AdminMedia = lazy(() => import("./features/admin/pages/Media"));
const AdminUsers = lazy(() => import("./features/admin/pages/Users"));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="proyectos" element={<AdminProjects />} />
            <Route path="proyectos/nuevo" element={<AdminProjectForm />} />
            <Route path="proyectos/:id/editar" element={<AdminProjectForm />} />
            <Route path="proyectos/:projectId/importar-plano" element={<AdminPlanImport />} />
            <Route path="lotes" element={<AdminLots />} />
            <Route path="plano/:projectId" element={<AdminPlan />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="asesores" element={<AdminAdvisors />} />
            <Route path="promociones" element={<AdminPromotions />} />
            <Route path="cotizaciones" element={<AdminQuotes />} />
            <Route path="visitas" element={<AdminVisits />} />
            <Route path="multimedia" element={<AdminMedia />} />
            <Route path="usuarios" element={<AdminUsers />} />
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/proyectos" element={<Projects />} />
            <Route path="/proyectos/:slug" element={<ProjectDetail />} />
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