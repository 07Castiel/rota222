import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Bus, LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartaoViagem } from "@/components/CartaoViagem";
import { painelDoAlunoFn, sairAlunoFn } from "@/lib/transporte.functions";

export const Route = createFileRoute("/aluno")({
  head: () => ({
    meta: [
      { title: "Minhas viagens — Transporte Universitário de Pacujá" },
      {
        name: "description",
        content: "Escolha o ônibus, veja sua poltrona e acompanhe suas solicitações de transporte.",
      },
      { property: "og:title", content: "Minhas viagens — Transporte de Pacujá" },
      {
        property: "og:description",
        content: "Escolha o ônibus, veja sua poltrona e acompanhe suas solicitações.",
      },
    ],
  }),
  component: PainelAluno,
});

function PainelAluno() {
  const navigate = useNavigate();
  const carregar = useServerFn(painelDoAlunoFn);
  const sair = useServerFn(sairAlunoFn);

  const { data, isPending, error } = useQuery({
    queryKey: ["painel-aluno"],
    queryFn: () => carregar(),
    retry: false,
  });

  useEffect(() => {
    if (error) navigate({ to: "/" });
  }, [error, navigate]);

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="faixa-marca px-5 pb-14 pt-8">
        <div className="mx-auto flex max-w-2xl items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
              <Bus className="h-4 w-4" /> Transporte Universitário
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight">
              {data ? data.aluno.nome.split(" ")[0] : "Carregando..."}
            </h1>
            {data ? (
              <p className="text-sm opacity-90">
                {data.aluno.curso} · {data.aluno.instituicao}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/15"
            onClick={async () => {
              await sair();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-2xl space-y-4 px-5">
        {isPending ? (
          <div className="superficie flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando viagens...
          </div>
        ) : null}

        {data && data.datas.length === 0 ? (
          <div className="superficie p-8 text-center">
            <p className="font-medium">Nenhuma data disponível no momento</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Assim que a administração publicar novas datas de viagem, elas aparecerão aqui.
            </p>
          </div>
        ) : null}

        {data?.datas.map((item) => <CartaoViagem key={item.viagem.id} item={item} />)}
      </div>
    </main>
  );
}
