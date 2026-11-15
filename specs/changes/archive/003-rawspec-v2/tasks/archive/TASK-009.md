# TASK-009 — Documentar e validar ponta a ponta

- Change: 003-rawspec-v2
- Status: ARCHIVED
- Depende de: TASK-008
- Início: 2026-11-15
- Verificação: VERIFIED (2026-11-15) — `docs/rawspec-v2.md` complementado com CLI, exemplos, mensagem de commit, catálogo de erros e validação ponta a ponta; `README.md` atualizado com índice; teste ponta a ponta do fluxo completo adicionado; 81 testes do módulo passando; `prettier --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (122 passando, 1 pulado) e `pnpm build` aprovados.
- Evidência: documentação em `docs/` e `README.md`; testes em `scripts/`; verificações executadas em 2026-11-15.
- Arquivada em: 2026-11-15
- Plano de ação: none

## Objetivo

Complementar a documentação do formato v2 e dos comandos e validar o fluxo completo em ponta a ponta.

## Arquivos

- `docs/rawspec-v2.md` (complementação)
- `README.md` (atualização do índice de documentos)

## Entregáveis

- Argumentos, flags e exemplos dos cinco comandos.
- Fluxo de ciclo de vida da tarefa e da mudança.
- Política de histórico e ADRs.
- Política de Git: sem commit/push automático; staging apenas em caminhos exatos quando aplicável.
- Tabela de erros do helper.
- Instruções de migração de mudanças legadas.
- `README.md` com índice dos documentos e comandos.

## Regras

- Não documentar comandos inexistentes.
- Exemplos devem ser copiáveis e coerentes com o comportamento implementado.
- Mensagens de erro devem corresponder ao catálogo do design.
- Não alterar mudanças em vigor além do necessário.

## Testes

- Executar `pnpm lint`.
- Executar `pnpm typecheck`.
- Executar `pnpm test`.
- Executar `pnpm build`.
- Validar fluxo completo em diretório temporário: iniciar, verificar, concluir, arquivar tarefa e arquivar mudança.
- Validar `/logspec` em diretório temporário.
- Confirmar que não houve commit nem push.

## Aceitação

- Documentação completa e coerente com a implementação.
- Todas as verificações obrigatórias passam.
- O fluxo ponta a ponta funciona sem commit nem push.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — NÃO SE APLICA (tarefa documental e de validação: a entrada é a implementação testada e a saída é a documentação e o relatório de validação)
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
