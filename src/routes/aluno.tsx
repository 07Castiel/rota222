import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarcaPrefeitura } from "@/components/MarcaPrefeitura";
import { inicioAlunoFn, sairAlunoFn } from "@/lib/transporte.functions";

export const Route = createFileRoute("/aluno")({
  component: LayoutAluno,
});

function LayoutAluno() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const carregar = useServerFn(inicioAlunoFn);
  const sair = useServerFn(sairAlunoFn);

  const { data, error } = useQuery({
    queryKey: ["inicio-aluno"],
    queryFn: () => carregar(),
    retry: false,
  });

  useEffect(() => {
    if (error) navigate({ to: "/" });
  }, [error, navigate]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="faixa-marca px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MarcaPrefeitura />
            <div className="leading-tight">
              <p className="text-sm font-bold">Prefeitura Municipal de Pacujá</p>
              <p className="text-xs opacity-85">Sistema de Transporte Universitário</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/15"
            onClick={async () => {
              await sair();
              queryClient.clear();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Sair</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
