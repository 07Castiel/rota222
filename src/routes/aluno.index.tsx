import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inicioAlunoFn } from "@/lib/transporte.functions";
import { dataCurta, dataExtenso, dataHora } from "@/lib/formato";
import { formatarCpf } from "@/lib/cpf";
import { ROTULO_STATUS, ROTULO_TIPO } from "@/lib/tipos";
import type { Aluno, ItemHistorico, InicioAluno } from "@/lib/tipos";

export const Route = createFileRoute("/aluno/")({
  head: () => ({
    meta: [
      { title: "Área do aluno — Transporte Universitário de Pacujá" },
      {
        name: "description",
        content:
          "Consulte seus dados cadastrais, o status do transporte e o histórico das suas solicitações.",
      },
      { property: "og:title", content: "Área do aluno — Transporte de Pacujá" },
      {
        property: "og:description",
        content: "Dados cadastrais, status do transporte e histórico de solicitações.",
      },
    ],
  }),
  component: AreaAluno,
});

const CAMPOS_OBRIGATORIOS: { chave: keyof Aluno; rotulo: string }[] = [
  { chave: "nascimento", rotulo: "Data de nascimento" },
  { chave: "rg", rotulo: "RG" },
  { chave: "endereco", rotulo: "Endereço" },
  { chave: "telefone", rotulo: "Telefone" },
  { chave: "email", rotulo: "E-mail" },
  { chave: "inicio_aulas", rotulo: "Início das aulas" },
];

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <p className="rotulo-campo">{rotulo}</p>
      <p className="text-sm font-medium text-foreground">{valor?.trim() ? valor : "Não informado"}</p>
    </div>
  );
}

function Selo({ status }: { status: ItemHistorico["status"] }) {
  const cores: Record<ItemHistorico["status"], string> = {
    confirmada: "bg-success/12 text-success",
    cancelada: "bg-destructive/10 text-destructive",
    encerrada: "bg-muted text-muted-foreground",
    viagem_cancelada: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cores[status]}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}

function poltrona(n: number | null) {
  return n === null ? "-" : String(n);
}

function AreaAluno() {
  const carregar = useServerFn(inicioAlunoFn);
  const { data, isPending } = useQuery<InicioAluno>({
    queryKey: ["inicio-aluno"],
    queryFn: () => carregar(),
    retry: false,
  });

  if (isPending || !data) {
    return (
      <div className="superficie flex items-center justify-center gap-2 p-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando sua área...
      </div>
    );
  }

  const { aluno, proxima, solicitacao, historico } = data;
  const faltando = CAMPOS_OBRIGATORIOS.filter((c) => {
    const v = aluno[c.chave];
    return v === null || v === undefined || String(v).trim() === "";
  });

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-bold text-foreground">Olá, {aluno.nome.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe aqui o seu transporte universitário.
        </p>
      </section>

      {faltando.length > 0 ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <p>
            Alguns dados do seu cadastro estão incompletos ({faltando.map((f) => f.rotulo).join(", ")}).
            Procure a responsável pelo transporte universitário para atualizá-los.
          </p>
        </div>
      ) : null}

      <section className="superficie p-5">
        <h2 className="text-base font-bold text-foreground">Status do transporte</h2>
        {proxima ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="first-letter:uppercase">{dataExtenso(proxima.viagem.data)}</span>
            </p>
            {proxima.saida_pacuja ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" aria-hidden="true" /> Saída de Pacujá a partir das{" "}
                {proxima.saida_pacuja}
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {proxima.janela === "aberta"
                ? `Solicitações abertas até ${dataHora(proxima.viagem.fechamento_em)}.`
                : proxima.janela === "aguardando"
                  ? `As solicitações abrem em ${dataHora(proxima.viagem.abertura_em)}.`
                  : "O prazo para solicitar esta data já foi encerrado."}
            </p>
            <div className="pt-2">
              <Button asChild disabled={proxima.janela !== "aberta"} className="h-11 w-full sm:w-auto">
                <Link to="/aluno/solicitar">
                  {solicitacao ? "Alterar solicitação" : "Solicitar transporte"}
                </Link>
              </Button>
              {proxima.janela !== "aberta" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  O botão será liberado quando o período de solicitação estiver aberto.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma data de viagem disponível no momento. Assim que a administração publicar novas
            datas, elas aparecerão aqui.
          </p>
        )}
      </section>

      <section className="superficie p-5">
        <h2 className="text-base font-bold text-foreground">Minha solicitação atual</h2>
        {solicitacao ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
              {ROTULO_TIPO[solicitacao.tipo]} · <Selo status={solicitacao.status} />
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Campo
                rotulo="Ida"
                valor={
                  solicitacao.poltrona_ida
                    ? `${solicitacao.onibus_ida ?? "Ônibus"} · Poltrona ${solicitacao.poltrona_ida}`
                    : "-"
                }
              />
              <Campo
                rotulo="Volta"
                valor={
                  solicitacao.poltrona_volta
                    ? `${solicitacao.onibus_volta ?? "Ônibus"} · Poltrona ${solicitacao.poltrona_volta}`
                    : "-"
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solicitado em {dataHora(solicitacao.criado_em)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Você ainda não possui solicitação para a próxima data.
          </p>
        )}
      </section>

      <section className="superficie p-5">
        <h2 className="text-base font-bold text-foreground">Meus dados cadastrais</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Os dados são mantidos pela administração. Para correções, procure a responsável pelo
          transporte universitário.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome completo" valor={aluno.nome} />
          <Campo rotulo="CPF" valor={formatarCpf(aluno.cpf)} />
          <Campo
            rotulo="Data de nascimento"
            valor={aluno.nascimento ? dataCurta(aluno.nascimento) : null}
          />
          <Campo rotulo="RG" valor={aluno.rg} />
          <Campo rotulo="Matrícula" valor={aluno.matricula} />
          <Campo rotulo="Telefone" valor={aluno.telefone} />
          <Campo rotulo="E-mail" valor={aluno.email} />
          <Campo rotulo="Endereço" valor={aluno.endereco} />
          <Campo rotulo="Instituição" valor={aluno.instituicao} />
          <Campo rotulo="Curso" valor={aluno.curso} />
          <Campo
            rotulo="Dias da semana"
            valor={aluno.dias_semana?.length ? aluno.dias_semana.join(", ") : null}
          />
          <Campo
            rotulo="Início das aulas"
            valor={aluno.inicio_aulas ? dataCurta(aluno.inicio_aulas) : null}
          />
        </div>
      </section>

      <section className="superficie p-5">
        <h2 className="text-base font-bold text-foreground">Histórico de solicitações</h2>
        {historico.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma solicitação registrada ainda.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="rotulo-campo py-2">Data</th>
                  <th className="rotulo-campo py-2">Saída</th>
                  <th className="rotulo-campo py-2 text-center">Ida</th>
                  <th className="rotulo-campo py-2 text-center">Volta</th>
                  <th className="rotulo-campo py-2">Solicitado em</th>
                  <th className="rotulo-campo py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="py-2">{h.data ? dataCurta(h.data) : "—"}</td>
                    <td className="py-2 text-muted-foreground">{h.saida_pacuja ?? "—"}</td>
                    <td className="py-2 text-center tabular-nums">{poltrona(h.poltrona_ida)}</td>
                    <td className="py-2 text-center tabular-nums">{poltrona(h.poltrona_volta)}</td>
                    <td className="py-2 text-muted-foreground">{dataHora(h.criado_em)}</td>
                    <td className="py-2">
                      <Selo status={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
