# Change 005 — Baseline do portfólio: limpeza, qualidade e preparação de publicação

- Status: ARCHIVED
- Arquivada em: 2026-11-16
- Tipo: Melhoria de processo de engenharia
- Prioridade: Alta
- Data: 2026-11-15
- Relacionadas: `001-portfolio-mvp` (execução), `003-rawspec-v2` (arquivada), `004-rawspec-branch-per-task` (arquivada)

## 1. Objetivo

Deixar o projeto limpo, coerente e pronto para receber os dados reais, automatizar as verificações que hoje são manuais e preparar a publicação sem fixar o destino do deploy.

Concretamente:

- eliminar documentação e especificações obsoletas;
- alinhar o estado real do código com o estado registado nas tarefas;
- automatizar acessibilidade e responsividade, hoje dependentes de verificação manual;
- introduzir CI para complementar os hooks locais;
- desacoplar o conteúdo real dos dados de apresentação, mantendo placeholders seguros até à substituí-los;
- preparar a publicação de forma agnóstica ao destino do deploy.

## 2. Problema

O projeto acumulou três problemas de higiene:

1. **Documentação obsoleta.** `docs/rawspec-commands.md` documenta os comandos v1 e afirma que eles "ainda não existem". Substituído por `docs/rawspec-v2.md`.
2. **Especificações vazias e mortas.** `specs/specifications/{engineering,portfolio,security}/` não contêm ficheiros. `specs/changes/002-rawspec-task-commands/` está `SUPERSEDED` mas mantém nove tarefas `PENDING` que nunca serão executadas.
3. **Estado do código divergente do estado das tarefas.** As secções Início, Projetos, Habilidades e Contato já estão implementadas em `src/`, mas as respetivas tarefas (`TASK-005` a `TASK-008`) estão `PENDING`. As tarefas `TASK-001` a `TASK-004` estavam arquivadas apesar de o respetivo código ter evoluído depois.

Além disso, três critérios de aceitação da change 001 dependem hoje de verificação manual:

- acessibilidade (`TASK-009`);
- responsividade e performance (`TASK-010`);
- validação final (`TASK-011`).

E a preparação de publicação (`TASK-012`) não pode escolher um destino de deploy porque esse ainda não está decidido.

## 3. Escopo

### 3.1 Incluído

- Remover `docs/rawspec-commands.md` (documento v1 obsoleto).
- Arquivar a change `002-rawspec-task-commands` por estar `SUPERSEDED` e não concluível.
- Remover `specs/specifications/` por estar vazio, ou por manter apenas diretórios com documento de definição.
- Reexecutar as tasks `TASK-001` a `TASK-004` da change 001, revalidando o código existente.
- Alinhar as tasks `TASK-005` a `TASK-008` com o código já implementado.
- Adicionar testes automatizados de acessibilidade com `vitest-axe`.
- Adicionar testes end-to-end responsivos com Playwright.
- Adicionar CI com GitHub Actions (lint, typecheck, test, build).
- Separar o conteúdo editável do utilizador dos dados de apresentação, para que a substituição por dados reais seja localizada e segura.
- Documentar a preparação de publicação de forma agnóstica ao destino.
- Criar uma task de formação para configurar o CI e o deploy.

### 3.2 Fora do escopo

- Inserir dados reais do perfil, projetos ou habilidades. Serão adicionados depois, pela task correspondente.
- Escolher ou configurar o destino do deploy.
- Criar pull requests automaticamente.
- Escrever sobre `git rebase` ou reescrever histórico.
- Migrar o portfólio para outro framework ou adicionar dependências de runtime.
- Introduzir backend, base de dados ou autenticação.

## 4. Comportamento proposto

### 4.1 Limpeza

- `docs/rawspec-commands.md` é removido. `docs/rawspec-v2.md` é a referência única dos comandos.
- A change `002-rawspec-task-commands` é arquivada em `specs/changes/archive/`, preservando o histórico das duas tarefas concluídas.
- `specs/specifications/` passa a conter apenas diretórios com um ficheiro de índice que descreve o propósito de cada área, ou é removido se não houver specification válida.

### 4.2 Alinhamento do estado

As tasks da change 001 são reexecutadas na ordem de dependência. Cada task revalida o código existente em vez de reescrevê-lo, salvo se a revalidação revelar defeito.

As tasks `TASK-005` a `TASK-008` passam a descrever a revisão e a completagem da secção já implementada, com a substituição dos placeholders como trabalho da task de dados reais.

### 4.3 Automatização de acessibilidade

Um teste com `vitest-axe` percorre a aplicação renderizada e verifica ausência de violações WCAG 2.2 A/AA automáticas. O teste falha o `pnpm test` quando há violação.

O que a automação não cobre (foco visível, contraste real, ordem de leitura em leitor de ecrã) permanece como verificação manual e é registado como tal na evidência da task.

### 4.4 Automatização de responsividade

Testes Playwright verificam, em três viewports (celular 375px, tablet 768px, desktop 1440px):

- ausência de scroll horizontal;
- presença e visibilidade dos quatro links de navegação;
- presença da fotografia, com caixa não nula;
- integridade dos links de contacto.

Os testes correm sobre o servidor de preview do build de produção, para validar o artefacto que será publicado.

### 4.5 Integração contínua

Um workflow GitHub Actions corre em cada push e pull request:

1. instalação com pnpm;
2. `pnpm lint`;
3. `pnpm typecheck`;
4. `pnpm test`;
5. `pnpm build`;
6. execução dos testes Playwright.

