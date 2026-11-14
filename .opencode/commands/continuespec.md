---
description: Retoma a execução de uma tarefa RawSpec já iniciada, seguindo o estado atual
argument-hint: '[TASK-ID] [--change CHANGE-ID]'
---

# /continuespec

Retoma uma tarefa `TASK-NNN` já iniciada, seguindo o estado atual dela.

## Uso

```text
/continuespec                            # única tarefa aberta
/continuespec TASK-003                   # tarefa específica
/continuespec TASK-003 --change 002-slug # restringe a busca a uma mudança
```

## Ferramenta

Toda a leitura, validação e escrita é feita pelo helper compartilhado. Não
reimplemente parsing nem validação neste comando.

```bash
node scripts/rawspec.mjs resolve TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs open --json
node scripts/rawspec.mjs start TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs begin-verify TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs verify TASK-003 --evidence "..." --change CHANGE-ID --json
node scripts/rawspec.mjs fail TASK-003 --evidence "..." --change CHANGE-ID --json
node scripts/rawspec.mjs commit-message TASK-003 --change CHANGE-ID --json
node scripts/rawspec.mjs action-plan TASK-003 --slug SLUG --severity ALTA --json
node scripts/rawspec.mjs resolve-action-plan PATH --evidence "..." --json
```

## Fluxo

### 1. Localizar a tarefa

**Sem argumento:** rode `open --json`.

- Se houver exatamente uma tarefa aberta, continue com ela.
- Se houver mais de uma, apresente cada uma com mudança, título e status e
  **pergunte ao usuário qual continuar**. Não escolha.
- Se não houver nenhuma, informe `E_NO_OPEN_TASK` e sugira `/startspec`.

**Com `TASK-ID`:** rode `resolve TASK-ID --json`.

- `E_TASK_AMBIGUOUS`: apresente as candidatas e **pergunte ao usuário**.
- `E_TASK_NOT_FOUND`: informe e sugira conferir o ID.

### 2. Revalidar aprovação e dependências

O helper valida ao transicionar. Apresente a **origem de cada dependência**
(`explicit`, `legacy-sequential` ou `none`) e a lista de pendências.

Se o helper retornar `E_CHANGE_NOT_APPROVED`, `E_DEPENDENCY_PENDING`,
`E_DEPENDENCY_UNDECLARED`, `E_DEPENDENCY_UNKNOWN` ou `E_DEPENDENCY_CYCLE`,
**pare e mostre a mensagem**. Não avance.

### 3. Seguir o estado atual

| Estado                     | Ação                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------- |
| `PENDING`                  | **Não continuar.** Informe que a tarefa deve ser iniciada com `/startspec TASK-ID`. |
| `IN PROGRESS`              | Continue a implementação. Ao concluir, rode `begin-verify TASK-ID --json`.          |
| `VERIFYING`                | Execute as verificações e rode `verify TASK-ID --evidence "..." --json`.            |
| `COMPLETED` + `VERIFIED`   | Informe que não há pendências. **Não reinicie.**                                    |
| `COMPLETED` sem `VERIFIED` | Trate como pendente de verificação e prossiga para `VERIFYING`.                     |

### 4. Executar e verificar

1. Execute as verificações da aceitação da tarefa.
2. Se tudo passar, rode `verify TASK-ID --evidence "<resumo>" --json`.
3. Se algo falhar e não puder ser corrigido no escopo, rode
   `fail TASK-ID --evidence "<motivo>" --json` e mantenha a tarefa aberta.

`verify` exige evidência não vazia. Nunca registre `VERIFIED` sem evidência real.

### 5. Fechar a tarefa

Rode `commit-message TASK-ID --json` e apresente a mensagem no bloco copiável.

A mensagem é uma **saída** do comando. **Não execute `git commit` nem
`git push`.** O commit continua humano.

Apresente também o que falta, os arquivos alterados, as verificações
executadas, a evidência registrada e o próximo passo.

## Problemas e riscos

Crie um plano de ação **somente** para risco real: falha que não pode ser
corrigida no escopo, alteração inesperada fora do escopo, conflito de
requisito, risco de segurança, integridade ou de dados, necessidade de
mudança de escopo, risco para outra mudança, ou impossibilidade de produzir
evidência.

1. **Interrompa** a ação arriscada.
2. Rode `action-plan TASK-ID --slug SLUG --severity ALTA --json`.
3. Apresente o plano e **peça aceite explícito**.
4. Só continue depois do aceite.
5. Se o usuário recusar, mantenha a tarefa aberta.

**Cancelamento, recusa de escolha, ambiguidade pendente ou interrupção normal
não criam plano de ação.** Apenas interrompem o comando.

## Erros comuns

| Código                     | O que fazer                                 |
| -------------------------- | ------------------------------------------- |
| `E_NO_OPEN_TASK`           | Usar `/startspec`.                          |
| `E_TASK_NOT_FOUND`         | Conferir o ID ou a mudança.                 |
| `E_TASK_AMBIGUOUS`         | Perguntar ao usuário qual mudança usar.     |
| `E_TASK_STATE`             | Estado incompatível com a transição pedida. |
| `E_EVIDENCE_REQUIRED`      | Executar e registrar as verificações.       |
| `E_COMMIT_MESSAGE_BLOCKED` | Concluir a tarefa e resolver planos antes.  |

## Regras

- Nunca altere o status de aprovação de `proposal.md`, `design.md` ou
  `tasks.md`.
- Nunca arquive nada. Arquivamento é de `/arquivespec` e da mudança inteira.
- Nunca faça commit nem push.
- Não crie outros comandos.
