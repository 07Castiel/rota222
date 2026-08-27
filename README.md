# Pacujá Mobilidade

PROMPT — MVP DO SISTEMA DE TRANSPORTE UNIVERSITÁRIO DE PACUJÁ

Quero desenvolver um MVP funcional de um sistema de transporte universitário, inicialmente destinado aos alunos que saem de Pacujá-CE para estudar em Sobral-CE.

O objetivo neste momento NÃO é criar um sistema completo ou excessivamente complexo. Quero um MVP simples, funcional, seguro e bem estruturado, que resolva o problema operacional principal e possa ser expandido posteriormente.

Antes de implementar qualquer coisa, analise o projeto existente, a stack, a estrutura de arquivos e o banco de dados. Não faça alterações imediatamente.

1. OBJETIVO DO MVP

O sistema deverá permitir que:

ALUNO

O aluno poderá:

Acessar o sistema através do próprio CPF.

Ser identificado pelo CPF cadastrado.

Visualizar os dias disponíveis para solicitar transporte.

Escolher a data.

Informar se utilizará:

Apenas ida;

Apenas volta;

Ida e volta.

Confirmar sua solicitação.

Visualizar posteriormente:

Data;

Tipo de viagem;

Horário;

Ônibus;

Rota;

Poltrona atribuída.

ADMINISTRADOR

O administrador poderá:

Cadastrar alunos.

Visualizar alunos.

Criar uma viagem/data de transporte.

Definir quando as solicitações serão abertas.

Definir quando serão encerradas.

Visualizar passageiros.

Visualizar ocupação dos ônibus.

Visualizar poltronas.

Fechar a lista.

Exportar a lista em PDF.

Não implementar funcionalidades avançadas que não sejam necessárias para esse MVP.

2. AUTENTICAÇÃO DO ALUNO

Para o MVP, o aluno acessará utilizando apenas o:

CPF

Não haverá senha neste primeiro momento.

O sistema deverá:

Aceitar CPF com ou sem pontuação;

Normalizar o CPF;

Validar o CPF;

Verificar se o CPF está cadastrado;

Impedir acesso de aluno não cadastrado;

Impedir acesso de aluno inativo.

Exemplo:

123.456.789-00

deve ser tratado como:

12345678900

O CPF deverá ser único no cadastro.

3. CADASTRO DOS ALUNOS

O administrador deverá conseguir cadastrar alunos.

Campos mínimos:

Nome completo;

CPF;

Matrícula;

Curso;

Instituição;

Status ativo/inativo.

Para o MVP, não é necessário criar um cadastro público.

O cadastro será realizado pelo administrador.

4. JANELA DE SOLICITAÇÃO

O administrador deverá criar uma viagem/data.

Cada viagem deverá possuir:

Data;

Horário de abertura das solicitações;

Horário de fechamento das solicitações;

Status.

Exemplo:

Transporte — 15/08/2026

Abertura:

08/08/2026 às 08:00

Fechamento:

14/08/2026 às 18:00

Enquanto estiver aberta:

O aluno pode solicitar, alterar ou cancelar.

Depois do fechamento:

A lista fica bloqueada para os alunos.

O horário deverá ser validado pelo backend/banco, utilizando o horário oficial do sistema.

Não confiar no relógio do dispositivo do aluno.

5. OPÇÕES DO ALUNO

Ao solicitar transporte, o aluno deverá escolher exatamente uma opção:

APENAS IDA

Pacujá → Sobral

APENAS VOLTA

Sobral → Pacujá

IDA E VOLTA

Pacujá → Sobral

Sobral → Pacujá

6. HORÁRIOS DO TRANSPORTE

Existem três ônibus na operação.

ÔNIBUS 01 — MANHÃ

Ida

Pacujá → Sobral

Saída:

05:30

Chegada prevista:

07:00

Volta

Sobral → Pacujá

Saída:

11:00

Chegada prevista:

13:00

7. ÔNIBUS 02 — TARDE/NOITE

Saída de Pacujá:

16:50

Destino em Sobral:

ROTA01 — UNINTA e F5

Retorno:

21:30

Chegada prevista em Pacujá:

23:00

Capacidade:

46 alunos

8. ÔNIBUS 03 — TARDE/NOITE

Saída de Pacujá:

16:50

Destino em Sobral:

ROTA02 — Luciano Feijão e faculdades públicas

