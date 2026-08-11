import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
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
import { alternarAtivoFn, listarAlunosFn, salvarAlunoFn } from "@/lib/transporte.functions";
import { cpfValido, formatarCpf, normalizarCpf } from "@/lib/cpf";
import type { Aluno } from "@/lib/tipos";

export const Route = createFileRoute("/admin/alunos")({
  head: () => ({
    meta: [
      { title: "Alunos — Painel do Transporte de Pacujá" },
      { name: "description", content: "Cadastro dos alunos autorizados a usar o transporte." },
      { property: "og:title", content: "Alunos — Painel do Transporte de Pacujá" },
      { property: "og:description", content: "Cadastro dos alunos autorizados." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaAlunos,
});

const VAZIO = {
  nome: "",
  cpf: "",
  matricula: "",
  curso: "",
  instituicao: "",
  ativo: true,
};

function PaginaAlunos() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarAlunosFn);
  const salvar = useServerFn(salvarAlunoFn);
  const alternar = useServerFn(alternarAtivoFn);

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ ...VAZIO });

  const { data: alunos, isPending } = useQuery({
    queryKey: ["alunos", busca],
    queryFn: () => listar({ data: { busca } }),
    retry: false,
  });

  const gravar = useMutation({
    mutationFn: () =>
      salvar({
        data: {
          ...(editandoId ? { id: editandoId } : {}),
          ...form,
          cpf: normalizarCpf(form.cpf),
        },
      }),
    onSuccess: async () => {
      toast.success(editandoId ? "Aluno atualizado." : "Aluno cadastrado.");
      setAberto(false);
      await queryClient.invalidateQueries({ queryKey: ["alunos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const trocarAtivo = useMutation({
    mutationFn: (v: { id: string; ativo: boolean }) => alternar({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alunos"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  function abrirNovo() {
    setEditandoId(undefined);
    setForm({ ...VAZIO });
    setAberto(true);
  }

  function abrirEdicao(a: Aluno) {
    setEditandoId(a.id);
    setForm({
      nome: a.nome,
      cpf: a.cpf,
      matricula: a.matricula,
      curso: a.curso,
      instituicao: a.instituicao,
      ativo: a.ativo,
    });
    setAberto(true);
  }

  const valido =
    form.nome.trim().length >= 3 &&
    cpfValido(form.cpf) &&
    form.matricula.trim().length >= 1 &&
    form.curso.trim().length >= 2 &&
    form.instituicao.trim().length >= 2;

  return (
    <AdminShell titulo="Alunos cadastrados">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou matrícula"
            className="h-11 pl-9"
          />
        </div>
        <Button className="h-11" onClick={abrirNovo}>
          <Plus className="h-4 w-4" /> Novo aluno
        </Button>
      </div>

      <div className="superficie overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : alunos && alunos.length > 0 ? (
          <ul className="divide-y">
            {alunos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-48 flex-1">
                  <p className="font-medium">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarCpf(a.cpf)} · {a.matricula} · {a.curso} · {a.instituicao}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{a.ativo ? "Ativo" : "Inativo"}</span>
                  <Switch
                    checked={a.ativo}
                    onCheckedChange={(v) => trocarAtivo.mutate({ id: a.id, ativo: v })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => abrirEdicao(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? "Editar aluno" : "Novo aluno"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf-aluno">CPF</Label>
              <Input
                id="cpf-aluno"
                inputMode="numeric"
                value={formatarCpf(form.cpf)}
                onChange={(e) => setForm({ ...form, cpf: normalizarCpf(e.target.value).slice(0, 11) })}
              />
              {form.cpf.length === 11 && !cpfValido(form.cpf) ? (
                <p className="text-xs text-destructive">CPF inválido.</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="curso">Curso</Label>
                <Input
                  id="curso"
                  value={form.curso}
                  onChange={(e) => setForm({ ...form, curso: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição</Label>
              <Input
                id="instituicao"
                value={form.instituicao}
                onChange={(e) => setForm({ ...form, instituicao: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label htmlFor="ativo">Aluno ativo</Label>
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
