import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { money } from "@/lib/format";
import type { Client, Order, Payment, Profile } from "@/lib/types";
import {
  METHOD_LABEL,
  PAY_LABEL,
  STAGE_LABEL,
  clientById,
  itemSummary,
  orderTotal,
  paidOf,
  payStatus,
  remainingOf,
} from "@/lib/workshop";

type JsPdfCtor = typeof import("jspdf").jsPDF;
type AutoTable = typeof import("jspdf-autotable").default;

const INK: [number, number, number] = [27, 29, 36];
const MUTED: [number, number, number] = [110, 104, 95];
const DENIM: [number, number, number] = [42, 74, 98];
const LINE: [number, number, number] = [221, 212, 198];
const PAPER: [number, number, number] = [250, 247, 242];
const BRICK: [number, number, number] = [143, 61, 61];
const SAGE: [number, number, number] = [61, 92, 78];

async function libs(): Promise<{ jsPDF: JsPdfCtor; autoTable: AutoTable }> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  return { jsPDF, autoTable: autoTableMod.default };
}

function stamp(): string {
  return format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: ptBR });
}

function atelier(profile: Profile): string {
  return profile.atelierName.trim() || "Linha";
}

function paintHeader(
  doc: InstanceType<JsPdfCtor>,
  title: string,
  subtitle: string,
  profile: Profile,
) {
  doc.setFillColor(...DENIM);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(246, 243, 238);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("LINHA", 14, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(atelier(profile), 14, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 196, 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, 196, 18, { align: "right" });
  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text(`Gerado em ${stamp()}`, 14, 34);
}

function paintFooter(doc: InstanceType<JsPdfCtor>) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...LINE);
    doc.line(14, 284, 196, 284);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Linha · gestão de confecção", 14, 289);
    doc.text(`${i} / ${pages}`, 196, 289, { align: "right" });
  }
}

async function shareOrDownload(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "application/pdf" });
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });
  if (canShare) {
    try {
      await navigator.share({ files: [file], title: filename, text: "Relatório Linha" });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printPdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  frame.src = url;
  document.body.appendChild(frame);
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => {
      document.body.removeChild(frame);
      URL.revokeObjectURL(url);
    }, 60_000);
  };
}

