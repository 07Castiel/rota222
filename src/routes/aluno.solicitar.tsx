import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";

import { CartaoViagem } from "@/components/CartaoViagem";
import { painelDoAlunoFn } from "@/lib/transporte.functions";

export const Route = createFileRoute("/aluno/solicitar")({
  head: () => ({
    meta: [
      { title: "Solicitar transporte — Transporte Universitário de Pacujá" },
      {
        name: "description",
        content: "Escolha a data, o trecho e o ônibus para solicitar o transporte universitário.",
      },
      { property: "og:title", content: "Solicitar transporte — Pacujá" },
      {
        property: "og:description",
        content: "Escolha a data, o trecho e o ônibus da sua viagem.",
      },
    ],
  }),
  component: Solicitar,
});

function Solicitar() {
  const carregar = useServerFn(painelDoAlunoFn);
  const { data, isPending } = useQuery({
    queryKey: ["painel-aluno"],
    queryFn: () => carregar(),
    retry: false,
  });

  return (
    <div className="space-y-4">
      <Link
        to="/aluno"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar à área do aluno
      </Link>

      <h1 className="text-xl font-bold text-foreground">Solicitar transporte</h1>

      {isPending ? (
        <div className="superficie flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando datas...
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
  );
}
