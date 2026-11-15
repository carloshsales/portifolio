# ADR-004: Histórico obrigatório

- Status: Accepted
- Data: 2026-11-15

## Contexto

Decisões, eventos e detalhes do projeto não tinham registro consolidado. Isso dificultava rastrear o porquê de escolhas e recuperar contexto após sessões.

## Alternativas consideradas

1. Confiar apenas no histórico Git.
2. Criar um `CHANGELOG.md` para eventos e ADRs para decisões.
3. Criar `docs/history.md` append-only para eventos e ADRs para decisões.
4. Criar um histórico por mudança.

## Decisão

Manter `docs/history.md` append-only para decisões, eventos e detalhes, e `docs/decisions/ADR-NNN-*.md` para decisões relevantes. O registro é feito por `/logspec`.

## Justificativa

- Um único ponto de consulta para o histórico.
- ADRs preservam o contexto das decisões importantes.
- Append-only evita perda e reescrita.
- Baixo acoplamento: history e ADRs são independentes.
- `/logspec` valida e padroniza o registro.

## Consequências

- Toda decisão, evento ou detalhe relevante deve ser registrado.
- `docs/history.md` nunca é reescrito.
- ADRs passam a ser criados para decisões relevantes.
- O comando `/logspec` é adicionado ao fluxo.