Os hooks locais do Husky mantêm-se como garantia local, conforme ADR-005 e o design da change 001.

### 4.6 Conteúdo e dados

O conteúdo do utilizador passa a viver em `src/content/`, com ficheiros separados para perfil, projetos e habilidades. `src/data/` passa a ser o ponto de importação único, mantendo os componentes intactos.

Os placeholders são removidos dos ficheiros de conteúdo e substituídos por listas vazias com mensagens de estado coerentes. O critério de aceitação "sem informações inventadas" passa a ser garantido pela estrutura: sem dados, não há texto fictício na página.

A task de dados reais fica disponível para preencher `src/content/` quando o utilizador fornecer a informação.

### 4.7 Publicação

A documentação de publicação deixa de assumir um destino. Descreve os requisitos que qualquer hospedagem estática precisa de satisfazer (build, diretório de output, SPA fallback, cache de assets com hash) e lista os candidatos com o respetivo custo e complexidade.

Uma task de formação explica, passo a passo, como configurar o CI e como publicar, para quando o destino for decidido.

## 5. Requisitos

### 5.1 Funcionais

- **RF-01** — Nenhum ficheiro de documentação obsoleto permanece no repositório.
- **RF-02** — Nenhuma change `SUPERSEDED` mantém tarefas executáveis.
- **RF-03** — Não existem diretórios vazios em `specs/`.
- **RF-04** — As tasks `TASK-001` a `TASK-004` da change 001 são reexecutadas e revalidadas.
- **RF-05** — As tasks `TASK-005` a `TASK-008` refletem o estado real do código.
- **RF-06** — `pnpm test` falha quando existe violação de acessibilidade automática.
- **RF-07** — Existe teste automatizado que falha em overflow horizontal em qualquer um dos três viewports.
- **RF-08** — Existe workflow CI que executa lint, typecheck, test, build e Playwright.
- **RF-09** — O conteúdo do utilizador está isolado em `src/content/`.
- **RF-10** — Não existe texto de placeholder na aplicação renderizada.
- **RF-11** — A documentação de publicação não assume destino de deploy.
- **RF-12** — Existe uma task de formação para CI e deploy.

### 5.2 Não funcionais

- **RNF-01** — Nenhuma dependência de runtime nova é adicionada à aplicação.
- **RNF-02** — As ferramentas de teste são dependências de desenvolvimento.
- **RNF-03** — Os testes Playwright correm contra o build de produção, não contra o servidor de desenvolvimento.
- **RNF-04** — Os hooks locais do Husky não são removidos nem afrouxados.
- **RNF-05** — O histórico Git não é reescrito.
- **RNF-06** — A execução da change 001 mantém a change 002 inalterada, salvo a marcação de arquivamento.

## 6. Critérios de aceitação

- `docs/rawspec-commands.md` foi removido e `docs/rawspec-v2.md` é a referência dos comandos.
- A change `002-rawspec-task-commands` está em `specs/changes/archive/`.
- `specs/specifications/` não tem diretórios vazios.
- As doze tasks da change 001 têm estado coerente com o código.
- `vitest-axe` está instalado e um teste de acessibilidade está em `pnpm test`.
- O teste de acessibilidade falha quando uma violação é introduzida, comprovado por execução.
- Playwright está instalado e os testes responsivos passam nos três viewports.
- O workflow de CI está presente e executa as seis etapas.
- O conteúdo do utilizador está em `src/content/` e `src/data/` reexporta.
- A aplicação renderizada não contém nenhum placeholder.
- A documentação de publicação é agnóstica ao destino e lista candidatos.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build` passam.
- Nenhum commit ou push foi feito sem a sequência da branch por tarefa.

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Reexecutar tasks já concluídas desperdiça esforço. | Cada task revalida primeiro e só altera o que a validação reprovar. |
| `vitest-axe` acusar violações pré-existentes não corrigíveis no escopo. | O primeiro teste reporta o inventário; cada violação é triada e resolvida ou registada como plano de ação. |
| Playwright exigir download de browser em ambientes restritos. | O teste e2e fica em script separado (`test:e2e`) e não entra no `pre-push`; o CI executa-o com o browser oficial. |
| O teste e2e ser instável em CI. | Viewports fixos, sem animações, sem dependência de rede externa. |
| Isolar o conteúdo quebrar importações. | `src/data/` mantém os mesmos nomes de exportação; os componentes não mudam. |
| Remover a change 002 perder histórico. | É arquivada, não apagada; as duas tarefas concluídas e as evidências são preservadas. |
| A documentação de publicação ficar genérica demais. | Lista requisitos concretos e candidatos com custo, para decisão posterior. |

## 8. Decisões confirmadas

1. Os dados reais serão adicionados posteriormente; o trabalho agora prepara a estrutura para os receber.
2. As dependências da change 001 podem ser relaxadas para permitir execução paralela de secções independentes.
3. As tasks podem ser alinhadas com o código real e reexecutadas com revalidação.
4. A limpeza de documentação e especificações obsoletas está autorizada.
5. A correção da change 002 fica a critério de implementação, desde que o projeto fique limpo e coerente.
6. O conteúdo é isolado em `src/content/`.
7. A acessibilidade é automatizada com `vitest-axe`.
8. A responsividade é automatizada com Playwright.
9. O CI entra no repositório como workflow pronto a configurar.
10. O destino do deploy permanece em aberto; a documentação descreve requisitos e candidatos.
11. A task de formação para CI e deploy fica na fila.

## 9. Aprovação

Aprovada por decisão humana em 2026-11-15. A execução das tasks desta mudança pode começar de imediato.