Retorno:

21:30

Chegada prevista em Pacujá:

23:00

Capacidade:

46 alunos

9. CAPACIDADE

Cada ônibus possui:

46 lugares

Esse valor deverá estar armazenado como configuração do ônibus, e não simplesmente espalhado pelo código.

Porém, para o MVP, todos os três ônibus terão capacidade inicial de 46 passageiros.

O sistema nunca poderá permitir mais passageiros do que a capacidade disponível.

10. REGRA MAIS IMPORTANTE — POLTRONAS

A atribuição de poltrona deve considerar o trecho da viagem.

Essa regra é fundamental.

Uma poltrona pode ser utilizada por:

Um aluno na ida;

Outro aluno diferente na volta.

Isso é permitido.

EXEMPLO

Aluno João:

Apenas ida

Pacujá → Sobral

Poltrona 10

Aluno Maria:

Apenas volta

Sobral → Pacujá

Poltrona 10

Isso é perfeitamente válido.

Eles não estão ocupando a mesma poltrona simultaneamente.

11. ALUNO QUE VAI E VOLTA

Se um aluno selecionar:

IDA E VOLTA

ele deverá ocupar uma poltrona na ida e uma poltrona na volta.

No MVP, podemos tentar manter a mesma poltrona nos dois trechos quando houver disponibilidade.

Porém, isso NÃO deve ser obrigatório.

Exemplo:

João:

IDA → Poltrona 15

VOLTA → Poltrona 15

Preferencialmente manter a mesma.

Mas:

IDA → Poltrona 15

VOLTA → Poltrona 22

também é válido.

A regra principal é:

Não pode existir conflito de poltrona dentro do mesmo trecho.

12. COMO A OCUPAÇÃO DEVE FUNCIONAR

Considere cada ônibus como tendo:

46 poltronas na ida

e

46 poltronas na volta

Portanto, um ônibus pode transportar:

46 pessoas na ida

e

46 pessoas na volta

mesmo que sejam pessoas completamente diferentes.

Isso NÃO significa que o ônibus possa transportar 92 pessoas simultaneamente.

Significa apenas que a capacidade é controlada separadamente por trecho.

13. ESCOLHA DO ÔNIBUS

Para o MVP, simplifique a regra.

Ônibus 01

Será utilizado para:

Pacujá → Sobral — 05:30

e

Sobral → Pacujá — 11:00

Ônibus 02

Será utilizado para:

Pacujá → Sobral — 16:50

ROTA01:

UNINTA e F5

e retorno:

Sobral → Pacujá — 21:30

Ônibus 03

Será utilizado para:

Pacujá → Sobral — 16:50

ROTA02:

Luciano Feijão e faculdades públicas

e retorno:

Sobral → Pacujá — 21:30

14. COMO DEFINIR A ROTA

Para o MVP, não criar um complexo sistema de roteirização.

Utilizar apenas as duas rotas:

ROTA01

UNINTA e F5

ROTA02

Luciano Feijão e faculdades públicas

O administrador deverá conseguir visualizar claramente qual rota pertence a cada ônibus.

15. COMO O ALUNO ESCOLHE

A interface deve ser extremamente simples.

Exemplo:

TRANSPORTE UNIVERSITÁRIO

Olá, João!

Escolha a data:

15/08/2026

Como você utilizará?

[ Apenas ida ]

[ Apenas volta ]

[ Ida e volta ]

Se escolher "Apenas ida", o sistema deverá apresentar as opções disponíveis:

05:30 — Ônibus 01

16:50 — Ônibus 02 — ROTA01

16:50 — Ônibus 03 — ROTA02

Se escolher "Apenas volta":

11:00 — Ônibus 01

21:30 — Ônibus 02 — ROTA01

21:30 — Ônibus 03 — ROTA02

Se escolher "Ida e volta":

O sistema deverá permitir selecionar uma opção de ida e uma opção de volta compatíveis.

16. IMPORTANTE — NÃO ESCOLHER ÔNIBUS AUTOMATICAMENTE SEM NECESSIDADE

O aluno deverá conseguir escolher entre as opções disponíveis quando houver mais de um ônibus.

Principalmente no período da tarde:

IDA — 16:50

Ônibus 02 — ROTA01 — UNINTA e F5

Ônibus 03 — ROTA02 — Luciano Feijão e faculdades públicas

