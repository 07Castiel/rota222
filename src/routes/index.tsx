import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrarComCpfFn } from "@/lib/transporte.functions";
import { cpfValido, formatarCpf, normalizarCpf } from "@/lib/cpf";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Transporte Universitário de Pacujá — Acesso do aluno" },
      {
        name: "description",
        content:
          "Solicite sua vaga no transporte universitário de Pacujá para Sobral usando apenas o seu CPF.",
      },
      { property: "og:title", content: "Transporte Universitário de Pacujá" },
      {
        property: "og:description",
        content: "Solicite sua vaga no transporte universitário de Pacujá para Sobral.",
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

  const pronto = cpfValido(cpf);

  return (
    <main className="min-h-screen bg-background">
      <div className="faixa-marca px-5 pb-16 pt-12">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Bus className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-bold leading-tight">Transporte Universitário</h1>
          <p className="text-sm opacity-90">Pacujá &rarr; Sobral · Prefeitura Municipal de Pacujá</p>
        </div>
      </div>

      <div className="mx-auto -mt-10 max-w-md px-5 pb-16">
        <section className="superficie p-6">
          <h2 className="text-lg font-semibold">Acesse com seu CPF</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o CPF cadastrado pela administração. Com ou sem pontuação.
          </p>

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErro(null);
              if (!pronto) {
                setErro("CPF inválido.");
                return;
              }
              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={formatarCpf(cpf)}
                onChange={(e) => {
                  setErro(null);
                  setCpf(normalizarCpf(e.target.value).slice(0, 11));
                }}
                className="h-12 text-lg tracking-wide"
              />
            </div>

            {erro ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>
            ) : null}

            <Button type="submit" className="h-12 w-full text-base" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </section>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          É da administração?{" "}
          <Link to="/admin/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar no painel
          </Link>
        </p>
      </div>
    </main>
  );
}
