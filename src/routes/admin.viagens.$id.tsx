import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { painelViagemFn } from "@/lib/transporte.functions";
import { dataExtenso } from "@/lib/formato";
import { ROTULO_TIPO } from "@/lib/tipos";

export const Route = createFileRoute("/admin/viagens/$id")({
  head: () => ({
    meta: [
      { title: "Lista de passageiros — Transporte de Pacujá" },
      { name: "description", content: "Passageiros confirmados por ônibus e trecho." },
      { property: "og:title", content: "Lista de passageiros — Transporte de Pacujá" },
      { property: "og:description", content: "Passageiros confirmados por ônibus e trecho." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaLista,
});

function PaginaLista() {
  const { id } = Route.useParams();
  const carregar = useServerFn(painelViagemFn);
  const [gerando, setGerando] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["painel-viagem", id],
    queryFn: () => carregar({ data: { viagemId: id } }),
    retry: false,
  });

  async function exportar() {
    if (!data) return;
    setGerando(true);
    try {
      const { exportarPdfViagem } = await import("@/lib/pdf");
      await exportarPdfViagem(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  return (
    <AdminShell titulo="Lista de passageiros">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/viagens">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <Button onClick={exportar} disabled={!data || gerando}>
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar PDF
        </Button>
      </div>

      {isPending ? (
        <div className="superficie flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : null}

      {data ? (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold capitalize">{dataExtenso(data.viagem.data)}</h2>

          {data.trechos.map((t) => (
            <section key={`${t.onibus.id}-${t.trecho}`} className="superficie overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                <div>
                  <p className="font-semibold">
                    {t.onibus.nome}
                    {t.onibus.rota ? ` · ${t.onibus.rota}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.trecho === "ida" ? "Ida" : "Volta"} · {t.origem} &rarr; {t.destino} · {t.horario}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {t.passageiros.length} / {t.onibus.capacidade}
                </p>
              </header>

              {t.passageiros.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum passageiro neste trecho.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2">Poltrona</th>
                        <th className="px-4 py-2">Nome</th>
                        <th className="px-4 py-2">Matrícula</th>
                        <th className="px-4 py-2">Curso</th>
                        <th className="px-4 py-2">Tipo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {t.passageiros.map((p) => (
                        <tr key={p.poltrona}>
                          <td className="px-4 py-2 font-semibold tabular-nums">{p.poltrona}</td>
                          <td className="px-4 py-2">{p.nome}</td>
                          <td className="px-4 py-2">{p.matricula}</td>
                          <td className="px-4 py-2">{p.curso}</td>
                          <td className="px-4 py-2 text-muted-foreground">{ROTULO_TIPO[p.tipo]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </AdminShell>
  );
}
