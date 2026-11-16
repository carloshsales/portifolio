# Change 007 — Correcções de consistência do projecto

- Status: APPROVED
- Tipo: Correção
- Prioridade: Média
- Data: 2026-11-16
- Relacionadas: `001-portfolio-mvp`, `006-agent-orchestrator`

## 1. Objetivo

Corrigir três divergências entre a documentação e o comportamento real do
projecto, identificadas durante a execução da change 006.

## 2. Problema

### 2.1 O `commit-task` faz staging indiscriminado

`docs/rawspec-v2.md` §9 e `docs/projeto.md` §7.3 determinam que o staging
seja feito apenas em caminhos exactos do manifesto, e proíbem `git add -A`.
`scripts/rawspec-v2.mjs`, na função `commitAndPushTask`, executa `git add -A`.

O efeito foi observado na TASK-001 da change 006: o commit `de5ef71` levou 32
ficheiros em vez dos 3 declarados na task, incluindo todo o conteúdo da change
006 e da pasta `bakeoff/`.

O impacto não é apenas de higiene. O commit passou a incluir conteúdo de
tasks posteriores, o que viola a rastreabilidade que o RawSpec v2 existe para
garantir.

### 2.2 `docs/projeto.md` §7.3 contradiz a ADR-005

A secção 7.3 lista como restrição "não executar commits ou pushes sem
autorização explícita". A ADR-005 estabelece o oposto: toda tarefa usa branch
própria e, ao concluir com as verificações aprovadas, o commit e o push são
feitos automaticamente.

A divergência foi levantada ao utilizador, que confirmou a D1: o push é
automático desde que a qualidade e os testes passem.

### 2.3 `docs/projeto.md` §6.3 está obsoleto

A secção 6.3 diz: "A preferência actual é utilizar agentes nativos, sem
construir um orquestrador personalizado."

O orquestrador foi construído, arquivado na change 006 e documentado em
`docs/orquestrador.md`, com ADR-007. A frase descreve um estado anterior.

## 3. Escopo

### 3.1 Incluído

- **`commit-task` com staging por âmbito.** O `commit-task` passa a fazer
  staging apenas dos caminhos declarados em `## Arquivos` da task, mais os
  ficheiros de especificação que a CLI RawSpec actualizou. O gate de âmbito
  bloqueia o commit se sobrar algum ficheiro tocado fora do âmbito.
- **`docs/projeto.md` §7.3** alinhada com a ADR-005 e com a D1.
- **`docs/projeto.md` §6.3** reescrita para descrever o orquestrador.
- **Formatação** de dois ficheiros em `bakeoff/` que a suite de qualidade
  sinalizou depois de integrados no `main`.

### 3.2 Fora do escopo

- Alterar o comportamento da CLI RawSpec v2 noutros comandos.
- Alterar a ADR-005 ou a ADR-007.
- Executar worktrees para as tarefas desta change.
- Modificar a aplicação do portfólio.

## 4. Comportamento proposto

### 4.1 Staging por âmbito

O `commit-task` deixa de fazer `git add -A`. Passa a:

1. Ler a lista de `## Arquivos` da task.
2. Executar `git status --porcelain` para obter todos os ficheiros tocados.
3. Separar os ficheiros dentro do âmbito dos que estão fora.
4. Se houver ficheiros fora do âmbito, bloquear o commit e reportar.
5. Fazer staging apenas dos ficheiros dentro do âmbito, com caminhos
   explícitos.

Os ficheiros de especificação que a CLI actualizou — o ficheiro da task, o
plano de acção e o registo de histórico — são acrescentados ao âmbito, porque
são parte do trabalho da task. A lista de ficheiros de especificação é
derivada do `Change` declarado na task, e não de um glob.

### 4.2 Documentação

`docs/projeto.md` §7.3 passa a descrever a regra da ADR-005 com as cinco
condições, e remete para `docs/orquestrador.md` §5.2.

`docs/projeto.md` §6.3 passa a descrever os oito agentes, o pipeline de
oito etapas e a tabela de routing, com remissão para `docs/orquestrador.md`.

## 5. Requisitos

### 5.1 Funcionais

- R1. `commit-task` nunca executa `git add -A`.
- R2. `commit-task` faz staging apenas dos caminhos dentro do âmbito da task.
- R3. Um ficheiro tocado fora do âmbito bloqueia o commit.
- R4. `docs/projeto.md` §7.3 é coerente com a ADR-005.
- R5. `docs/projeto.md` §6.3 descreve o orquestrador existente.
- R6. A suíte de qualidade passa sem avisos de formatação.

### 5.2 Não funcionais

- N1. Nenhuma alteração ao contrato público da CLI.
- N2. Nenhuma alteração ao ciclo de vida das tasks.
- N3. Nenhuma alteração à aplicação do portfólio.

## 6. Critérios de aceitação

- `scripts/rawspec-v2.mjs` não contém `git add -A`.
- Um teste prova que uma escrita fora do âmbito impede o commit.
- Um teste prova que o staging inclui o ficheiro da task e os ficheiros
  declarados em `## Arquivos`.
- `docs/projeto.md` §6.3 e §7.3 coerentes com a ADR-005, a ADR-007 e
  `docs/orquestrador.md`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e` e
  `prettier --check` passam.

## 7. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| O staging por âmbito deixar de incluir ficheiros necessários | Médio | A lista de especificação é derivada da task, e o gate reporta o que ficou de fora em vez de falhar silenciosamente |
| A correcção alterar o comportamento de commits já existentes | Alto | A mudança só afecta `commit-task`, e a CLI tem testes que cobrem o caminho |
| As alterações a `docs/projeto.md` divergirem do código | Médio | Cada afirmação é verificada contra o repositório antes de escrever |

## 8. Decisões confirmadas

| Decisão | Escolha |
|---|---|
| Corrigir o `git add -A` | Sim, agora, na mesma change |
| Tratar os três pontos em conjunto | Sim |
| Ordem de entrega | Livre, desde que tudo funcione |

## 9. Aprovação

Esta proposta depende de aprovação humana antes do início da implementação.
