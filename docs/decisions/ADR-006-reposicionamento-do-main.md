# ADR-006: Reposicionamento do main sobre a linha de trabalho real

- Status: Accepted
- Data: 2026-11-15

## Contexto

O repositório `carloshsales/portifolio` continha duas linhas de histórico sem qualquer ancestral comum:

- `origin/main` com 16 commits de um site HTML estático antigo (`assets/`, `index.html`, mensagens como "scroll smoth", "perfil image", "font-size p").
- A linha de trabalho real de engenharia, que nasce em `chore/engineering-foundation` (`3a1f9eb`) e prossegue por `task/003-rawspec-v2`, `task/004-rawspec-branch-per-task` e as branches `task/005-*`, com a aplicação React, as especificações RawSpec, o helper `rawspec-v2` e a documentação.

Consequência: `git merge-base origin/main origin/task/004-001-...` devolvia vazio. O GitHub não conseguia calcular um diff e respondia `There isn't anything to compare. main and task/004-001-... are entirely different commit histories.`

Não era apenas uma dificuldade de comparação: o `main` do repositório **não continha o portfolio funcional**. Todo o produto e todo o sistema de especificações viviam fora do `main`.

## Alternativas consideradas

1. **Reposicionar o `main` sobre a linha de trabalho real.** O `main` passa a apontar para `3a1f9eb` e recebe o merge do trabalho actual. O histórico antigo é preservado numa tag.
2. **Fazer merge do site estático antigo para dentro do portfolio React.** Preserva o conteúdo antigo, mas mistura duas aplicações incompatíveis e introduz conflitos sem valor funcional.
3. **Deixar o `main` intacto e manter o trabalho noutra branch.** Não resolve a causa: os pull requests continuam impossíveis de comparar e o `main` continua sem o produto.
4. **Criar um repositório novo.** Isola o problema mas perde todo o histórico, issues e o histórico de branches existente.

## Decisão

O `main` é reposicionado sobre a linha de trabalho real:

1. Criar a tag `archive/main-antigo-site-estatico` em `7219f7a` (o antigo `origin/main`), preservando integralmente o histórico estático.
2. Repontar `main` para `3a1f9eb` (`chore/engineering-foundation`), que é a base comum de toda a linha de trabalho.
3. Fazer merge da change `005-refactor-portfolio-baseline` para dentro do `main`.
4. Enviar com `--force-with-lease`, que falha se o remoto tiver mudado entretanto.

O `origin/main` passa a conter a aplicação React, as especificações, o helper, a documentação e os testes.

## Justificativa

- O repositório tem um único produto. O `main` tem de conter esse produto.
- Sem ancestral comum, nenhuma branch é comparável com o `main` e nenhum pull request é possível.
- A tag preserva o histórico antigo, tornando a operação reversível.
- `--force-with-lease` protege contra sobrescrever trabalho remoto não previsto.

## Consequências

- Todas as branches remotas passam a ter ancestral comum com o `main` e podem ser comparadas e submeter pull requests.
- O `main` deixa de conter o site estático antigo; esse conteúdo permanece na tag de arquivo.
- As branches locais `feat/rawspec-task-commands` e `refactor/spec-task-architecture` continuam a existir, agora com base comum e já comparáveis.
- O `main` deixa de ser a branch de trabalho directa: o trabalho continua a ser feito em branches por tarefa, conforme ADR-005, e integrado por merge.
