import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bus, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  alternarOnibusAtivoFn,
  listarOnibusAdminFn,
  salvarOnibusFn,
} from "@/lib/transporte.functions";

export const Route = createFileRoute("/admin/onibus")({
  head: () => ({
    meta: [
      { title: "Ônibus — Painel do Transporte de Pacujá" },
      {
        name: "description",
        content: "Cadastro dos ônibus, rotas, horários e capacidade do transporte universitário.",
      },
      { property: "og:title", content: "Ônibus — Painel do Transporte de Pacujá" },
      { property: "og:description", content: "Cadastro de ônibus, rotas, horários e capacidade." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaOnibus,
});

const VAZIO = {
  codigo: "",
  nome: "",
  rota: "",
  descricao_rota: "",
  capacidade: "46",
  hora_ida: "05:30",
  hora_volta: "11:00",
  ordem: "0",
  ativo: true,
};

function PaginaOnibus() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarOnibusAdminFn);
  const salvar = useServerFn(salvarOnibusFn);
  const alternar = useServerFn(alternarOnibusAtivoFn);

  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState(VAZIO);

  const { data: onibus, isPending } = useQuery({
    queryKey: ["onibus-admin"],
    queryFn: () => listar(),
    retry: false,
  });

  const atualizar = async () => {
    await queryClient.invalidateQueries({ queryKey: ["onibus-admin"] });
    await queryClient.invalidateQueries({ queryKey: ["resumo-admin"] });
  };

  const gravar = useMutation({
    mutationFn: () =>
      salvar({
        data: {
          ...(editandoId ? { id: editandoId } : {}),
          codigo: form.codigo,
          nome: form.nome,
          rota: form.rota || null,
          descricao_rota: form.descricao_rota || null,
          capacidade: Number(form.capacidade),
          hora_ida: form.hora_ida,
          hora_volta: form.hora_volta,
          ordem: Number(form.ordem),
          ativo: form.ativo,
        },
      }),
    onSuccess: async () => {
      toast.success(editandoId ? "Ônibus atualizado." : "Ônibus cadastrado.");
      setAberto(false);
      await atualizar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mudarAtivo = useMutation({
    mutationFn: (v: { id: string; ativo: boolean }) => alternar({ data: v }),
    onSuccess: atualizar,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell titulo="Ônibus">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Ônibus inativos deixam de aparecer para os alunos, mas o histórico é preservado.
        </p>
        <Button
          onClick={() => {
            setEditandoId(undefined);
            setForm(VAZIO);
            setAberto(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo ônibus
        </Button>
      </div>

      {isPending ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <ul className="space-y-3">
          {(onibus ?? []).map((o) => (
            <li key={o.id} className="superficie flex flex-wrap items-center gap-4 p-4">
              <Bus className="h-5 w-5 text-primary" aria-hidden="true" />
              <div className="min-w-48 flex-1">
                <p className="font-semibold">
                  {o.nome}{" "}
                  <span className="text-xs font-normal text-muted-foreground">({o.codigo})</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {o.rota ? `${o.rota} — ` : ""}
                  {o.descricao_rota ?? "Sem rota descrita"}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Saída {o.hora_ida.slice(0, 5)} · Retorno {o.hora_volta.slice(0, 5)} ·{" "}
                {o.capacidade} lugares
              </div>
              <div className="flex items-center gap-3">
                <Label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={o.ativo}
                    onCheckedChange={(ativo) => mudarAtivo.mutate({ id: o.id, ativo })}
                    aria-label={`Ativar ${o.nome}`}
                  />
                  {o.ativo ? "Ativo" : "Inativo"}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditandoId(o.id);
                    setForm({
                      codigo: o.codigo,
                      nome: o.nome,
                      rota: o.rota ?? "",
                      descricao_rota: o.descricao_rota ?? "",
                      capacidade: String(o.capacidade),
                      hora_ida: o.hora_ida.slice(0, 5),
                      hora_volta: o.hora_volta.slice(0, 5),
                      ordem: String(o.ordem),
                      ativo: o.ativo,
                    });
                    setAberto(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar ônibus" : "Novo ônibus"}</DialogTitle>
          </DialogHeader>
          <form
            id="form-onibus"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              gravar.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rota">Rota</Label>
              <Input
                id="rota"
                value={form.rota}
                onChange={(e) => setForm({ ...form, rota: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacidade">Capacidade</Label>
              <Input
                id="capacidade"
                type="number"
                min={1}
                max={100}
                value={form.capacidade}
                onChange={(e) => setForm({ ...form, capacidade: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="descricao_rota">Descrição da rota</Label>
              <Input
                id="descricao_rota"
                value={form.descricao_rota}
                onChange={(e) => setForm({ ...form, descricao_rota: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hora_ida">Saída de Pacujá</Label>
              <Input
                id="hora_ida"
                type="time"
                value={form.hora_ida}
                onChange={(e) => setForm({ ...form, hora_ida: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hora_volta">Saída de Sobral</Label>
              <Input
                id="hora_volta"
                type="time"
                value={form.hora_volta}
                onChange={(e) => setForm({ ...form, hora_volta: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ordem">Ordem de exibição</Label>
              <Input
                id="ordem"
                type="number"
                min={0}
                max={99}
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                required
              />
            </div>
            <Label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Switch
                checked={form.ativo}
                onCheckedChange={(ativo) => setForm({ ...form, ativo })}
              />
              Ativo
            </Label>
          </form>
          <DialogFooter>
            <Button type="submit" form="form-onibus" disabled={gravar.isPending}>
              {gravar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
