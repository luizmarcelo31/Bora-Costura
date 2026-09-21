import type { ProductionStage } from "@/lib/types";
import { STAGE_LABEL } from "@/lib/workshop";
import { Badge } from "@/components/ui";

const TONE: Record<ProductionStage, "neutral" | "denim" | "sage" | "amber" | "brick"> = {
  orcamento: "neutral",
  aprovado: "denim",
  corte: "denim",
  costura: "amber",
  acabamento: "amber",
  pronto: "sage",
  entregue: "sage",
  cancelado: "brick",
};

export function StageBadge({ stage }: { stage: ProductionStage }) {
  return <Badge tone={TONE[stage]}>{STAGE_LABEL[stage]}</Badge>;
}

export function PayBadge({ status }: { status: "pago" | "parcial" | "pendente" }) {
  const tone = status === "pago" ? "sage" : status === "parcial" ? "amber" : "brick";
  const label = status === "pago" ? "Pago" : status === "parcial" ? "Parcial" : "A receber";
  return <Badge tone={tone}>{label}</Badge>;
}
