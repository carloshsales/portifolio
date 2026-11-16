# Plano de Ação — TASK-003 — Limitações das permissões de caminho

- Status: PENDING ACCEPTANCE
- Change: 006-agent-orchestrator
- Task: TASK-003
- Data: 2026-11-16
- Severidade: MEDIA
- Origem: verificação empírica das permissões durante a TASK-003

## 1. Problema ou risco

As permissões de caminho do OpenCode não funcionam como barreira de integridade.
Uma regra `edit` com `deny` sobre `src/content/**` bloqueia a ferramenta de
escrita, mas o agente escreve o mesmo conteúdo por shell.

## 2. Impacto se não tratado

O desenho da change 006 atribuía às permissões a função de garantir que
`src/content/` só é escrito pelo utilizador. Essa garantia não existe. Se não
for corrigido, o design documenta uma segurança que não tem.

## 3. Evidências

Verificado em 2026-11-16 com `opencode-go/beam-free`, sobre
`src/content/profile.ts`:

| Via tentada | Resultado |
|---|---|
| Ferramenta `write` | Bloqueada: "Permission denied: edit" |
| `Set-Content` | Bloqueada: "Permission denied: shell" |
| `echo ZZZ > ficheiro` | Bloqueada: "Permission denied: shell" |
| `node -e "fs.writeFileSync(...)"` | Bloqueada: "Permission denied: shell" |
| `[System.IO.File]::WriteAllText('...')` | **Executada com sucesso** |

Com uma regra adicional `shell` de `deny` com padrão `*src/content*`, onze
tentativas foram bloqueadas e a dozeava, com o mesmo caminho escrito de forma
diferente, foi executada.

Ficheiro restaurado com `git checkout -- src/content/profile.ts` em ambos os
testes. O repositório ficou íntegro.

## 4. Opções consideradas

1. **Manter as regras de caminho e não fazer nada.** Descartada. As regras
   seriam documentação enganosa.
2. **Usar `policies` com `tool.use` para bloquear por recurso.** A semântica de
   `shell` é o texto do comando, pelo que não oferece garantia diferente da
   já verificada.
3. **Aceitar a limitação e mover a garantia para um gate pós-escrita.**
   Adoptada.
4. **Escrever um plugin que intercepte o shell.** Descartada. Introduz código
   executável e uma superfície de manutenção que contraria o princípio de
   configuração nativa e reversível.

## 5. Ação recomendada

Adotar a opção 3. As permissões de caminho mantêm-se, com o valor honesto de
barreira de esforço. A garantia de âmbito passa para um gate aplicado depois
da acção e antes do commit, baseado em `git status --porcelain`, que lista
todos os ficheiros tocados independentemente de como foram escritos.

Consequências já aplicadas ao design:

- `design.md` §5.3.1 documenta a limitação com as vias testadas.
- `design.md` §5.3.2 remove a regra `edit` sobre `specs/**`, que era
  contraproducente: não impedia a escrita por shell e bloqueava a manutenção
  legítima das especificações.
- `design.md` §5.3 substitui a permissão de escrita de especificações por uma
  permissão de shell restrita a `node scripts/rawspec-v2-cli.mjs *`.
- `design.md` §5.2 mantém a condição C5, que passa a ser o mecanismo central
  de garantia de âmbito.

## 6. Passos de execução

1. Documentar a limitação em `design.md` §5.3.1 e §5.3.2. — feito
2. Actualizar `proposal.md` §5.2, acrescentando R11 sobre o gate de âmbito. — feito
3. Verificar que o gate de âmbito está especificado como condição de commit e de push. — feito
4. Implementar o gate no `guardiao`, na TASK-004. — pendente
5. Testar o gate com uma escrita fora do âmbito, na TASK-007. — pendente

## 7. Validação

- `design.md` §5.3.1 existe e lista as cinco vias testadas com o resultado
  observado.
- `design.md` §5.3.2 existe e explica a remoção da regra sobre `specs/**`.
- `proposal.md` §5.2 inclui o requisito do gate de âmbito.
- A TASK-004 exige que o `guardiao` implemente o gate de âmbito.
- A TASK-007 exige um teste do gate com escrita fora do âmbito.

## 8. Rollback

Não aplicável. Não há alteração de comportamento do repositório: a alteração é
documental e de configuração.

## 9. Critérios de aceite

- A limitação está documentada com evidências verificáveis.
- O design não afirma garantias que as permissões não dão.
- Existe um mecanismo verificável que garante o âmbito, para além das
  permissões.

## 10. Aprovação

- Decisão:
- Data:
- Observações:
