const FUSO = "America/Fortaleza";

export function dataExtenso(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: FUSO,
  }).format(d);
}

export function dataCurta(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO }).format(d);
}

export function dataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(new Date(iso));
}

// O sistema opera sempre no horário local do Ceará (UTC-3, sem horário de verão),
// independentemente do fuso do aparelho do usuário ou do servidor.
const DESLOCAMENTO = "-03:00";

export function paraCampoDataHora(iso: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: FUSO,
  }).formatToParts(new Date(iso));
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "00";
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`;
}

// Converte o valor de um input datetime-local (sem fuso) em ISO no horário do Ceará.
export function deCampoDataHora(local: string): string {
  if (!local) return local;
  const completo = local.length === 16 ? `${local}:00` : local;
  return `${completo}${DESLOCAMENTO}`;
}

export function horaCurta(hora: string): string {
  return hora.slice(0, 5);
}
