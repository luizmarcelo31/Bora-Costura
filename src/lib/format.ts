import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function money(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

export function formatDay(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "—";
  return format(d, "d MMM", { locale: ptBR });
}

export function formatDayLong(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "—";
  return format(d, "d 'de' MMMM", { locale: ptBR });
}

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function daysFromToday(iso: string): number | null {
  const d = parseDate(iso);
  if (!d) return null;
  return differenceInCalendarDays(d, new Date());
}

export function greeting(): string {
  const h = hourInSaoPaulo();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function todayLabel(): string {
  const raw = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function hourInSaoPaulo(): number {
  const hour = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date());
  return Number.parseInt(hour, 10);
}

export function whatsappHref(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const url = `https://wa.me/${withCountry}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export function isoFromNow(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return format(d, "yyyy-MM-dd");
}
