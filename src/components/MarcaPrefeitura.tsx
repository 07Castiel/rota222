import { Landmark } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Espaço reservado para o brasão oficial da Prefeitura Municipal de Pacujá.
 * Basta trocar o conteúdo interno por <img src={...} alt="Brasão de Pacujá" />
 * quando o arquivo oficial estiver disponível — nenhuma logo fictícia é usada.
 */
export function MarcaPrefeitura({
  tamanho = "md",
  className,
}: {
  tamanho?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Espaço reservado ao brasão oficial da Prefeitura Municipal de Pacujá"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-current/20 bg-current/10",
        tamanho === "lg" ? "h-16 w-16" : "h-11 w-11",
        className,
      )}
    >
      <Landmark className={tamanho === "lg" ? "h-8 w-8" : "h-6 w-6"} aria-hidden="true" />
    </div>
  );
}