O aluno deve selecionar o ônibus correspondente à instituição onde estuda.

17. CONTROLE DE LOTACÃO

Ao selecionar um ônibus:

O sistema deve mostrar algo como:

Ônibus 02

ROTA01 — UNINTA e F5

16:50

37 / 46 vagas ocupadas

9 vagas disponíveis

Se atingir 46:

46 / 46

LOTADO

A opção deverá ficar indisponível.

18. ATRIBUIÇÃO AUTOMÁTICA DE POLTRONA

Para o MVP, a atribuição deverá ser automática.

Exemplo:

Primeiro aluno:

Poltrona 01

Segundo:

Poltrona 02

Terceiro:

Poltrona 03

E assim por diante.

A atribuição deverá ser feita pelo backend/banco de dados.

Não confiar apenas no frontend.

19. CANCELAMENTO E ALTERAÇÃO

Enquanto a janela estiver aberta, o aluno poderá:

Cancelar;

Alterar o tipo de viagem;

Alterar o ônibus;

Alterar a rota/horário, quando aplicável.

Ao alterar:

A vaga anterior deverá ser liberada.

A poltrona anterior deverá ficar disponível.

A nova solicitação deverá passar novamente por todas as validações.

Depois do fechamento:

O aluno não poderá modificar a solicitação.

20. ADMINISTRADOR

Criar uma área administrativa separada.

O administrador deverá conseguir:

Alunos

Cadastrar;

Editar;

Ativar;

Inativar;

Pesquisar.

Viagens

Criar data;

Definir abertura;

Definir fechamento;

Visualizar status;

Encerrar/cancelar quando necessário.

Passageiros

Visualizar:

Nome;

Matrícula;

Curso;

Tipo de viagem;

Ônibus;

Rota;

Poltrona;

Status.

21. PAINEL DA VIAGEM

Para cada data, apresentar:

Ônibus 01

05:30 — Pacujá → Sobral

32 / 46

32 passageiros

14 vagas

Ônibus 02

16:50 — ROTA01

UNINTA e F5

41 / 46

41 passageiros

5 vagas

Ônibus 03

16:50 — ROTA02

Luciano Feijão e faculdades públicas

38 / 46

38 passageiros

8 vagas

22. LISTA DE PASSAGEIROS

O administrador deverá conseguir visualizar a lista organizada por:

Data;

Ônibus;

Rota;

Trecho.

Exemplo:

ÔNIBUS 02 — ROTA01

IDA — 16:50

PoltronaAlunoMatrículaCursoTipo01João Silva12345EngenhariaIda02Maria Souza12346PsicologiaIda e volta03Pedro Lima12347DireitoIda

E:

VOLTA — 21:30

PoltronaAlunoMatrículaCursoTipo01Carlos Lima12348AdministraçãoVolta02Maria Souza12346PsicologiaIda e volta

Observe que a poltrona 01 pode aparecer nos dois trechos com alunos diferentes.

Isso é esperado.

23. EXPORTAÇÃO PDF

Depois que a lista estiver fechada, o administrador deverá poder clicar:

EXPORTAR PDF

O sistema deverá gerar um PDF profissional.

De preferência, permitir:

PDF por ônibus

Exemplo:

Ônibus 02 — ROTA01

PDF por trecho

Ida — 16:50

ou

Volta — 21:30

Também pode existir uma opção:

PDF completo do dia

contendo todos os ônibus.

24. CONTEÚDO DO PDF

O PDF deverá conter:

Nome do sistema;

Data;

Ônibus;

Rota;

Horário;

Trecho;

Lista de passageiros;

Número da poltrona;

Nome;

Matrícula;

Curso;

Tipo de viagem;

Total de passageiros;

Capacidade;

Vagas disponíveis.

O documento deverá ser adequado para impressão.

25. REGRAS DE NEGÓCIO MÍNIMAS

O sistema deverá impedir:

CPF inválido;

CPF não cadastrado;

Aluno inativo;

Solicitação duplicada;

Solicitação fora do período aberto;

Alteração após fechamento;

Ônibus lotado;

Duas pessoas na mesma poltrona no mesmo trecho;

Poltrona inexistente;

Dois alunos utilizando a mesma vaga no mesmo trecho.

26. CONCORRÊNCIA

Esse ponto é obrigatório.

