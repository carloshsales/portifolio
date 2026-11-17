# Change 010 — Corrigir o TTL de cache do provider

- Status: APPROVED
- Tipo: Ferramentas de desenvolvimento
- Prioridade: Alta

## 1. Objetivo

Corrigir o valor de `cache.ttl` do provider `opencode-go` em `opencode.json`, que impedia
qualquer subagente de executar uma chamada ao provider.

## 2. Contexto

O provider `opencode-go` aceita apenas `prompt_cache_options.ttl = "30m"`. Qualquer outro
valor é rejeitado com `Invalid value for 'prompt_cache_options.ttl': value is not one of the
allowed values ["30m"]`.

A configuração do projecto, em `opencode.json`, definia `cache.ttl` como `"1h"`, valor que o
cliente aceita — o seu esquema valida contra `/^\d+(ms|s|m|h|d)$/` — mas que o provider
rejeita. A consequência era que **toda** chamada de subagente ao `opencode-go` falhava,
enquanto as chamadas da sessão principal funcionavam, porque a sessão principal não envia
`prompt_cache_options` quando não há cache de prompt configurado ao nível do modelo.

Este bug bloqueou o guardião e obrigou a contornar o modelo em três revisões durante a
TASK-013. Como o valor é lido ao arranque da sessão, corrigir a configuração só tem efeito
em sessões novas.

## 3. Escopo funcional

1. Alterar `opencode.json` para definir `providers.opencode-go.settings.cache.ttl` como
   `"30m"`, o único valor aceite pelo provider.

## 4. Fora do escopo

- Implementar código de produto.
- Alterar a configuração global do OpenCode do utilizador.
- Criar ADRs.
- Alterar outros valores de `opencode.json`.

## 5. Critérios de aceitação

- `opencode.json` define `cache.ttl` como `"30m"`.
- Um subagente configurado com `opencode-go` executa uma chamada sem erro de TTL.
- A sessão principal continua a funcionar.

## 6. Restrições

- Não alterar status de aprovação de mudança ou tarefa.
- Não fazer commit ou push sem todos os gates passarem.
- Não usar `--no-verify`.
- Escopo limitado aos ficheiros listados na TASK-015.

## 7. Aprovação

A implementação somente poderá começar após aprovação desta proposta.
