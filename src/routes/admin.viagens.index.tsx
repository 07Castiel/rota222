import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, ChevronRight, Loader2, Pencil, Plus } from "lucide-react";
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

  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ data: "", abertura_em: "", fechamento_em: "" });

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
      <div className="mb-5 flex justify-end">
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
                  {v.aberta_agora ? "Aberta" : v.status === "cancelada" ? "Cancelada" : "Fechada"}
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
    </AdminShell>
  );
}
