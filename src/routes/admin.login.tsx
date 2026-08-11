import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { entrarAdminFn } from "@/lib/transporte.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Transporte de Pacujá" },
      {
        name: "description",
        content: "Acesso restrito à administração do transporte universitário de Pacujá.",
      },
      { property: "og:title", content: "Painel administrativo — Transporte de Pacujá" },
      { property: "og:description", content: "Acesso restrito à administração do transporte." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginAdmin,
});

function LoginAdmin() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const entrar = useServerFn(entrarAdminFn);

  const mutation = useMutation({
    mutationFn: () => entrar({ data: { senha } }),
    onSuccess: () => navigate({ to: "/admin/viagens" }),
    onError: (e: Error) => setErro(e.message),
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="superficie w-full max-w-sm p-6">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-semibold">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe a senha de acesso da administração.
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setErro(null);
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => {
                setErro(null);
                setSenha(e.target.value);
              }}
              className="h-11"
            />
          </div>
          {erro ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>
          ) : null}
          <Button type="submit" className="h-11 w-full" disabled={mutation.isPending || senha.length < 4}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>
      </section>
    </main>
  );
}
