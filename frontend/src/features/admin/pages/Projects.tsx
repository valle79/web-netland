import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2, Image, FileText, FileSpreadsheet, FileDown, Upload } from "lucide-react";
import { api } from "../../../lib/api";
import { API_URL } from "../../../lib/constants";
import type { Project } from "../../../types";
import { PageHeader, Button, Card, Badge, Table } from "../ui";
import { useToast } from "../../../components/ui/Toast";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useState } from "react";
import { FileUploader } from "../../../components/ui/FileUploader";

export default function AdminProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showExcelImport, setShowExcelImport] = useState<number | null>(null);
  const [showPlanUpload, setShowPlanUpload] = useState<number | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-admin"],
    queryFn: () => api.get<Project[]>("/projects"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/projects/${id}`, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-admin"] });
      toast("Proyecto eliminado.");
    },
    onError: (e) => toast(e.message, "error"),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, plan_pdf_url }: { id: number; plan_pdf_url: string }) =>
      api.put(`/projects/${id}`, { plan_pdf_url }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-admin"] });
      toast("PDF del plano actualizado correctamente");
      setShowPlanUpload(null);
    },
    onError: (e) => toast(e.message, "error"),
  });

  return (
    <div>
      <PageHeader
        title="Proyectos"
        subtitle="Administra los desarrollos inmobiliarios."
        action={
          <Link to="/admin/proyectos/nuevo">
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin proyectos"
            description="Crea tu primer proyecto inmobiliario."
          />
        </Card>
      ) : (
        <Table headers={["Proyecto", "Ubicación", "Lotes", "Disponibles", "Estado", "Acciones"]}>
          {projects.map((project) => (
            <tr key={project.id} className="hover:bg-netland-light/30">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-md"
                    style={{
                      backgroundColor: project.color_primary,
                      backgroundImage: project.hero_image
                        ? `url(${project.hero_image})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div>
                    <p className="font-semibold text-netland-dark">{project.short_name}</p>
                    <p className="text-xs text-netland-muted">/{project.slug}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-netland-muted">{project.location}</td>
              <td className="px-5 py-4">{project.lots_count}</td>
              <td className="px-5 py-4 font-semibold text-netland-primary">
                {project.available_count}
              </td>
              <td className="px-5 py-4">
                <Badge color={project.is_published ? "#16a34a" : "#9ca3af"}>
                  {project.is_published ? "Publicado" : "Oculto"}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/admin/proyectos/${project.id}/editar`}>
                    <Button variant="outline" className="!px-3 !py-2" title="Editar proyecto">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/admin/proyectos/${project.id}/galeria`}>
                    <Button variant="outline" className="!px-3 !py-2" title="Gestionar galería">
                      <Image className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to={`/admin/proyectos/${project.id}/documentos`}>
                    <Button variant="outline" className="!px-3 !py-2" title="Gestionar documentos">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="!px-3 !py-2"
                    onClick={() => setShowExcelImport(project.id)}
                    title="Importar lotes desde Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    className="!px-3 !py-2"
                    onClick={() => setShowPlanUpload(project.id)}
                    title="Gestionar PDF del plano"
                  >
                    <Upload className="h-4 w-4" />
                    Plano PDF
                    {project.plan_pdf_url && (
                      <span className="ml-1 inline-flex h-2 w-2 rounded-full bg-green-500" title="PDF cargado" />
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-3 !py-2"
                    onClick={() => {
                      if (confirm(`¿Eliminar el proyecto ${project.short_name}?`)) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Modal de Importar Excel */}
      {showExcelImport && (
        <ExcelImportModal
          projectId={showExcelImport}
          onClose={() => setShowExcelImport(null)}
          onSuccess={() => {
            setShowExcelImport(null);
            queryClient.invalidateQueries({ queryKey: ["projects-admin"] });
            toast("Lotes importados correctamente desde Excel");
          }}
        />
      )}

      {/* Modal de Gestionar Plano PDF */}
      {showPlanUpload && (
        <PlanPDFModal
          project={projects?.find(p => p.id === showPlanUpload)!}
          onClose={() => setShowPlanUpload(null)}
          onUpload={(url) => {
            updatePlanMutation.mutate({ id: showPlanUpload, plan_pdf_url: url });
          }}
        />
      )}
    </div>
  );
}

// Modal de Importación de Excel
function ExcelImportModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (file: File) => {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("netland_token");
      if (!token) {
        toast("Sesión expirada. Por favor inicia sesión nuevamente.", "error");
        return;
      }

      const response = await fetch(`${API_URL}/projects/${projectId}/import-excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Error desconocido" }));
        throw new Error(errorData.detail || "Error al importar Excel");
      }

      const data = await response.json();
      
      // Mostrar resultados detallados
      let message = "";
      if (data.imported > 0) {
        message = `✓ ${data.imported} lotes importados correctamente`;
      }
      
      if (data.warnings && data.warnings.length > 0) {
        console.warn("Advertencias de importación:", data.warnings);
        if (message) {
          message += ` (${data.warnings.length} advertencias en consola)`;
        } else {
          message = `⚠ ${data.warnings.length} advertencias encontradas. Ver consola para detalles.`;
        }
      }
      
      if (data.errors && data.errors.length > 0) {
        console.error("Errores de importación:", data.errors);
        if (data.imported === 0) {
          toast(`✗ ${data.errors.length} errores encontrados. Ver consola para detalles.`, "error");
        } else {
          toast(message + ` (${data.errors.length} errores en consola)`, "success");
        }
      } else if (message) {
        toast(message, "success");
      }
      
      if (data.imported > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error al importar:", error);
      toast(error.message || "Error al importar archivo Excel", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-netland-dark">
              Importar Lotes desde Excel
            </h2>
            <p className="mt-1 text-sm text-netland-muted">
              Sube un archivo Excel con los datos de los lotes del proyecto
            </p>
          </div>
          <Button variant="outline" className="!px-3 !py-2" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border-2 border-dashed border-netland-light bg-netland-light/30 p-6">
            <h3 className="mb-3 font-semibold text-netland-dark">Formato del Excel:</h3>
            <ul className="space-y-2 text-sm text-netland-muted">
              <li>• <strong>Columnas principales:</strong> MZ, N° DE LOTE, MzLt, AREA LOTE M2, Precio US $, ESTADO</li>
              <li>• <strong>MzLt:</strong> Código completo del lote (ej: A-01, B-10) - REQUERIDO</li>
              <li>• <strong>MZ:</strong> Manzana (ej: A, B, 1, 2)</li>
              <li>• <strong>AREA LOTE M2:</strong> Área en metros cuadrados</li>
              <li>• <strong>Precio US $:</strong> Precio en dólares</li>
              <li>• <strong>Estados válidos:</strong> disponible, reservado, vendido, separado, no disponible</li>
              <li>• <strong>Formato:</strong> .xlsx, .xls o .csv</li>
            </ul>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-netland-dark">
              Archivo Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              disabled={importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              className="w-full rounded-lg border border-netland-light px-4 py-3 text-sm outline-none focus:border-netland-primary disabled:opacity-50"
            />
          </div>

          {importing && (
            <div className="flex items-center justify-center gap-3 rounded-lg bg-netland-light/50 p-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-netland-primary border-t-transparent" />
              <span className="text-sm font-medium text-netland-dark">Importando lotes...</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <a
              href="/plantilla-lotes.xlsx"
              download
              className="flex-1"
            >
              <Button variant="outline" className="w-full">
                <FileDown className="h-4 w-4" />
                Descargar Plantilla
              </Button>
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Modal de Gestión de Plano PDF
function PlanPDFModal({
  project,
  onClose,
  onUpload,
}: {
  project: Project;
  onClose: () => void;
  onUpload: (url: string) => void;
}) {
  const { toast } = useToast();
  const currentPlanUrl = project.plan_pdf_url || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-netland-dark">
              Plano PDF - {project.short_name}
            </h2>
            <p className="mt-1 text-sm text-netland-muted">
              Sube el PDF del plano del proyecto para descargarlo cuando lo necesites
            </p>
          </div>
          <Button variant="outline" className="!px-3 !py-2" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          {/* Archivo actual */}
          {currentPlanUrl && (
            <div className="rounded-lg border border-netland-light bg-netland-light/30 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-netland-primary" />
                  <div>
                    <p className="font-semibold text-netland-dark">Plano actual</p>
                    <p className="text-xs text-netland-muted">PDF del plano del proyecto</p>
                  </div>
                </div>
                <a
                  href={currentPlanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  <Button variant="outline" className="!px-3 !py-2">
                    <FileDown className="h-4 w-4" />
                    Descargar
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Subir nuevo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-netland-dark">
              {currentPlanUrl ? "Reemplazar plano PDF" : "Subir plano PDF"}
            </label>
            <FileUploader
              accept=".pdf"
              folder="plans"
              maxSizeMB={50}
              hint="PDF hasta 50MB"
              preview={false}
              onUploadComplete={(url) => {
                onUpload(url);
                toast("PDF del plano subido correctamente", "success");
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}