Se duas pessoas tentarem ocupar simultaneamente a última vaga de um ônibus, somente uma deverá conseguir.

Não implemente essa proteção apenas no JavaScript.

A regra deverá ser garantida pelo backend/banco de dados utilizando transação, constraint ou mecanismo equivalente.

27. BANCO DE DADOS DO MVP

Não criar um banco excessivamente complexo.

A estrutura deve ser suficiente para o MVP, mas organizada para futura expansão.

Como ponto de partida, considerar entidades como:

alunos

onibus

viagens

solicitacoes

poltronas

A estrutura final deverá ser definida após analisar os requisitos e a stack existente.

Não crie tabelas desnecessárias.

28. INTERFACE

A interface deve ser:

Simples;

Moderna;

Responsiva;

Rápida;

Intuitiva.

A prioridade é usabilidade, não quantidade de elementos visuais.

O aluno provavelmente utilizará o sistema principalmente pelo celular.

Portanto, o fluxo mobile deve ser excelente.

29. MVP — O QUE NÃO IMPLEMENTAR AGORA

NÃO implementar neste primeiro MVP:

Aplicativo mobile nativo;

WhatsApp;

QR Code;

Sistema de presença;

Rastreamento GPS;

Controle de motorista;

Pagamentos;

Notificações complexas;

Múltiplos níveis de administrador;

Relatórios avançados;

Mapa visual de assentos;

Integração com outras prefeituras;

Multi-tenant;

Sistema de roteirização automática.

Essas funcionalidades poderão ser adicionadas posteriormente.

30. SEGURANÇA

Mesmo sendo um MVP, não criar regras críticas apenas no frontend.

Validar no backend:

CPF;

Permissões;

Janela de solicitação;

Capacidade;

Poltrona;

Duplicidade;

Alterações;

Cancelamentos.

Um aluno não pode acessar dados administrativos.

Um aluno também não deve conseguir manipular a solicitação de outro aluno alterando IDs manualmente na requisição.

31. PRIMEIRA ETAPA — OBRIGATÓRIA

NÃO implemente imediatamente.

Primeiro:

Analise a arquitetura existente.

Identifique a tecnologia utilizada.

Analise o banco de dados.

Identifique como autenticação está sendo tratada.

Identifique a melhor forma de implementar as solicitações.

Modele as entidades necessárias.

Defina os relacionamentos.

Defina as regras de ocupação das poltronas.

Defina como controlar a capacidade.

Defina como tratar ida e volta.

Defina como gerar o PDF.

Identifique riscos técnicos.

Depois apresente um plano objetivo de implementação do MVP dividido em etapas.

Não altere nenhum arquivo antes de apresentar essa análise e receber minha autorização.

32. CRITÉRIO DE CONCLUSÃO DO MVP

O MVP somente será considerado concluído quando for possível executar este fluxo completo:

Administrador cadastra aluno

↓

Administrador cria uma data de transporte

↓

Administrador define abertura e fechamento

↓

Aluno acessa com CPF

↓

Aluno escolhe a data

↓

Aluno escolhe apenas ida, apenas volta ou ida e volta

↓

Aluno escolhe ônibus/rota quando necessário

↓

Sistema verifica disponibilidade

↓

Sistema atribui poltrona

↓

Solicitação é registrada

↓

Administrador acompanha a ocupação

↓

Horário de fechamento é atingido

↓

Lista é bloqueada

↓

Administrador visualiza a lista definitiva

↓

Administrador exporta PDF

Esse fluxo precisa funcionar de ponta a ponta antes de considerar o MVP pronto.

PRINCÍPIO FINAL

Quero um MVP pequeno, mas sólido.

Não quero excesso de funcionalidades.

Não quero arquitetura desnecessariamente complexa.

Não quero código duplicado.

Não quero regras críticas somente no frontend.

Não quero soluções improvisadas que dificultem a expansão posterior.

Priorize:

correção > segurança > consistência dos dados > usabilidade > estética > funcionalidades extras.

Se alguma decisão importante não estiver suficientemente definida, identifique-a antes da implementação em vez de simplesmente assumir uma regra de negócio.

Comece pela análise do projeto e pelo planejamento técnico. Aguarde minha aprovação antes de modificar qualquer coisa.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rota222.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1e33db39-6ab9-42ef-9a13-d67f62b99744).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
