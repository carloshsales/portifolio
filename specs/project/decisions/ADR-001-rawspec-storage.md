# ADR-001: Armazenamento das especificações

- Status: Accepted
- Data: 2026-11-11

## Contexto

O projeto precisa de um sistema de especificações que permita
documentar requisitos, controlar mudanças e manter rastreabilidade.

O sistema também deverá ser independente da plataforma de IA utilizada.

## Alternativas consideradas

1. Arquivos Markdown versionados com Git.
2. Banco de dados próprio.
3. Ferramenta externa de gerenciamento de especificações.

## Decisão

Utilizar arquivos Markdown versionados com Git como base do RawSpec.

## Justificativa

- Simplicidade de implementação.
- Histórico de alterações.
- Portabilidade entre ferramentas.
- Facilidade de revisão.
- Ausência de infraestrutura adicional.

## Consequências

- O controle de mudanças dependerá inicialmente de convenções
  e validações sobre arquivos.
- Não haverá interface gráfica própria.
- A automação será adicionada gradualmente.
- As especificações poderão ser utilizadas por diferentes agentes
  e ferramentas de desenvolvimento.