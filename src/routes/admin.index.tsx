import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CalendarDays, Loader2, UserCheck, UserX } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { resumoAdminFn } from "@/lib/transporte.functions";
import { dataExtenso, dataHora } from "@/lib/formato";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Início — Painel do Transporte de Pacujá" },
      {
        name: "description",
        content: "Resumo da próxima viagem, ocupação dos ônibus e cadastro de alunos.",
      },
      { property: "og:title", content: "Início — Painel do Transporte de Pacujá" },
      { property: "og:description", content: "Resumo do transporte universitário de Pacujá." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaResumo,
});

function Indicador({
  rotulo,
  valor,
  Icone,
}: {
  rotulo: string;
  valor: number;
  Icone: typeof UserCheck;
}) {
  return (
    <div className="superficie flex items-center gap-3 p-4">
      <Icone className="h-5 w-5 text-primary" aria-hidden="true" />
      <div>
        <p className="text-2xl font-bold leading-none">{valor}</p>
        <p className="mt-1 text-xs text-muted-foreground">{rotulo}</p>
      </div>
    </div>
  );
}

function PaginaResumo() {
  const carregar = useServerFn(resumoAdminFn);
  const { data, isPending } = useQuery({
    queryKey: ["resumo-admin"],
    queryFn: () => carregar(),
    retry: false,
  });

  return (
    <AdminShell titulo="Início">
      {isPending || !data ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Indicador rotulo="Alunos ativos" valor={data.alunos_ativos} Icone={UserCheck} />
            <Indicador rotulo="Alunos inativos" valor={data.alunos_inativos} Icone={UserX} />
            <Indicador
              rotulo="Datas futuras cadastradas"
              valor={data.viagens_futuras}
              Icone={CalendarDays}
            />
          </div>

          <section className="superficie p-5">
            <h2 className="text-base font-bold">Próxima viagem</h2>
            {!data.proxima ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma data futura cadastrada.{" "}
                <Link to="/admin/viagens" className="text-primary underline-offset-4 hover:underline">
                  Cadastrar datas
                </Link>
                .
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm font-semibold first-letter:uppercase">
                  {dataExtenso(data.proxima.viagem.data)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Solicitações de {dataHora(data.proxima.viagem.abertura_em)} até{" "}
                  {dataHora(data.proxima.viagem.fechamento_em)} —{" "}
                  {data.proxima.viagem.aberta_agora ? "janela aberta" : "janela fechada"}
                </p>
                <p className="mt-2 text-sm">
                  <strong>{data.proxima.total}</strong> solicitação(ões) confirmada(s).
                </p>

                <ul className="mt-4 space-y-2">
                  {data.proxima.onibus.map((o) => {
                    const cheio =
                      o.ocupados_ida >= o.capacidade || o.ocupados_volta >= o.capacidade;
                    return (
                      <li
                        key={o.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                      >
                        <span className="font-medium">
                          {o.nome}
                          {o.rota ? ` — ${o.rota}` : ""}
                        </span>
                        <span className="flex items-center gap-3 text-muted-foreground">
                          <span>
                            Ida {o.ocupados_ida}/{o.capacidade}
                          </span>
                          <span>
                            Volta {o.ocupados_volta}/{o.capacidade}
                          </span>
                          {cheio ? (
                            <span className="flex items-center gap-1 font-semibold text-destructive">
                              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Lotado
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  to="/admin/viagens/$id"
                  params={{ id: data.proxima.viagem.id }}
                  className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  Ver lista de passageiros
                </Link>
              </>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
