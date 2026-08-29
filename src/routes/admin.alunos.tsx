import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  alternarAtivoFn,
  detalhesAlunoFn,
  excluirAlunoFn,
  listarAlunosFn,
  salvarAlunoFn,
} from "@/lib/transporte.functions";
import { cpfValido, formatarCpf, normalizarCpf } from "@/lib/cpf";
import { dataCurta } from "@/lib/formato";
import { ROTULO_STATUS, ROTULO_TIPO, type Aluno } from "@/lib/tipos";

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
  nascimento: "",
  rg: "",
  endereco: "",
  telefone: "",
  email: "",
  dias_semana: [] as string[],
  inicio_aulas: "",
};

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Status = "todos" | "ativos" | "inativos";

const poltrona = (n: number | null) => (n === null ? "-" : String(n).padStart(2, "0"));

function PaginaAlunos() {
  const queryClient = useQueryClient();
  const listar = useServerFn(listarAlunosFn);
  const salvar = useServerFn(salvarAlunoFn);
  const alternar = useServerFn(alternarAtivoFn);
  const detalhar = useServerFn(detalhesAlunoFn);
  const remover = useServerFn(excluirAlunoFn);

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Status>("todos");
  const [aberto, setAberto] = useState(false);
  const [verId, setVerId] = useState<string | null>(null);
  const [excluirAlvo, setExcluirAlvo] = useState<Aluno | null>(null);
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ ...VAZIO });

  const { data: alunos, isPending } = useQuery({
    queryKey: ["alunos", busca, status],
    queryFn: () => listar({ data: { busca, status } }),
    retry: false,
  });

  const { data: detalhe, isPending: carregandoDetalhe } = useQuery({
    queryKey: ["aluno-detalhe", verId],
    queryFn: () => detalhar({ data: { id: verId as string } }),
    enabled: verId !== null,
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
      await queryClient.invalidateQueries({ queryKey: ["aluno-detalhe"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const trocarAtivo = useMutation({
    mutationFn: (v: { id: string; ativo: boolean }) => alternar({ data: v }),
    onSuccess: async (_r, v) => {
      toast.success(v.ativo ? "Aluno reativado." : "Aluno inativado. O histórico foi preservado.");
      await queryClient.invalidateQueries({ queryKey: ["alunos"] });
      await queryClient.invalidateQueries({ queryKey: ["aluno-detalhe"] });
    },
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
      nascimento: a.nascimento ?? "",
      rg: a.rg ?? "",
      endereco: a.endereco ?? "",
      telefone: a.telefone ?? "",
      email: a.email ?? "",
      dias_semana: a.dias_semana ?? [],
      inicio_aulas: a.inicio_aulas ?? "",
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
            placeholder="Buscar por nome, CPF, matrícula, curso ou instituição"
            className="h-11 pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
          <SelectTrigger className="h-11 w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Somente ativos</SelectItem>
            <SelectItem value="inativos">Somente inativos</SelectItem>
          </SelectContent>
        </Select>
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
                  <div className="flex items-center gap-2 font-medium">
                    {a.nome}
                    {!a.ativo ? <Badge variant="secondary">Inativo</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatarCpf(a.cpf)} · {a.matricula} · {a.curso} · {a.instituicao}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{a.ativo ? "Ativo" : "Inativo"}</span>
                  <Switch
                    checked={a.ativo}
                    aria-label={a.ativo ? "Inativar aluno" : "Reativar aluno"}
                    onCheckedChange={(v) => trocarAtivo.mutate({ id: a.id, ativo: v })}
                  />
                  <Button variant="ghost" size="sm" aria-label="Ver aluno" onClick={() => setVerId(a.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Editar aluno" onClick={() => abrirEdicao(a)}>
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

      <Dialog open={verId !== null} onOpenChange={(o) => !o && setVerId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados do aluno</DialogTitle>
          </DialogHeader>
          {carregandoDetalhe || !detalhe ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Nome" valor={detalhe.aluno.nome} />
                <Campo rotulo="CPF" valor={formatarCpf(detalhe.aluno.cpf)} />
                <Campo rotulo="Matrícula" valor={detalhe.aluno.matricula} />
                <Campo rotulo="Curso" valor={detalhe.aluno.curso} />
                <Campo rotulo="Instituição" valor={detalhe.aluno.instituicao} />
                <Campo rotulo="Status" valor={detalhe.aluno.ativo ? "Ativo" : "Inativo"} />
              </dl>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Histórico de solicitações
                </p>
                {detalhe.historico.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma solicitação registrada.</p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {detalhe.historico.map((h) => (
                      <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <span>
                          {h.data ? dataCurta(h.data) : "—"} · {ROTULO_TIPO[h.tipo]} ·{" "}
                          <span className="text-muted-foreground">{ROTULO_STATUS[h.status]}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          IDA {poltrona(h.poltrona_ida)} · VOLTA {poltrona(h.poltrona_volta)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {detalhe ? (
              <Button
                variant="outline"
                onClick={() =>
                  trocarAtivo.mutate({ id: detalhe.aluno.id, ativo: !detalhe.aluno.ativo })
                }
              >
                {detalhe.aluno.ativo ? "Inativar" : "Reativar"}
              </Button>
            ) : null}
            <Button
              onClick={() => {
                if (!detalhe) return;
                setVerId(null);
                abrirEdicao(detalhe.aluno);
              }}
            >
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nascimento">Data de nascimento</Label>
                <Input
                  id="nascimento"
                  type="date"
                  value={form.nascimento}
                  onChange={(e) => setForm({ ...form, nascimento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={form.rg}
                  onChange={(e) => setForm({ ...form, rg: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inicio-aulas">Início das aulas</Label>
              <Input
                id="inicio-aulas"
                type="date"
                value={form.inicio_aulas}
                onChange={(e) => setForm({ ...form, inicio_aulas: e.target.value })}
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Dias da semana com aula</legend>
              <div className="flex flex-wrap gap-2">
                {DIAS.map((d) => {
                  const marcado = form.dias_semana.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={marcado}
                      onClick={() =>
                        setForm({
                          ...form,
                          dias_semana: marcado
                            ? form.dias_semana.filter((x) => x !== d)
                            : [...form.dias_semana, d],
                        })
                      }
                      className={
                        "rounded-full border px-3 py-1 text-sm " +
                        (marcado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-muted-foreground")
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </fieldset>
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

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}
