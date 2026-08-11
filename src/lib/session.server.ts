import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

const COOKIE_ALUNO = "tp_aluno";
const COOKIE_ADMIN = "tp_admin";
const DURACAO_MS = 1000 * 60 * 60 * 8;

function segredo(): string {
  const s = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? process.env["SUPABASE_URL"];
  if (!s) throw new Error("Segredo de sessão indisponível");
  return s;
}

function base64url(bytes: ArrayBuffer): string {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(dados: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(dados)));
}

export async function criarToken(valor: string): Promise<string> {
  const exp = Date.now() + DURACAO_MS;
  const corpo = `${valor}.${exp}`;
  return `${corpo}.${await hmac(corpo)}`;
}

export async function lerToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [valor, exp, assinatura] = partes as [string, string, string];
  const esperado = await hmac(`${valor}.${exp}`);
  if (esperado.length !== assinatura.length) return null;
  let diff = 0;
  for (let i = 0; i < esperado.length; i++) diff |= esperado.charCodeAt(i) ^ assinatura.charCodeAt(i);
  if (diff !== 0) return null;
  if (Number(exp) < Date.now()) return null;
  return valor;
}

function lerCookie(nome: string): string | undefined {
  const bruto = getRequestHeader("cookie");
  if (!bruto) return undefined;
  for (const parte of bruto.split(";")) {
    const [k, ...resto] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(resto.join("="));
  }
  return undefined;
}

function gravarCookie(nome: string, valor: string, maxAge: number) {
  setResponseHeader(
    "set-cookie",
    `${nome}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`,
  );
}

export async function iniciarSessaoAluno(alunoId: string) {
  gravarCookie(COOKIE_ALUNO, await criarToken(alunoId), DURACAO_MS / 1000);
}

export async function iniciarSessaoAdmin() {
  gravarCookie(COOKIE_ADMIN, await criarToken("admin"), DURACAO_MS / 1000);
}

export function encerrarSessaoAluno() {
  gravarCookie(COOKIE_ALUNO, "", 0);
}

export function encerrarSessaoAdmin() {
  gravarCookie(COOKIE_ADMIN, "", 0);
}

export async function alunoIdDaSessao(): Promise<string | null> {
  return lerToken(lerCookie(COOKIE_ALUNO));
}

export async function exigirAluno(): Promise<string> {
  const id = await alunoIdDaSessao();
  if (!id) throw new Error("SESSAO_EXPIRADA");
  return id;
}

export async function ehAdmin(): Promise<boolean> {
  return (await lerToken(lerCookie(COOKIE_ADMIN))) === "admin";
}

export async function exigirAdmin(): Promise<void> {
  if (!(await ehAdmin())) throw new Error("ACESSO_NEGADO");
}
