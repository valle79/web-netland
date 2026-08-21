import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Video, Info, Upload } from "lucide-react";
import { api } from "../../../lib/api";
import { useToast } from "../../../components/ui/Toast";
import { Skeleton } from "../../../components/ui/Skeleton";
import { FileUploader } from "../../../components/ui/FileUploader";

interface SiteConfig {
  [key: string]: string;
}

const VIDEO_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\ w-]{11})/;

function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadMethod, setUploadMethod] = useState<"youtube" | "upload">("youtube");

  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["admin-config"],
    queryFn: () => api.get("/config", true),
  });

  const [formData, setFormData] = useState<SiteConfig>({});

  const updateMutation = useMutation({
    mutationFn: (data: SiteConfig) => api.put("/config", data, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
      queryClient.invalidateQueries({ queryKey: ["public-config"] });
      toast("Configuración actualizada correctamente", "success");
    },
    onError: () => {
      toast("Error al actualizar la configuración", "error");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleVideoUpload = (url: string) => {
    handleChange("hero_video_url", url);
    toast("Video subido correctamente", "success");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const currentConfig = { ...config, ...formData };
  const videoId = extractVideoId(currentConfig.hero_video_url || "");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-netland-dark">Configuración del sitio</h1>
        <p className="mt-2 text-netland-muted">
          Configura el video hero principal y otros ajustes del sitio web público.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Video Hero Section */}
        <div className="rounded-xl border border-netland-light bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-netland-primary/10">
              <Video className="h-5 w-5 text-netland-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-netland-dark">Video Hero Principal</h2>
              <p className="text-sm text-netland-muted">
                Video destacado en la página de inicio
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Método de carga */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-netland-dark">
                Método de carga
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUploadMethod("youtube")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    uploadMethod === "youtube"
                      ? "border-netland-primary bg-netland-primary/5 text-netland-primary"
                      : "border-netland-light bg-white text-netland-muted hover:border-netland-primary/30"
                  }`}
                >
                  <Video className="mx-auto mb-2 h-5 w-5" />
                  YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("upload")}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all ${
                    uploadMethod === "upload"
                      ? "border-netland-primary bg-netland-primary/5 text-netland-primary"
                      : "border-netland-light bg-white text-netland-muted hover:border-netland-primary/30"
                  }`}
                >
                  <Upload className="mx-auto mb-2 h-5 w-5" />
                  Subir video
                </button>
              </div>
            </div>

            {uploadMethod === "youtube" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-netland-dark">
                    URL del video de YouTube
                  </label>
                  <input
                    type="url"
                    value={currentConfig.hero_video_url || ""}
                    onChange={(e) => handleChange("hero_video_url", e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none transition-colors focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
                  />
                  <p className="mt-2 flex items-start gap-2 text-xs text-netland-muted">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Pega la URL completa de YouTube. Ejemplo: https://www.youtube.com/watch?v=dQw4w9WgXcQ
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-semibold text-netland-dark">
                  Subir video desde tu PC
                </label>
                <FileUploader
                  accept="video/*"
                  folder="site/hero"
                  onUploadComplete={(url) => handleVideoUpload(url)}
                  maxSizeMB={100}
                  label="Arrastra tu video aquí o haz clic para seleccionar"
                  hint="Formatos: MP4, WebM, MOV. Máximo 100MB. El video se subirá a Cloudinary."
                  preview={false}
                />
                <p className="mt-2 flex items-start gap-2 text-xs text-netland-muted">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    El video se subirá a Cloudinary y se guardará la URL automáticamente. Recomendamos videos cortos (30-60 segundos) para mejor rendimiento.
                  </span>
                </p>
                {currentConfig.hero_video_url && !videoId && (
                  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-semibold text-green-800">Video cargado desde Cloudinary</p>
                    <p className="mt-1 truncate text-xs text-green-600">{currentConfig.hero_video_url}</p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-netland-dark">
                Título del video (opcional)
              </label>
              <input
                type="text"
                value={currentConfig.hero_video_title || ""}
                onChange={(e) => handleChange("hero_video_title", e.target.value)}
                placeholder="Descubre Netland"
                className="w-full rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none transition-colors focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
              />
            </div>

            {/* Video Preview */}
            {videoId ? (
              <div className="rounded-lg border border-netland-light bg-netland-background p-4">
                <p className="mb-3 text-sm font-semibold text-netland-dark">Vista previa (YouTube):</p>
                <div className="aspect-video overflow-hidden rounded-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?modestbranding=1`}
                    title="Video preview"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : currentConfig.hero_video_url && currentConfig.hero_video_url.includes("cloudinary") ? (
              <div className="rounded-lg border border-netland-light bg-netland-background p-4">
                <p className="mb-3 text-sm font-semibold text-netland-dark">Vista previa (Cloudinary):</p>
                <div className="aspect-video overflow-hidden rounded-lg bg-black">
                  <video
                    src={currentConfig.hero_video_url}
                    controls
                    className="h-full w-full"
                    preload="metadata"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Company Info Section */}
        <div className="rounded-xl border border-netland-light bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-netland-dark">Información de la empresa</h2>
            <p className="text-sm text-netland-muted">
              Información legal y de contacto
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-netland-dark">
                Información legal
              </label>
              <textarea
                value={currentConfig.company_legal_info || ""}
                onChange={(e) => handleChange("company_legal_info", e.target.value)}
                rows={3}
                placeholder="RUC, razón social, etc."
                className="w-full rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none transition-colors focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-netland-dark">
                  Horarios de atención
                </label>
                <input
                  type="text"
                  value={currentConfig.company_schedules || ""}
                  onChange={(e) => handleChange("company_schedules", e.target.value)}
                  placeholder="Lun - Vie: 9am - 6pm"
                  className="w-full rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none transition-colors focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-netland-dark">
                  Facebook
                </label>
                <input
                  type="url"
                  value={currentConfig.company_facebook || ""}
                  onChange={(e) => handleChange("company_facebook", e.target.value)}
                  placeholder="https://facebook.com/netland"
                  className="w-full rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none transition-colors focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-netland-dark">
                  Instagram
                </label>
                <input
                  type="url"
                  value={currentConfig.company_instagram || ""}
                  onChange={(e) => handleChange("company_instagram", e.target.value)}
                  placeholder="https://instagram.com/netland"
                  className="w-full rounded-lg border border-netland-light bg-netland-background px-4 py-3 text-sm outline-none transition-colors focus:border-netland-primary focus:ring-2 focus:ring-netland-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-netland-primary px-6 py-3 font-semibold text-white transition-all hover:bg-netland-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
