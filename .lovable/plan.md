# MVP — Transporte Universitário de Pacujá

## Análise do estado atual

- **Stack**: TanStack Start v1 (React 19 + Vite 7), TanStack Router com rotas em `src/routes`, TanStack Query, Tailwind v4 com design system em `src/styles.css`, componentes shadcn já disponíveis em `src/components/ui`.
- **Backend**: não existe. Não há banco, autenticação nem integrações (`src/integrations` não existe). Só há a página placeholder em `src/routes/index.tsx`.
- **Conclusão**: será preciso ativar o Lovable Cloud (banco Postgres + funções de servidor) para atender às exigências de validação no backend, transações e controle de concorrência. Toda lógica crítica ficará em *server functions* (`createServerFn`), nunca no frontend.

## Modelagem de dados (mínima e expansível)

- **alunos** — `id`, `nome`, `cpf` (11 dígitos, único), `matricula`, `curso`, `instituicao`, `ativo`, timestamps.
- **onibus** — `id`, `codigo` (ONIBUS_01/02/03), `nome`, `rota` (ROTA01/ROTA02/null), `descricao_rota`, `capacidade` (46), `hora_ida`, `hora_volta`, `ativo`.
- **viagens** — `id`, `data`, `abertura_em`, `fechamento_em`, `status` (rascunho/aberta/fechada/cancelada), único por data.
- **solicitacoes** — `id`, `viagem_id`, `aluno_id`, `tipo` (ida/volta/ida_volta), `onibus_ida_id`, `onibus_volta_id`, `status`, timestamps. Único `(viagem_id, aluno_id)` → impede duplicidade.
- **assentos** — uma linha por poltrona efetivamente ocupada: `id`, `viagem_id`, `onibus_id`, `trecho` (ida/volta), `numero` (1..46), `solicitacao_id`. **Constraint única `(viagem_id, onibus_id, trecho, numero)`** — esta é a garantia de que dois alunos nunca ocupam a mesma poltrona no mesmo trecho, e é o mecanismo que resolve concorrência.

A capacidade fica na tabela `onibus`, não espalhada no código. Ida e volta são contadas separadamente porque `assentos` é indexado por trecho.

## Regras no servidor (função Postgres transacional)

Uma função `criar_ou_atualizar_solicitacao` em SQL (`SECURITY DEFINER`) fará, dentro de uma única transação:

1. Validar aluno (existe, ativo).
2. Validar janela: `now()` entre `abertura_em` e `fechamento_em` e viagem `aberta` — sempre com o relógio do banco.
3. Liberar assentos anteriores do aluno naquela viagem (em caso de alteração/cancelamento).
4. Bloquear o ônibus/trecho (`SELECT ... FOR UPDATE` na viagem/ônibus) e escolher a menor poltrona livre; em ida e volta, tentar o mesmo número nos dois trechos, com fallback para o próximo livre.
5. Recusar se `ocupados >= capacidade`.
6. Inserir solicitação + assentos; a constraint única é a rede de segurança final.

## Autenticação

- **Aluno**: login apenas por CPF. Normalização (só dígitos) + validação de dígitos verificadores no servidor. Server function `entrarComCpf` verifica cadastro e status ativo e emite um cookie de sessão assinado `HttpOnly` com o `aluno_id`. Toda ação do aluno lê o id **da sessão**, nunca do corpo da requisição — impede manipular solicitação de terceiros.
- **Admin**: autenticação por senha (segredo do administrador armazenado como secret do Cloud), com sessão própria em cookie `HttpOnly`. Rotas e server functions administrativas validam essa sessão no servidor.
- RLS ativada em todas as tabelas, sem acesso público direto; o acesso é feito pelas server functions.

## Telas

**Aluno (mobile-first)**
- `/` — entrada com CPF.
- `/aluno` — saudação, lista de datas abertas, escolha de tipo (ida / volta / ida e volta), escolha de ônibus/rota com contador `37/46` e opção "LOTADO" desabilitada, confirmação.
- Após confirmar: cartão com data, tipo, horário, ônibus, rota e poltrona(s), com botões alterar/cancelar enquanto a janela estiver aberta.

**Admin**
- `/admin/login`
- `/admin/alunos` — cadastrar, editar, ativar/inativar, pesquisar.
- `/admin/viagens` — criar data, abertura, fechamento, status, encerrar/cancelar.
- `/admin/viagens/$id` — painel de ocupação por ônibus/trecho e lista de passageiros por poltrona (ida e volta separadas), com exportação.

## PDF

Geração no cliente com `jspdf` + `jspdf-autotable` a partir dos dados retornados pelo servidor. Três opções: PDF por ônibus, por trecho e completo do dia. Cabeçalho com nome do sistema, data, ônibus, rota, horário e trecho; tabela com poltrona, nome, matrícula, curso e tipo; rodapé com total, capacidade e vagas.

## Etapas de implementação

1. Ativar Lovable Cloud; migração com tabelas, grants, RLS, constraints e seed dos 3 ônibus.
2. Função SQL transacional de reserva + funções de liberação/cancelamento.
3. Sessões (aluno por CPF, admin por senha) e server functions com verificação de sessão.
4. Design system e login do aluno + fluxo de solicitação (mobile-first).
5. Área administrativa: alunos e viagens.
6. Painel de ocupação e lista de passageiros.
7. Exportação PDF.
8. Teste ponta a ponta do fluxo do critério de conclusão (incluindo concorrência na última vaga).

## Riscos técnicos

- **Concorrência**: resolvida por transação + constraint única; o frontend apenas reflete o resultado.
- **Fuso horário**: datas/horários armazenados em `timestamptz` e comparados com `now()` no banco; interface exibe em America/Fortaleza (UTC-3).
- **Sessão sem senha do aluno**: CPF é identificador fraco; mitigado com cookie `HttpOnly` e verificação de propriedade no servidor. Senha/OTP fica para depois.

## Decisões pendentes (preciso da sua confirmação)

1. **Senha do admin**: definir uma senha única de administrador (guardada como secret) está ok, ou prefere login por e-mail/senha com contas?
2. **Ônibus 01 (manhã)**: ele tem rota definida? Hoje só tem horários (05:30 / 11:00) e capacidade 46 — confirmo capacidade 46 também para ele?
3. **Ida e volta em ônibus diferentes**: o aluno pode ir no Ônibus 02 e voltar no Ônibus 01, por exemplo, ou a ida e a volta devem ser sempre no mesmo ônibus?
4. **Ônibus 01 à tarde**: na volta das 11:00, apenas o Ônibus 01 aparece — confirmado que ele não atende o turno da tarde?
