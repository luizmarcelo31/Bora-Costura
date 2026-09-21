import { Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

export function PdfActions({
  onShare,
  onPrint,
}: {
  onShare: () => Promise<void>;
  onPrint: () => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="secondary"
        className="gap-1.5 pl-3 pr-3.5"
        onClick={() => {
          void onShare().catch(() => toast.error("Não foi possível gerar o PDF."));
        }}
      >
        <Share2 className="size-3.5" />
        PDF
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-9"
        aria-label="Imprimir PDF"
        onClick={() => {
          void onPrint().catch(() => toast.error("Não foi possível imprimir."));
        }}
      >
        <Printer className="size-4" />
      </Button>
    </div>
  );
}
