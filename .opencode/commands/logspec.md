---
description: Registra uma decisão, evento ou detalhe no histórico do projeto
argument-hint: [--type <Decisão|Evento|Detalhe>] --title <título> --message <texto> [--reason <motivo>] [--impact <impacto>] [--evidence <evidência>] [--origin <origem>] [--author <autor>] [--adr]
---

# /logspec

Registra uma entrada em `docs/history.md` e, opcionalmente, cria um esqueleto de ADR em `docs/decisions/`.

## Regras

- O tipo é obrigatório e um de: `Decisão`, `Evento`, `Detalhe`.
- Título e mensagem são obrigatórios.
- Motivo, impacto e evidência são obrigatórios. Se omitidos, o motivo assume a mensagem, o impacto assume `não informado` e a evidência assume `não informada`.
- Origem padrão: `sessão`. Autor padrão: variável de ambiente `USERNAME`.
- `docs/history.md` é append-only; nunca reescreva entradas anteriores.
- Nenhum commit ou push é executado.

## Como executar

```bash
node scripts/rawspec-v2-cli.mjs log \
  --type "Decisão" \
  --title "Título curto" \
  --message "Texto da decisão" \
  --reason "Por quê" \
  --impact "O que muda" \
  --evidence "Origem da evidência"
```

Para criar também um esqueleto de ADR, adicione `--adr`. Use `--adr-title` para um título de ADR diferente do título do registro.

## Validação

- Tipo inválido ou campo obrigatório ausente retorna `E_HISTORY_INVALID` e nada é gravado.
- ADR duplicado retorna `E_ADR_EXISTS`.
