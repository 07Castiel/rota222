import { createServerFn } from "@tanstack/react-start";
import {
  esquemaAluno,
  esquemaAtivo,
  esquemaBusca,
  esquemaCpf,
  esquemaReserva,
  esquemaSenhaAdmin,
  esquemaStatusViagem,
  esquemaViagem,
  esquemaViagemId,
} from "./esquemas";

export const entrarComCpfFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaCpf.parse(d))
  .handler(async ({ data }) => {
    const { entrarComCpf } = await import("./transporte.server");
    return entrarComCpf(data.cpf);
  });

export const sairAlunoFn = createServerFn({ method: "POST" }).handler(async () => {
  const { sairAluno } = await import("./transporte.server");
  sairAluno();
  return { ok: true };
});

export const painelDoAlunoFn = createServerFn({ method: "GET" }).handler(async () => {
  const { painelDoAluno } = await import("./transporte.server");
  return painelDoAluno();
});

export const reservarFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaReserva.parse(d))
  .handler(async ({ data }) => {
    const { reservar } = await import("./transporte.server");
    return reservar(data);
  });

export const cancelarFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaViagemId.parse(d))
  .handler(async ({ data }) => {
    const { cancelar } = await import("./transporte.server");
    await cancelar(data.viagemId);
    return { ok: true };
  });

export const entrarAdminFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaSenhaAdmin.parse(d))
  .handler(async ({ data }) => {
    const { entrarAdmin } = await import("./transporte.server");
    await entrarAdmin(data.senha);
    return { ok: true };
  });

export const sairAdminFn = createServerFn({ method: "POST" }).handler(async () => {
  const { sairAdmin } = await import("./transporte.server");
  sairAdmin();
  return { ok: true };
});

export const sessaoAdminFn = createServerFn({ method: "GET" }).handler(async () => {
  const { ehAdmin } = await import("./session.server");
  return { admin: await ehAdmin() };
});

export const listarAlunosFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => esquemaBusca.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { listarAlunos } = await import("./transporte.server");
    return listarAlunos(data.busca);
  });

export const salvarAlunoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaAluno.parse(d))
  .handler(async ({ data }) => {
    const { salvarAluno } = await import("./transporte.server");
    return salvarAluno(data);
  });

export const alternarAtivoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaAtivo.parse(d))
  .handler(async ({ data }) => {
    const { alternarAtivo } = await import("./transporte.server");
    await alternarAtivo(data.id, data.ativo);
    return { ok: true };
  });

export const listarViagensFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listarViagens } = await import("./transporte.server");
  return listarViagens();
});

export const salvarViagemFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaViagem.parse(d))
  .handler(async ({ data }) => {
    const { salvarViagem } = await import("./transporte.server");
    return salvarViagem(data);
  });

export const alterarStatusViagemFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaStatusViagem.parse(d))
  .handler(async ({ data }) => {
    const { alterarStatusViagem } = await import("./transporte.server");
    await alterarStatusViagem(data.id, data.status);
    return { ok: true };
  });

export const painelViagemFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => esquemaViagemId.parse(d))
  .handler(async ({ data }) => {
    const { painelViagem } = await import("./transporte.server");
    return painelViagem(data.viagemId);
  });
