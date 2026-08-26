import { useRef, useState } from "react";
import {
  Upload,
  X,
  Image,
  Video,
  FileText,
  Loader2,
} from "lucide-react";

import { useToast } from "./Toast";
import { authStorage } from "../../lib/api";
import { API_URL } from "../../lib/constants";

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  folder?: string;
  onUploadComplete?: (url: string, publicId?: string) => void;
  onUploadMultipleComplete?: (
    files: Array<{
      url: string;
      publicId: string;
      filename: string;
    }>
  ) => void;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  preview?: boolean;
  currentUrl?: string;
  disabled?: boolean;
}

interface UploadedFile {
  url: string;
  public_id: string;
  filename: string;
  resource_type?: string;
}

export function FileUploader({
  accept = "image/*,video/*,.pdf,.doc,.docx",
  multiple = false,
  folder = "projects",
  onUploadComplete,
  onUploadMultipleComplete,
  maxSizeMB = 10,
  label,
  hint,
  preview = true,
  currentUrl,
  disabled = false,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl || null
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")
    ) {
      return <Image className="h-5 w-5" />;
    }

    if (["mp4", "webm", "mov", "avi"].includes(ext || "")) {
      return <Video className="h-5 w-5" />;
    }

    return <FileText className="h-5 w-5" />;
  };

  const validateFile = (file: File): boolean => {
    const maxSize = maxSizeMB * 1024 * 1024;

    if (file.size > maxSize) {
      toast(
        `El archivo ${file.name} excede el tamaño máximo de ${maxSizeMB}MB`,
        "error"
      );
      return false;
    }

    return true;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    // Validar archivos
    const validFiles = Array.from(files).filter(validateFile);

    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      /*
       * SUBIR MÚLTIPLES ARCHIVOS
       */
      if (multiple && validFiles.length > 1) {
        const formData = new FormData();

        validFiles.forEach((file) => {
          formData.append("files", file);
        });

        formData.append("folder", folder);

        const response = await fetch(
          `${API_URL}/uploads/multiple`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStorage.getToken()}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Error al subir archivos");
        }

        const data = await response.json();

        if (data.errors && data.errors.length > 0) {
          data.errors.forEach(
            (error: { filename: string; error: string }) => {
              toast(
                `Error en ${error.filename}: ${error.error}`,
                "error"
              );
            }
          );
        }

        if (data.success && data.success.length > 0) {
          setUploadedFiles(data.success);

          toast(
            `${data.uploaded} archivos subidos correctamente`,
            "success"
          );

          if (onUploadMultipleComplete) {
            const mappedFiles = data.success.map((file: UploadedFile) => ({
              url: file.url,
              publicId: file.public_id,
              filename: file.filename,
            }));
            onUploadMultipleComplete(mappedFiles);
          }
        }
      } else {
        /*
         * SUBIR UN SOLO ARCHIVO
         */
        const file = validFiles[0];

        const formData = new FormData();

        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch(
          `${API_URL}/uploads`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authStorage.getToken()}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Error al subir archivo");
        }

        const data: UploadedFile = await response.json();

        // Actualizar preview si es imagen
        if (preview && data.resource_type === "image") {
          setPreviewUrl(data.url);
        }

        toast("Archivo subido correctamente", "success");

        if (onUploadComplete) {
          onUploadComplete(data.url, data.public_id);
        }
      }
    } catch (error) {
      console.error("Error uploading:", error);
      toast("Error al subir archivo(s)", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePreview = () => {
    setPreviewUrl(null);

    if (onUploadComplete) {
      onUploadComplete("");
    }
  };

  const removeUploadedFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);

    setUploadedFiles(newFiles);

    if (onUploadMultipleComplete) {
      const mappedFiles = newFiles.map((file) => ({
        url: file.url,
        publicId: file.public_id,
        filename: file.filename,
      }));
      onUploadMultipleComplete(mappedFiles);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-netland-dark">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={uploading || disabled}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-netland-light px-4 py-3 transition-colors hover:border-netland-primary hover:bg-netland-light/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Subiendo...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />

              <span>
                {multiple
                  ? "Seleccionar archivos"
                  : "Seleccionar archivo"}
              </span>
            </>
          )}
        </button>

        {hint && (
          <p className="mt-1 text-xs text-netland-medium">
            {hint}
          </p>
        )}
      </div>

      {/* Preview para archivo único */}
      {preview && previewUrl && !multiple && (
        <div className="relative mt-3">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-48 w-full rounded-lg border border-netland-light object-cover"
          />

          <button
            type="button"
            onClick={removePreview}
            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Lista de archivos subidos */}
      {multiple && uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-netland-dark">
            Archivos subidos ({uploadedFiles.length})
          </p>

          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-lg bg-netland-light/30 p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {getFileIcon(file.filename)}

                <span className="truncate text-sm">
                  {file.filename}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeUploadedFile(index)}
                className="flex-shrink-0 rounded p-1 text-red-500 transition-colors hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Barra de progreso */}
      {uploading && uploadProgress > 0 && (
        <div className="mt-2">
          <div className="h-2 w-full rounded-full bg-netland-light/30">
            <div
              className="h-2 rounded-full bg-netland-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}