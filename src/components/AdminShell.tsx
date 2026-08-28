import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { Bus, CalendarDays, Home, Loader2, LogOut, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sairAdminFn, sessaoAdminFn } from "@/lib/transporte.functions";
import { cn } from "@/lib/utils";

const ABAS = [
  { para: "/admin", rotulo: "Início", icone: Home, exato: true },
  { para: "/admin/viagens", rotulo: "Viagens", icone: CalendarDays, exato: false },
  { para: "/admin/alunos", rotulo: "Alunos", icone: Users, exato: false },
  { para: "/admin/onibus", rotulo: "Ônibus", icone: Bus, exato: false },
] as const;

export function AdminShell({ titulo, children }: { titulo: string; children: ReactNode }) {
  const navigate = useNavigate();
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const verificar = useServerFn(sessaoAdminFn);
  const sair = useServerFn(sairAdminFn);

  const { data, isPending } = useQuery({
    queryKey: ["sessao-admin"],
    queryFn: () => verificar(),
    retry: false,
  });

  useEffect(() => {
    if (data && !data.admin) navigate({ to: "/admin/login" });
  }, [data, navigate]);

  if (isPending || !data?.admin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="faixa-marca">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Painel administrativo</p>
            <h1 className="text-xl font-bold">{titulo}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/15"
            onClick={async () => {
              await sair();
              navigate({ to: "/admin/login" });
            }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-5">
          {ABAS.map((a) => (
            <Link
              key={a.para}
              to={a.para}
              className={cn(
                "flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                (a.exato ? caminho === a.para || caminho === "/admin/" : caminho.startsWith(a.para))
                  ? "bg-background text-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10",
              )}
            >
              <a.icone className="h-4 w-4" />
              {a.rotulo}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
