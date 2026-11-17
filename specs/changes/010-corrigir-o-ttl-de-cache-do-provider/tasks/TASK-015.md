# TASK-015 — Corrigir o TTL de cache do provider opencode-go

- Change: 010-corrigir-o-ttl-de-cache-do-provider
- Status: COMPLETED
- Depende de: nenhuma
- Início: 2026-11-17
- Verificação: VERIFIED (2026-11-17) — pnpm test: exit 0, 146 aprovados e 1 ignorado; pnpm test:e2e: exit 0, 15 aprovados em 3 viewports; subagente guardiao via opencode-go numa sessao nova devolveu OK sem erro de TTL
- Evidência: pnpm test: exit 0, 146 aprovados e 1 ignorado; pnpm test:e2e: exit 0, 15 aprovados em 3 viewports; subagente guardiao via opencode-go numa sessao nova devolveu OK sem erro de TTL
- Plano de ação: none

## Contexto

O provider `opencode-go` aceita apenas `prompt_cache_options.ttl = "30m"`. A configuração
do projecto, em `opencode.json`, definia `cache.ttl` como `"1h"`. O cliente aceita esse
valor — o seu esquema valida contra `/^\d+(ms|s|m|h|d)$/` — mas o provider rejeita-o, e
toda a chamada de subagente falhava com:

```text
Upstream request failed: [invalid_value] Invalid value for 'prompt_cache_options.ttl':
value is not one of the allowed values ["30m"].
```

As chamadas da sessão principal não eram afectadas, porque não enviam
`prompt_cache_options`. O bug bloqueou o guardião e obrigou a usar o provider `opencode`
nas revisões.

A correcção foi verificada antes de ser escrita: o valor lido pelo cliente é
`providers.<id>.settings.cache.ttl`, e a função que constrói o pedido transforma `"24h"` em
`prompt_cache_retention` e qualquer outro valor em `prompt_cache_options.ttl`.

## Objetivo

Definir `cache.ttl` como `"30m"` em `opencode.json`, o único valor aceite pelo provider
`opencode-go`, para que os subagentes voltem a executar.

## Arquivos

- `opencode.json` (alteração)
- `specs/changes/010-corrigir-o-ttl-de-cache-do-provider/proposal.md` (preservado no commit; proposta aprovada, sem alteração de conteúdo)

## Entregáveis

- `opencode.json` define `providers.opencode-go.settings.cache.ttl` com o valor `"30m"`,
  em vez de `"1h"`.
- Nenhum outro valor de `opencode.json` é alterado: as permissões e `experimental.todo`
  mantêm-se intactos.
- A correção é verificada: um subagente configurado com `opencode-go` executa uma chamada
  sem erro de TTL.

## Regras

- Alterar apenas o valor de `cache.ttl`. Não mexer nas permissões nem noutro campo.
- Não alterar a configuração global do OpenCode do utilizador
  (`~/.config/opencode/opencode.json`): a correcção pertence ao projecto, não ao ambiente.
- Não implementar código de produto.
- Não criar ADRs.
- Não fazer commit ou push manualmente; o guardião executa o `commit-task`.

## Testes

- Verificações obrigatórias, executadas pelo utilizador, por ordem:
  1. `pnpm test`
  2. `pnpm test:e2e`
- O verificador avalia a evidência do utilizador sem executar shell.
- Os checks automáticos do `commit-task` (lint, typecheck, test, build) e os hooks Husky
  podem repetir parte da suíte.
- Prova específica desta tarefa: invocar um subagente configurado com `opencode-go` numa
  sessão nova e confirmar que devolve a resposta em vez do erro de TTL. A sessão actual
  mantém as definições em memória, pelo que o efeito só é visível depois de uma sessão
  nova.

## Contrato mínimo de evidência

Para cada comando executado manualmente pelo utilizador, a evidência deve conter:

- O comando exato executado.
- O resultado final / passagem (exit code 0 ou resumo de sucesso).

Se um comando falhar, deve fornecer a saída relevante e parar o pipeline para correcção.
Se a evidência estiver ausente ou ambígua, o verificador pede complemento e não avança.

Checks manuais (utilizador): `pnpm test`, `pnpm test:e2e`.
Checks automáticos (commit-task/hooks): lint, typecheck, test, build.

## Aceitação

Condição-objectiva de conclusão: `opencode.json` define `cache.ttl` como `"30m"` e nada
mais foi alterado nesse ficheiro; um subagente configurado com `opencode-go` executa uma
chamada sem o erro de TTL; as verificações do projecto passam; o `commit-task` produz um
commit que contém apenas os ficheiros do âmbito.

## Checklist de clareza

- Objetivo único e verificável — ATENDE
- Arquivos afetados — ATENDE
- Entregáveis concretos — ATENDE
- Contrato de entrada, saída e erros — ATENDE
- Testes obrigatórios — ATENDE
- Critério de aceitação objetivo — ATENDE
- Dependências declaradas explicitamente — ATENDE
- Ausência de decisões pendentes para o implementador — ATENDE
