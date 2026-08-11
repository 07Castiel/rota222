import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftRight, ArrowRight, Check, Clock, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelarFn, reservarFn } from "@/lib/transporte.functions";
import { dataExtenso, dataHora, horaCurta } from "@/lib/formato";
import type { OnibusOcupacao, TipoViagem, Trecho, ViagemComOcupacao } from "@/lib/tipos";
import { ROTULO_TIPO } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const OPCOES: { valor: TipoViagem; rotulo: string; icone: typeof ArrowRight }[] = [
  { valor: "ida", rotulo: "Apenas ida", icone: ArrowRight },
  { valor: "volta", rotulo: "Apenas volta", icone: ArrowRight },
  { valor: "ida_volta", rotulo: "Ida e volta", icone: ArrowLeftRight },
];

function vagas(o: OnibusOcupacao, trecho: Trecho) {
  const ocupados = trecho === "ida" ? o.ocupados_ida : o.ocupados_volta;
  return { ocupados, livres: o.capacidade - ocupados, lotado: ocupados >= o.capacidade };
}

function OpcaoOnibus({
  onibus,
  trecho,
  selecionado,
  aoSelecionar,
}: {
  onibus: OnibusOcupacao;
  trecho: Trecho;
  selecionado: boolean;
  aoSelecionar: () => void;
}) {
  const { ocupados, livres, lotado } = vagas(onibus, trecho);
  return (
    <button
      type="button"
      disabled={lotado}
      onClick={aoSelecionar}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        selecionado ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted",
        lotado && "cursor-not-allowed opacity-55",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {horaCurta(trecho === "ida" ? onibus.hora_ida : onibus.hora_volta)} · {onibus.nome}
          </p>
          <p className="text-xs text-muted-foreground">
            {onibus.rota ? `${onibus.rota} — ${onibus.descricao_rota}` : onibus.descricao_rota}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">
            {ocupados} / {onibus.capacidade}
          </p>
          <p className={cn("text-xs", lotado ? "font-semibold text-destructive" : "text-muted-foreground")}>
            {lotado ? "LOTADO" : `${livres} vagas`}
          </p>
        </div>
      </div>
    </button>
  );
}

