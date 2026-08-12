import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarcaPrefeitura } from "@/components/MarcaPrefeitura";
import { entrarComCpfFn } from "@/lib/transporte.functions";
import { cpfValido, formatarCpf, normalizarCpf } from "@/lib/cpf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso do aluno — Transporte Universitário de Pacujá" },
      {
        name: "description",
        content:
          "Sistema oficial da Prefeitura Municipal de Pacujá para o transporte universitário até Sobral. Acesse com seu CPF.",
      },
      { property: "og:title", content: "Transporte Universitário — Prefeitura de Pacujá" },
      {
        property: "og:description",
        content: "Sistema oficial de transporte universitário da Prefeitura Municipal de Pacujá.",
      },
    ],
  }),
  component: Entrada,
});

function Entrada() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const entrar = useServerFn(entrarComCpfFn);

  const mutation = useMutation({
    mutationFn: () => entrar({ data: { cpf: normalizarCpf(cpf) } }),
    onSuccess: () => navigate({ to: "/aluno" }),
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center text-primary">
            <MarcaPrefeitura tamanho="lg" />
            <h1 className="mt-4 text-xl font-bold text-foreground">
              Prefeitura Municipal de Pacujá
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              Sistema de Transporte Universitário
            </p>
          </div>

          <section className="superficie mt-6 p-6 sm:p-8">
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setErro(null);
                if (!cpfValido(cpf)) {
                  setErro("CPF inválido.");
                  return;
                }
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm font-semibold">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-describedby={erro ? "erro-login" : undefined}
                  placeholder="Digite seu CPF"
                  value={formatarCpf(cpf)}
                  onChange={(e) => {
                    setErro(null);
                    setCpf(normalizarCpf(e.target.value).slice(0, 11));
                  }}
                  className="h-12 text-base tracking-wide"
                />
              </div>

              {erro ? (
                <p
                  id="erro-login"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{erro}</span>
                </p>
              ) : null}

              <Button type="submit" className="h-12 w-full text-base" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-label="Entrando" />
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Use o CPF cadastrado pela responsável pelo transporte universitário.
            </p>
          </section>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Prefeitura Municipal de Pacujá — Ceará
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link to="/admin/login" className="underline-offset-4 hover:underline">
              Acesso administrativo
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
