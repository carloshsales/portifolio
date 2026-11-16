# Design Técnico — Correcções de consistência do projecto

**Change:** `007-consistencia-do-projecto`
**Status:** APPROVED
**Base:** `proposal.md`

## 1. Objetivo

Descrever a correcção do staging no `commit-task` e as alterações a
`docs/projeto.md`.

## 2. Princípios

| # | Princípio | Consequência |
|---|---|---|
| P1 | O gate de âmbito é verificável | O commit é bloqueado por uma condição observável, não por uma intenção |
| P2 | O helper não perde trabalho | Um ficheiro fora do âmbito é reportado, nunca descartado em silêncio |
| P3 | A especificação da task é a fonte de verdade do âmbito | A lista vem de `## Arquivos`, não de convenções de nome |
| P4 | A documentação descreve o que existe | Cada afirmação em `docs/projeto.md` é verificada contra o repositório |
| P5 | O contrato público da CLI não muda | `commit-task` mantém a mesma assinatura e o mesmo retorno |

## 3. Layout

```text
scripts/rawspec-v2.mjs          (correcção do staging)
scripts/rawspec-v2.test.mjs     (testes)
docs/projeto.md                 (secções 6.3 e 7.3)
specs/changes/007-consistencia-do-projecto/
  proposal.md
  design.md
  tasks/
    TASK-001.md
    TASK-002.md
    TASK-003.md
```

## 4. Modelo de dados

### 4.1 Âmbito de uma task

O parser passa a extrair a secção `## Arquivos` do ficheiro da task, para
além dos campos já lidos.

```js
{
  id: 'TASK-005',
  // ...campos existentes...
  scope: {
    files: ['src/sections/Home/Home.tsx', 'src/components/Sidebar.tsx'],
    source: 'explicit' | 'none',
  },
}
```

A secção `## Arquivos` usa listas markdown com caminhos entre crases:

```markdown
## Arquivos

- `src/sections/Home/Home.tsx` (revisão)
- `src/content/profile.ts` (leitura dos dados; sem escrita)
```

A extracção retira o caminho entre crases e descarta o parêntese. O
qualificador entre parênteses é informative: indica o que fazer com o
ficheiro, não se pode escrever nele. O gate de âmbito não faz essa
distinção — um ficheiro listado é um ficheiro permitido.

### 4.2 Ficheiros de especificação

Os ficheiros que a CLI RawSpec actualiza durante a execução da task fazem
parte do trabalho da task e têm de ser commited. São:

- o ficheiro da task;
- o plano de acção, se existir;
- `docs/history.md`, se a task tiver registado histórico.

São identificados pela própria CLI, que conhece os seus caminhos. Não são
derivados por glob.

### 4.3 Regra de selecção

O conjunto commited é:

```text
ficheiros em ## Arquivos da task
  ∪ ficheiros de especificação alterados pela CLI
```

## 5. Comportamento

### 5.1 `commitAndPushTask`

A sequência passa a ser:

1. Verificar o estado da task (`COMPLETED` ou `ARCHIVED`, `VERIFIED`).
2. Executar as verificações.
3. Construir a mensagem de commit.
4. **Obter os ficheiros tocados** com `git status --porcelain`.
5. **Separar** em dentro do âmbito e fora do âmbito.
6. **Se houver ficheiros fora do âmbito**, lançar `E_SCOPE_VIOLATION` com a
   lista, sem commitar.
7. **Fazer staging** com caminhos explícitos, um `git add` por caminho.
8. Commitar e pushar.

### 5.2 Tratamento dos ficheiros fora do âmbito

O commit é bloqueado, não corrigido. A CLI não descarta trabalho: um
ficheiro fora do âmbito pode ser trabalho legitimate de outra task, ou
resíduo de uma operação anterior.

O erro aponta para a lista. O agente ou o utilizador decide o que fazer
com cada ficheiro.

### 5.3 Ficheiros sem `## Arquivos`

Uma task sem secção `## Arquivos`, ou com a secção vazia, tem âmbito vazio.
Nessa situação, qualquer ficheiro tocado bloqueia o commit, excepto os
ficheiros de especificação.

Isto é deliberado. Uma task sem âmbito declarado não pode ser verificada, e
o commit indiscriminado é exactamente o que se pretende evitar.

### 5.4 `docs/projeto.md`

**Secção 6.3** — reescrita para descrever o orquestrador: os oito agentes, o
pipeline de oito etapas, a tabela de routing e o custo medido. Remissão para
`docs/orquestrador.md` e ADR-007.

**Secção 7.3** — as restrições de Git passam a refletir a ADR-005: branch por
tarefa, commit e push automáticos quando as cinco condições se cumprem, e
proibições explícitas (`--no-verify`, `reset --hard`, `clean`, `checkout --`).

As secções 7.1, 7.2 e 7.4 não são alteradas.

## 6. Contratos e erros

### 6.1 Novo código de erro

| Código | Significado |
|---|---|
| `E_SCOPE_VIOLATION` | Há ficheiros tocados fora do âmbito declarado da task |

### 6.2 Estrutura do erro

```js
{
  code: 'E_SCOPE_VIOLATION',
  message: 'Ficheiros fora do âmbito da task',
  details: {
    task: 'TASK-005',
    outOfScope: ['docs/other.md', 'src/unexpected.tsx'],
    inScope: ['src/sections/Home/Home.tsx'],
  },
}
```

### 6.3 Códigos existentes mantidos

`E_GIT_ERROR`, `E_TASK_STATE`, `E_CHECKS_FAILED` e `E_BRANCH_EXISTS` mantêm-se
com o mesmo significado.

## 7. Testes

| # | Teste | Tipo |
|---|---|---|
| T1 | `parseTaskFile` extrai `## Arquivos` para `scope.files` | Parser |
| T2 | Uma task sem `## Arquivos` tem `scope.files` vazio | Parser |
| T3 | O path de um ficheiro é extraído sem o parêntese | Parser |
| T4 | `commit-task` commite apenas os ficheiros do âmbito | Comportamento |
| T5 | `commit-task` commite também o ficheiro da task | Comportamento |
| T6 | Um ficheiro fora do âmbito bloqueia o commit com `E_SCOPE_VIOLATION` | Comportamento |
| T7 | O erro lista os ficheiros fora do âmbito | Comportamento |
| T8 | `git add -A` não aparece no código | Verificação estática |
| T9 | `docs/projeto.md` §6.3 e §7.3 coerentes com a ADR-005 e a ADR-007 | Documentação |
| T10 | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e` | Repositório |

Os testes T4 a T7 correm num directório temporário, como os restantes testes
do helper, e não tocam o repositório real.

## 8. Critérios de aceite

- `scripts/rawspec-v2.mjs` não contém `git add -A`.
- O staging usa caminhos explícitos.
- Um ficheiro fora do âmbito impede o commit, com `E_SCOPE_VIOLATION`.
- O ficheiro da task e os ficheiros de especificação são sempre commited.
- `docs/projeto.md` §6.3 descreve o orquestrador e §7.3 é coerente com a
  ADR-005.
- A suíte completa passa.