export async function exportFinancePdf(opts: {
  profile: Profile;
  orders: Order[];
  clients: Client[];
  payments: Payment[];
  print?: boolean;
}) {
  const { jsPDF, autoTable } = await libs();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const open = opts.orders.filter((o) => remainingOf(o, opts.payments) > 0 && o.stage !== "cancelado");
  const received = opts.payments.slice().sort((a, b) => b.date.localeCompare(a.date));
  const openTotal = open.reduce((s, o) => s + remainingOf(o, opts.payments), 0);
  const paidTotal = received.reduce((s, p) => s + p.amount, 0);

  paintHeader(doc, "Relatório financeiro", "Contas e recebimentos", opts.profile);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(money(openTotal), 14, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("A receber", 14, 54);

  doc.setTextColor(...SAGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(money(paidTotal), 110, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Já recebido", 110, 54);

  autoTable(doc, {
    startY: 62,
    head: [["Cliente", "Pedido", "Status", "Saldo"]],
    body: open.map((order) => {
      const client = clientById(opts.clients, order.clientId);
      return [
        client?.name ?? "Cliente",
        order.number,
        PAY_LABEL[payStatus(order, opts.payments)],
        money(remainingOf(order, opts.payments)),
      ];
    }),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, textColor: INK, cellPadding: 2.2 },
    headStyles: { fillColor: PAPER, textColor: MUTED, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: PAPER },
    columnStyles: { 3: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  const afterOpen = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Últimos recebimentos", 14, afterOpen);

  autoTable(doc, {
    startY: afterOpen + 4,
    head: [["Data", "Cliente", "Forma", "Valor"]],
    body: received.slice(0, 24).map((p) => {
      const order = opts.orders.find((o) => o.id === p.orderId);
      const client = order ? clientById(opts.clients, order.clientId) : undefined;
      return [p.date, client?.name ?? order?.number ?? "—", METHOD_LABEL[p.method], money(p.amount)];
    }),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, textColor: INK, cellPadding: 2.2 },
    headStyles: { fillColor: PAPER, textColor: MUTED, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: PAPER },
    columnStyles: { 3: { halign: "right", fontStyle: "bold", textColor: SAGE } },
    margin: { left: 14, right: 14 },
  });

  paintFooter(doc);
  const blob = doc.output("blob");
  if (opts.print) printPdf(blob);
  else await shareOrDownload(blob, `linha-financeiro-${opts.payments[0]?.date ?? "hoje"}.pdf`);
}

export async function exportProductionPdf(opts: {
  profile: Profile;
  orders: Order[];
  clients: Client[];
  payments: Payment[];
  print?: boolean;
}) {
  const { jsPDF, autoTable } = await libs();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const open = opts.orders.filter((o) => o.stage !== "entregue" && o.stage !== "cancelado");
  paintHeader(doc, "Relatório de produção", `${open.length} pedidos na fila`, opts.profile);

  autoTable(doc, {
    startY: 42,
    head: [["Pedido", "Cliente", "Peças", "Etapa", "Prazo", "Aberto"]],
    body: open
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((order) => {
        const client = clientById(opts.clients, order.clientId);
        const remain = remainingOf(order, opts.payments);
        return [
          order.number,
          client?.name ?? "Cliente",
          itemSummary(order.items),
          STAGE_LABEL[order.stage],
          order.dueDate,
          remain > 0 ? money(remain) : "Quitado",
        ];
      }),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, textColor: INK, cellPadding: 2.1 },
    headStyles: { fillColor: PAPER, textColor: MUTED, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: PAPER },
    columnStyles: { 5: { halign: "right" } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 4) return;
      const order = open.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))[data.row.index];
      if (order && order.dueDate < format(new Date(), "yyyy-MM-dd")) {
        data.cell.styles.textColor = BRICK;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  paintFooter(doc);
  const blob = doc.output("blob");
  if (opts.print) printPdf(blob);
  else await shareOrDownload(blob, `linha-producao-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export async function exportOrderPdf(opts: {
  profile: Profile;
  order: Order;
  client?: Client;
  payments: Payment[];
  print?: boolean;
}) {
  const { jsPDF, autoTable } = await libs();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const total = orderTotal(opts.order);
  const paid = paidOf(opts.payments, opts.order.id);
  const remain = remainingOf(opts.order, opts.payments);
  paintHeader(
    doc,
    opts.order.number,
    `${STAGE_LABEL[opts.order.stage]} · prazo ${opts.order.dueDate}`,
    opts.profile,
  );

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(opts.client?.name ?? "Cliente", 14, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const meta = [opts.client?.city, opts.client?.phone].filter(Boolean).join(" · ");
  if (meta) doc.text(meta, 14, 52);
  if (opts.order.notes) {
    doc.setTextColor(...INK);
    doc.text(opts.order.notes, 14, 60, { maxWidth: 182 });
  }

  autoTable(doc, {
    startY: opts.order.notes ? 72 : 58,
    head: [["Peça", "Tecido", "Cor", "Tam.", "Qtd", "Total"]],
    body: opts.order.items.map((item) => [
      item.description,
      item.fabric || "—",
      item.color || "—",
      item.size || "—",
      String(item.quantity),
      money(item.quantity * item.unitPrice),
    ]),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 9, textColor: INK, cellPadding: 2.2 },
    headStyles: { fillColor: PAPER, textColor: MUTED, fontStyle: "bold", fontSize: 8 },
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Total", 140, y);
  doc.text("Recebido", 140, y + 7);
  doc.text("Em aberto", 140, y + 14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(money(total), 196, y, { align: "right" });
  doc.setTextColor(...SAGE);
  doc.text(money(paid), 196, y + 7, { align: "right" });
  doc.setTextColor(...(remain > 0 ? BRICK : SAGE));
  doc.text(money(remain), 196, y + 14, { align: "right" });

  paintFooter(doc);
  const blob = doc.output("blob");
  if (opts.print) printPdf(blob);
  else await shareOrDownload(blob, `linha-${opts.order.number.toLowerCase()}.pdf`);
}
