# Área do aluno + identidade institucional de Pacujá

## 1. Arquivos que serão alterados

**Novos**
- `src/routes/aluno.index.tsx` — nova área inicial do aluno (boas-vindas, alerta, Meus dados, Próximo transporte, Minha solicitação, Histórico).
- `src/routes/aluno.solicitar.tsx` — fluxo de solicitação atual (cards de datas/ônibus/poltrona), movido para cá.
- `src/routes/aluno.route.tsx` — layout do aluno com cabeçalho institucional (logo, título, "Olá, Nome", Sair).
- `src/components/CabecalhoInstitucional.tsx`, `src/components/CartaoMeusDados.tsx`, `src/components/HistoricoSolicitacoes.tsx`.

**Alterados**
- `src/routes/index.tsx` — login redesenhado (card branco centralizado, logo, textos institucionais, mensagens de erro exatas).
- `src/routes/aluno.tsx` → vira layout (`aluno.route.tsx`) e o conteúdo atual migra para `aluno.solicitar.tsx`; `CartaoViagem.tsx` é reaproveitado sem reescrita da lógica.
- `src/styles.css` — paleta institucional (fundo claro, cards brancos, azul institucional como cor de ação, neutros para texto, verde/âmbar/vermelho só para estados), tipografia legível, sombras discretas.
- `src/lib/tipos.ts`, `src/lib/esquemas.ts`, `src/lib/transporte.server.ts`, `src/lib/transporte.functions.ts` — novos campos do aluno, histórico e status.
- `src/routes/admin.alunos.tsx` — formulário e detalhes passam a incluir os novos campos cadastrais.
- `src/routes/__root.tsx` — fontes/metadados institucionais.

## 2. Banco de dados

Migração incremental (nada é apagado):

- `alunos`: novos campos opcionais — nascimento, RG, endereço, telefone, e-mail, dias da semana (lista) e início das aulas. RG e CPF ficam separados.
- `solicitacoes`: novos campos `status` (confirmada / cancelada / encerrada / viagem_cancelada), `cancelada_em`, e cópia da poltrona de ida e volta para preservar o histórico mesmo após liberação do assento.
- Índice único parcial garantindo **uma solicitação ativa** por aluno/data (as canceladas permanecem no banco).
- Funções `reservar_transporte` e `cancelar_transporte` ajustadas: cancelar passa a marcar a solicitação como cancelada e liberar o assento, em vez de apagar o registro; reservar reaproveita/atualiza a solicitação ativa e grava as poltronas.
- `created_at` / `updated_at` (já existentes) continuam sendo a fonte de verdade da data/hora, sempre gerada pelo banco.

## 3. Funções de servidor

- `painelInicialAlunoFn` — devolve: aluno completo, próxima data disponível com status da janela, solicitação atual e histórico. Uma única chamada, sempre filtrada pelo aluno da sessão (cookie assinado), sem aceitar id vindo do cliente.
- `historicoAlunoFn` — histórico com data, saída de Pacujá, ida/volta, criado em, status e detalhes (ônibus, rota, poltronas).
- `salvarAlunoFn` / `detalhesAlunoFn` — passam a tratar os novos campos.
- Validação de janela continua no banco (`reservar_transporte`), então bloquear o botão no frontend é apenas visual: o backend recusa de qualquer forma.

## 4. Regras de negócio

- Botão principal muda conforme a janela: "Solicitar transporte" / "Solicitações ainda não abertas" / "Solicitações encerradas".
- Aluno inativo é bloqueado no login e na reserva.
- Aluno só enxerga os próprios dados; nada de cadastro fica fixo no código.
- Ida e volta no histórico usam X e -.
- Cancelamento preserva o histórico.

## 5. Riscos e mitigação

- **Rotas do aluno**: mover `/aluno` para layout + filhos pode quebrar links; `/aluno` continuará abrindo a área inicial e o fluxo antigo fica em `/aluno/solicitar`.
- **Mudança em `cancelar_transporte`**: a liberação da poltrona precisa continuar funcionando; será testada com reserva → cancelamento → nova reserva.
- **Painel/PDF do admin**: passam a filtrar apenas solicitações ativas, para não listar canceladas.
- Testes ponta a ponta no navegador (mobile e desktop) antes de concluir.

## 6. Logo

Não vou criar logo fictícia. O cabeçalho e o login já ficam com um espaço reservado (placeholder discreto com as iniciais/brasão) pronto para receber o arquivo oficial quando você enviar.

## 7. Ordem de implementação

1. Migração do banco (campos do aluno, status/poltronas do histórico, funções).
2. Camada de tipos, esquemas e funções de servidor.
3. Identidade visual (tema) e tela de login.
4. Layout do aluno + área inicial (dados, próximo transporte, solicitação atual).
5. Histórico com detalhes.
6. Admin: novos campos no cadastro.
7. Testes no navegador e ajustes.

## 8. Dúvidas antes de começar

- Os novos campos (nascimento, RG, endereço, telefone, e-mail, dias da semana, início das aulas) são obrigatórios no cadastro do admin ou opcionais?
- Você tem o arquivo da logo oficial de Pacujá para eu já aplicar?
