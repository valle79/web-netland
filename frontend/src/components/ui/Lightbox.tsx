import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface LightboxProps {
  images: { url: string; caption: string }[];
  index: number | null;
  onClose: () => void;
}

export function Lightbox({ images, index, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(index ?? 0);

  useEffect(() => {
    if (index !== null) setCurrent(index);
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % images.length);
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose]);

  if (index === null) return null;
  const image = images[current];

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        className="absolute right-5 top-5 text-white/80 hover:text-white"
        onClick={onClose}
        aria-label="Cerrar galería"
      >
        <X className="h-8 w-8" />
      </button>
      <img
        src={image.url}
        alt={image.caption || "Galería Netland"}
        className="max-h-[80vh] max-w-[92vw] rounded-md object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-4 text-sm text-white/70">{image.caption}</p>
    </div>
  );
}