# Análise do MVP e principais melhorias

Revisei as camadas do sistema: sessão (`src/lib/session.server.ts`), regras de servidor (`src/lib/transporte.server.ts`, 538 linhas), rotas do aluno e do admin, PDF e o esquema do banco (alunos, onibus, viagens, solicitacoes, assentos, admin_config, funções `reservar_transporte`, `cancelar_transporte`, `ocupacao_viagem`).

O núcleo está sólido: reserva transacional no banco, poltrona por trecho, histórico preservado, cookies assinados HttpOnly, acesso ao banco só por funções de servidor. As melhorias abaixo estão em ordem de prioridade (correção > segurança > dados > usabilidade).

## 1. Segurança (prioridade máxima)

- **Segredo de sessão derivado da chave do backend**: o HMAC do cookie usa a chave de serviço como segredo. Deve usar um segredo próprio e dedicado, para que trocar uma coisa não quebre nem exponha a outra.
- **Senha única de admin, sem proteção contra tentativas**: qualquer pessoa pode tentar senhas ilimitadamente em `/admin/login`. Adicionar limite de tentativas por IP com bloqueio temporário, e registrar tentativas.
- **Login do aluno por CPF sem limite**: hoje é possível varrer CPFs para descobrir quem está cadastrado. Adicionar limite de tentativas e mensagem de erro uniforme.
- **Contas de administrador individuais** (opcional, maior esforço): substituir a senha única por usuários com e-mail e senha, para saber quem fez cada alteração.

## 2. Consistência de dados e regras

- **Encerramento automático de viagens**: hoje o status "encerrada" depende de ação manual. Uma rotina diária deve fechar a janela e marcar solicitações passadas como encerradas.
- **Trilha de auditoria**: registrar quem criou/editou/inativou aluno, criou viagem ou cancelou solicitação, com data/hora.
- **Validação de CPF duplicado com mensagem clara** no cadastro do admin (hoje o erro do banco aparece cru em alguns casos).
- **Regras de cancelamento**: definir prazo limite para o aluno cancelar (ex.: até o fechamento da janela) e o que acontece após — atualmente depende só da janela.

## 3. Funcionalidades administrativas que faltam

- **CRUD de ônibus**: os 3 ônibus são fixos no banco. O admin deveria criar, editar horários/rotas/capacidade e ativar/inativar sem migração.
- **Criação de viagens em lote**: gerar as datas do mês/semestre de uma vez (ex.: seg a sex), em vez de uma por uma.
- **Painel resumo (`/admin`)**: hoje é praticamente vazio. Mostrar próxima viagem, total de solicitações, ocupação por ônibus e alertas de lotação.
- **Lista de espera**: quando um ônibus lota, permitir entrar na fila e promover automaticamente quando alguém cancelar.
- **Exportação CSV** além do PDF, e PDF com lista de presença (coluna para assinatura).
- **Remanejar aluno de poltrona/ônibus** manualmente pelo admin.

## 4. Experiência do aluno

- **Escolher a poltrona** (mapa de assentos) em vez de receber sempre a próxima livre — ou ao menos indicar preferência.
- **Solicitação recorrente**: marcar os dias fixos da semana e o sistema reservar automaticamente quando a janela abrir.
- **Aviso de janela abrindo/fechando**: contagem regressiva e notificação (e-mail ou WhatsApp) quando as solicitações abrirem.
- **Reforço do alerta de dados desatualizados** com canal direto de contato com a responsável.
- **PWA / instalável no celular**, já que o uso é predominantemente mobile.

## 5. Qualidade técnica

- **Testes automatizados** (Vitest) das regras críticas: reserva concorrente na última vaga, cancelamento e recontagem, janela fechada, aluno inativo. Hoje a validação é manual via navegador.
- **Quebrar `transporte.server.ts`** (538 linhas) em módulos por domínio: alunos, viagens, reservas, painel.
- **Tratamento de sessão expirada**: padronizar redirecionamento para o login com mensagem, em vez de erro genérico.
- **Acessibilidade**: revisar contraste, foco visível e rótulos ARIA nas tabelas e modais do admin.

## Sugestão de ordem

1. Segurança (segredo dedicado + limites de tentativa).
2. Encerramento automático + auditoria.
3. CRUD de ônibus + criação de viagens em lote + painel resumo.
4. Lista de espera e escolha de poltrona.
5. Testes automatizados e refatoração do módulo de servidor.

Me diga quais blocos você quer que eu implemente primeiro e eu detalho o plano de execução deles.