export function CartaoViagem({ item }: { item: ViagemComOcupacao }) {
  const { viagem, onibus, solicitacao } = item;
  const queryClient = useQueryClient();
  const reservar = useServerFn(reservarFn);
  const cancelar = useServerFn(cancelarFn);

  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<TipoViagem | null>(solicitacao?.tipo ?? null);
  const [idaId, setIdaId] = useState<string | null>(solicitacao?.onibus_ida?.id ?? null);
  const [voltaId, setVoltaId] = useState<string | null>(solicitacao?.onibus_volta?.id ?? null);

  const atualizar = () => queryClient.invalidateQueries({ queryKey: ["painel-aluno"] });

  const salvar = useMutation({
    mutationFn: () =>
      reservar({
        data: {
          viagemId: viagem.id,
          tipo: tipo!,
          onibusIdaId: tipo === "volta" ? null : idaId,
          onibusVoltaId: tipo === "ida" ? null : voltaId,
        },
      }),
    onSuccess: async () => {
      toast.success("Solicitação confirmada!");
      setEditando(false);
      await atualizar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: () => cancelar({ data: { viagemId: viagem.id } }),
    onSuccess: async () => {
      toast.success("Solicitação cancelada.");
      setTipo(null);
      setIdaId(null);
      setVoltaId(null);
      await atualizar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const precisaIda = tipo === "ida" || tipo === "ida_volta";
  const precisaVolta = tipo === "volta" || tipo === "ida_volta";
  const podeConfirmar =
    !!tipo && (!precisaIda || !!idaId) && (!precisaVolta || !!voltaId) && !salvar.isPending;

  const mostrarFormulario = viagem.aberta_agora && (!solicitacao || editando);

  return (
    <article className="superficie overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b bg-muted/40 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold first-letter:uppercase">{dataExtenso(viagem.data)}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {viagem.aberta_agora
              ? `Solicitações até ${dataHora(viagem.fechamento_em)}`
              : viagem.status !== "aberta"
                ? "Lista encerrada"
                : Date.now() < new Date(viagem.abertura_em).getTime()
                  ? `Abre em ${dataHora(viagem.abertura_em)}`
                  : "Lista encerrada"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            viagem.aberta_agora ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {viagem.aberta_agora
            ? "Aberta"
            : viagem.status === "aberta" && Date.now() < new Date(viagem.abertura_em).getTime()
              ? "Agendada"
              : "Fechada"}
        </span>
      </header>

      <div className="space-y-5 p-5">
        {solicitacao && !editando ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <Check className="h-4 w-4" /> {ROTULO_TIPO[solicitacao.tipo]} confirmada
            </div>

            {solicitacao.onibus_ida ? (
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ida · Pacujá &rarr; Sobral
                </p>
                <p className="mt-1 font-medium">
                  {horaCurta(solicitacao.onibus_ida.hora_ida)} · {solicitacao.onibus_ida.nome}
                  {solicitacao.onibus_ida.rota ? ` · ${solicitacao.onibus_ida.rota}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{solicitacao.onibus_ida.descricao_rota}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent/25 px-2.5 py-1 text-sm font-semibold">
                  <Ticket className="h-4 w-4" /> Poltrona {solicitacao.poltrona_ida}
                </p>
              </div>
            ) : null}

            {solicitacao.onibus_volta ? (
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Volta · Sobral &rarr; Pacujá
                </p>
                <p className="mt-1 font-medium">
                  {horaCurta(solicitacao.onibus_volta.hora_volta)} · {solicitacao.onibus_volta.nome}
                  {solicitacao.onibus_volta.rota ? ` · ${solicitacao.onibus_volta.rota}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{solicitacao.onibus_volta.descricao_rota}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent/25 px-2.5 py-1 text-sm font-semibold">
                  <Ticket className="h-4 w-4" /> Poltrona {solicitacao.poltrona_volta}
                </p>
              </div>
            ) : null}

            {viagem.aberta_agora ? (
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setEditando(true)}>
                  Alterar
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-destructive hover:text-destructive"
                  disabled={remover.isPending}
                  onClick={() => remover.mutate()}
                >
                  {remover.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                O período de alterações desta data já foi encerrado.
              </p>
            )}
          </div>
        ) : null}

        {mostrarFormulario ? (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium">Como você vai utilizar?</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {OPCOES.map((o) => (
                  <button
                    key={o.valor}
                    type="button"
                    onClick={() => {
                      setTipo(o.valor);
                      if (o.valor === "ida") setVoltaId(null);
                      if (o.valor === "volta") setIdaId(null);
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                      tipo === o.valor
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {o.rotulo}
                  </button>
                ))}
              </div>
            </div>

            {precisaIda ? (
              <div>
                <p className="mb-2 text-sm font-medium">Ida · Pacujá &rarr; Sobral</p>
                <div className="space-y-2">
                  {onibus.map((o) => (
                    <OpcaoOnibus
                      key={`ida-${o.id}`}
                      onibus={o}
                      trecho="ida"
                      selecionado={idaId === o.id}
                      aoSelecionar={() => setIdaId(o.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {precisaVolta ? (
              <div>
                <p className="mb-2 text-sm font-medium">Volta · Sobral &rarr; Pacujá</p>
                <div className="space-y-2">
                  {onibus.map((o) => (
                    <OpcaoOnibus
                      key={`volta-${o.id}`}
                      onibus={o}
                      trecho="volta"
                      selecionado={voltaId === o.id}
                      aoSelecionar={() => setVoltaId(o.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                className="h-11 flex-1"
                disabled={!podeConfirmar}
                onClick={() => salvar.mutate()}
              >
                {salvar.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : solicitacao ? (
                  "Salvar alteração"
                ) : (
                  "Confirmar solicitação"
                )}
              </Button>
              {solicitacao ? (
                <Button variant="ghost" className="h-11" onClick={() => setEditando(false)}>
                  Voltar
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!solicitacao && !viagem.aberta_agora ? (
          <p className="text-sm text-muted-foreground">
            As solicitações para esta data não estão abertas.
          </p>
        ) : null}
      </div>
    </article>
  );
}
