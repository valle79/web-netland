import { MessageCircle } from "lucide-react";
import { whatsappLink } from "../../lib/constants";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition-transform duration-300 hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}