# Instruções operacionais

## Fonte da verdade

- `specs/tasks/index.md` — índice de tarefas e próxima tarefa pendente.
- `specs/tasks/active/TASK-NNN.md` — especificação de cada tarefa.
- `specs/project/` — contexto geral do projeto.

## Regras obrigatórias

1. Não implementar sem aprovação humana explícita registrada na tarefa.
2. Não alterar arquivos fora do escopo da tarefa.
3. Não iniciar outra tarefa se houver uma em andamento.
4. Não criar worktrees.
5. Não trocar de branch.
6. Não commitar nem pushar sem autorização explícita.
7. Não declarar testes aprovados sem executar e registrar evidência.
8. Não inventar conteúdo profissional, projetos ou informações pessoais.
9. Não usar `--no-verify` para contornar os hooks.

## Fluxo para cada tarefa

1. Leia `specs/tasks/index.md` e a tarefa indicada.
2. Verifique `Status`, `Aprovação humana` e `Depende de`.
3. Se `READY` e aprovada → implemente exatamente o escopo.
4. Registre as evidências na seção 12 da tarefa.
5. Atualize `Status` e `specs/tasks/index.md`.

## Refinamento por perguntas

Se a avaliação de clareza for < 90 ou houver decisões em aberto:

1. Mude o status para `CLARIFICATION`.
2. Elabore perguntas objetivas na seção "Perguntas de refinamento" da tarefa.
3. Aguarde as respostas do usuário.
4. Atualize a tarefa com as respostas, registre o histórico de modificações e reavalie.
5. Repita até atingir ≥ 90 e obter aprovação humana.

## Papéis

- **plan** — analisa, decompõe, avalia a clareza e propõe tarefas.
- **explore** — investiga o código e relata evidências.
- **build** — implementa tarefas aprovadas.

## Definição de pronto

Critérios de aceitação atendidos + verificações executadas + evidências registradas + revisão sem bloqueadores.

## Sobre as especificações

- `specs/README.md` descreve o ciclo de vida e a regra dos 90%.
- Tarefas arquivadas ficam em `specs/tasks/archive/`.
- `specs/changes/` é histórico, somente leitura.
