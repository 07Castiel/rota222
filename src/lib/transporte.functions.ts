import { createServerFn } from "@tanstack/react-start";
import {
  esquemaAluno,
  esquemaAlunoId,
  esquemaAtivo,
  esquemaBusca,
  esquemaCpf,
  esquemaLoteViagens,
  esquemaOnibus,
  esquemaOnibusAtivo,
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

export const inicioAlunoFn = createServerFn({ method: "GET" }).handler(async () => {
  const { inicioAluno } = await import("./transporte.server");
  return inicioAluno();
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
    return listarAlunos(data.busca, data.status);
  });

export const detalhesAlunoFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => esquemaAlunoId.parse(d))
  .handler(async ({ data }) => {
    const { detalhesAluno } = await import("./transporte.server");
    return detalhesAluno(data.id);
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

export const listarOnibusAdminFn = createServerFn({ method: "GET" }).handler(async () => {
  const { listarOnibusAdmin } = await import("./transporte.server");
  return listarOnibusAdmin();
});

export const salvarOnibusFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaOnibus.parse(d))
  .handler(async ({ data }) => {
    const { salvarOnibus } = await import("./transporte.server");
    return salvarOnibus(data);
  });

export const alternarOnibusAtivoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaOnibusAtivo.parse(d))
  .handler(async ({ data }) => {
    const { alternarOnibusAtivo } = await import("./transporte.server");
    await alternarOnibusAtivo(data.id, data.ativo);
    return { ok: true };
  });

export const criarViagensEmLoteFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaLoteViagens.parse(d))
  .handler(async ({ data }) => {
    const { criarViagensEmLote } = await import("./transporte.server");
    return criarViagensEmLote(data);
  });

export const resumoAdminFn = createServerFn({ method: "GET" }).handler(async () => {
  const { resumoAdmin } = await import("./transporte.server");
  return resumoAdmin();
});

export const excluirAlunoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => esquemaAlunoId.parse(d))
  .handler(async ({ data }) => {
    const { excluirAluno } = await import("./transporte.server");
    await excluirAluno(data.id);
    return { ok: true };
  });
