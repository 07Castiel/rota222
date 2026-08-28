import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, CalendarRange, ChevronRight, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  alterarStatusViagemFn,
  criarViagensEmLoteFn,
  listarViagensFn,
  salvarViagemFn,
} from "@/lib/transporte.functions";
import { dataExtenso, dataHora, deCampoDataHora, paraCampoDataHora } from "@/lib/formato";
import type { Viagem } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/viagens/")({
  head: () => ({
    meta: [
      { title: "Viagens — Painel do Transporte de Pacujá" },
      { name: "description", content: "Cadastro das datas de viagem e das janelas de solicitação." },
      { property: "og:title", content: "Viagens — Painel do Transporte de Pacujá" },
      { property: "og:description", content: "Cadastro das datas de viagem e janelas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaViagens,
});

function PaginaViagens() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarViagensFn);
  const salvar = useServerFn(salvarViagemFn);
  const alterarStatus = useServerFn(alterarStatusViagemFn);
  const criarLote = useServerFn(criarViagensEmLoteFn);

  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ data: "", abertura_em: "", fechamento_em: "" });
  const [loteAberto, setLoteAberto] = useState(false);
  const [lote, setLote] = useState({
    inicio: "",
    fim: "",
    dias: [1, 2, 3, 4, 5] as number[],
    abertura_hora: "08:00",
    fechamento_hora: "12:00",
    dias_antes_abertura: 1,
  });

  const { data: viagens, isPending } = useQuery({
    queryKey: ["viagens"],
    queryFn: () => listar(),
    retry: false,
  });

  const gravar = useMutation({
    mutationFn: () =>
      salvar({
        data: {
          ...(editandoId ? { id: editandoId } : {}),
          data: form.data,
          abertura_em: deCampoDataHora(form.abertura_em),
          fechamento_em: deCampoDataHora(form.fechamento_em),
        },
      }),
    onSuccess: async () => {
      toast.success(editandoId ? "Viagem atualizada." : "Viagem criada.");
      setAberto(false);
      await queryClient.invalidateQueries({ queryKey: ["viagens"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gravarLote = useMutation({
    mutationFn: () => criarLote({ data: lote }),
    onSuccess: async (r) => {
      toast.success(
        `${r.criadas} data(s) criada(s).` + (r.ignoradas ? ` ${r.ignoradas} já existia(m).` : ""),
      );
      setLoteAberto(false);
      await queryClient.invalidateQueries({ queryKey: ["viagens"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mudarStatus = useMutation({
    mutationFn: (v: { id: string; status: Viagem["status"] }) => alterarStatus({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["viagens"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function abrirNova() {
    setEditandoId(undefined);
    setForm({ data: "", abertura_em: "", fechamento_em: "" });
    setAberto(true);
  }

  function abrirEdicao(v: Viagem) {
    setEditandoId(v.id);
    setForm({
      data: v.data,
      abertura_em: paraCampoDataHora(v.abertura_em),
      fechamento_em: paraCampoDataHora(v.fechamento_em),
    });
    setAberto(true);
  }

  const valido = !!form.data && !!form.abertura_em && !!form.fechamento_em;

  return (
    <AdminShell titulo="Datas de viagem">
      <div className="mb-5 flex flex-wrap justify-end gap-2">
        <Button variant="outline" className="h-11" onClick={() => setLoteAberto(true)}>
          <CalendarRange className="h-4 w-4" /> Criar em lote
        </Button>
        <Button className="h-11" onClick={abrirNova}>
          <Plus className="h-4 w-4" /> Nova data
        </Button>
      </div>

      <div className="superficie overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : viagens && viagens.length > 0 ? (
          <ul className="divide-y">
            {viagens.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <div className="min-w-52 flex-1">
                  <p className="font-medium first-letter:uppercase">{dataExtenso(v.data)}</p>
                  <p className="text-xs text-muted-foreground">
                    Janela: {dataHora(v.abertura_em)} até {dataHora(v.fechamento_em)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    v.aberta_agora
                      ? "bg-success/15 text-success"
                      : v.status === "cancelada"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {v.aberta_agora
                    ? "Aberta"
                    : v.status === "cancelada"
                      ? "Cancelada"
                      : v.status === "aberta" && Date.now() < new Date(v.abertura_em).getTime()
                        ? "Agendada"
                        : "Fechada"}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => abrirEdicao(v)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      mudarStatus.mutate({
                        id: v.id,
                        status: v.status === "aberta" ? "fechada" : "aberta",
                      })
                    }
                  >
                    {v.status === "aberta" ? "Encerrar" : "Reabrir"}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/viagens/$id" params={{ id: v.id }}>
                      Lista <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma data cadastrada ainda.
          </p>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar data" : "Nova data de viagem"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data da viagem</Label>
              <Input
                id="data"
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abertura">Abertura das solicitações</Label>
              <Input
                id="abertura"
                type="datetime-local"
                value={form.abertura_em}
                onChange={(e) => setForm({ ...form, abertura_em: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechamento">Fechamento das solicitações</Label>
              <Input
                id="fechamento"
                type="datetime-local"
                value={form.fechamento_em}
                onChange={(e) => setForm({ ...form, fechamento_em: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button disabled={!valido || gravar.isPending} onClick={() => gravar.mutate()}>
              {gravar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={loteAberto} onOpenChange={setLoteAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar datas em lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              As datas que já existirem serão ignoradas.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lote-inicio">Início do período</Label>
                <Input
                  id="lote-inicio"
                  type="date"
                  value={lote.inicio}
                  onChange={(e) => setLote({ ...lote, inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-fim">Fim do período</Label>
                <Input
                  id="lote-fim"
                  type="date"
                  value={lote.fim}
                  onChange={(e) => setLote({ ...lote, fim: e.target.value })}
                />
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Dias da semana</legend>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map((d) => {
                  const marcado = lote.dias.includes(d.valor);
                  return (
                    <button
                      key={d.valor}
                      type="button"
                      aria-pressed={marcado}
                      onClick={() =>
                        setLote({
                          ...lote,
                          dias: marcado
                            ? lote.dias.filter((x) => x !== d.valor)
                            : [...lote.dias, d.valor],
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition-colors",
                        marcado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {d.rotulo}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="lote-antes">Abrir quantos dias antes</Label>
                <Input
                  id="lote-antes"
                  type="number"
                  min={0}
                  max={30}
                  value={lote.dias_antes_abertura}
                  onChange={(e) =>
                    setLote({ ...lote, dias_antes_abertura: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-abertura">Hora de abertura</Label>
                <Input
                  id="lote-abertura"
                  type="time"
                  value={lote.abertura_hora}
                  onChange={(e) => setLote({ ...lote, abertura_hora: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-fechamento">Hora de fechamento</Label>
                <Input
                  id="lote-fechamento"
                  type="time"
                  value={lote.fechamento_hora}
                  onChange={(e) => setLote({ ...lote, fechamento_hora: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLoteAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!lote.inicio || !lote.fim || lote.dias.length === 0 || gravarLote.isPending}
              onClick={() => gravarLote.mutate()}
            >
              {gravarLote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar datas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

const DIAS_SEMANA = [
  { valor: 1, rotulo: "Seg" },
  { valor: 2, rotulo: "Ter" },
  { valor: 3, rotulo: "Qua" },
  { valor: 4, rotulo: "Qui" },
  { valor: 5, rotulo: "Sex" },
  { valor: 6, rotulo: "Sáb" },
  { valor: 0, rotulo: "Dom" },
];
