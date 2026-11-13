# Plano de Implementação — 001 Portfolio MVP

**Status:** APPROVED  
**Execução:** IN PROGRESS  
**Base:** `proposal.md` e `design.md`

## Fase 1 — Fundação do projeto

### TASK-001 — Inicializar aplicação
- **Status:** COMPLETED (2026-11-12)
- **Verificação:** VERIFIED (2026-11-12) — lint, typecheck, testes e build aprovados.
- Criar aplicação React + TypeScript + Vite.
- Configurar TypeScript Strict.
- Configurar estrutura inicial de diretórios.
- Criar scripts de desenvolvimento e build.
- Validar execução local.

**Aceitação:** aplicação inicia localmente e gera build sem erros.

### TASK-002 — Configurar qualidade e Git Hooks
- **Status:** COMPLETED (2026-11-12)
- **Verificação:** VERIFIED (2026-11-12) — hooks pre-commit e pre-push validados, incluindo bloqueio em falha.
- Instalar e configurar ESLint.
- Instalar e configurar Vitest e Testing Library.
- Instalar e configurar Husky.
- Configurar hook `pre-commit` para lint e formatação dos arquivos alterados.
- Configurar hook `pre-push` para verificação de tipos, testes e build.
- Centralizar comandos no `package.json`.

**Aceitação:** hooks executam corretamente e bloqueiam operações quando as verificações falham.

### TASK-003 — Configurar estilos globais
- **Status:** COMPLETED (2026-11-12)
- **Verificação:** VERIFIED (2026-11-12) — lint, typecheck, testes, build e format:check aprovados; CSS gerado em `dist/assets/index-I_JxLBsT.css` (2,27 kB) e referenciado por `dist/index.html`; cinco cores aprovadas, três famílias tipográficas, foco visível e `prefers-reduced-motion` verificados.
- Definir paleta de cores aprovada.
- Configurar tipografia.
- Criar tokens CSS para cores, espaçamentos, tipografia e breakpoints.
- Configurar estilos globais e reset.
- Preparar suporte a movimento reduzido.

**Aceitação:** identidade visual básica disponível e reutilizável.

## Fase 2 — Interface

### TASK-004 — Criar estrutura de navegação
- Implementar sidebar.
- Criar navegação por âncoras.
- Adaptar navegação para dispositivos móveis.
- Implementar estados ativo, hover e foco.
- Garantir funcionamento por teclado.

**Aceitação:** navegação funcional em desktop, tablet e celular.

### TASK-005 — Implementar seção inicial
- Criar apresentação profissional.
- Integrar fotografia pessoal fornecida pelo usuário.
- Criar chamadas para ação.
- Aplicar identidade visual aprovada.

**Aceitação:** apresentação responsiva, sem informações inventadas e com imagem otimizada.

### TASK-006 — Implementar seção de projetos
- Criar estrutura de cards de projetos.
- Separar dados da apresentação visual.
- Exibir tecnologias utilizadas.
- Permitir links para repositórios e demonstrações quando disponíveis.

**Aceitação:** projetos apresentados corretamente, sem dados fictícios ou links inválidos.

### TASK-007 — Implementar seção de habilidades
- Organizar habilidades e tecnologias por categorias.
- Manter conteúdo separado dos componentes.
- Evitar classificações ou níveis de proficiência não confirmados.

**Aceitação:** habilidades exibidas de forma clara e responsiva.

### TASK-008 — Implementar seção de contato
- Exibir canais profissionais fornecidos pelo usuário.
- Criar links funcionais para os canais disponíveis.
- Garantir acessibilidade dos elementos interativos.

**Aceitação:** canais de contato funcionais e acessíveis.

## Fase 3 — Qualidade e finalização

### TASK-009 — Revisar acessibilidade
- Verificar semântica HTML.
- Verificar navegação por teclado.
- Verificar foco visível.
- Verificar contraste.
- Verificar textos alternativos.
- Verificar comportamento com `prefers-reduced-motion`.

**Aceitação:** verificações de acessibilidade concluídas e problemas identificados corrigidos.

### TASK-010 — Revisar responsividade e performance
- Testar diferentes larguras de tela.
- Corrigir overflow horizontal.
- Otimizar imagens e fontes.
- Verificar carregamento e desempenho.
- Remover dependências e recursos desnecessários.

**Aceitação:** interface utilizável nos tamanhos de tela previstos e sem problemas críticos de desempenho.

### TASK-011 — Validação final
- Executar ESLint.
- Executar verificação TypeScript.
- Executar testes automatizados.
- Executar build de produção.
- Validar links e navegação.
- Verificar erros no console.
- Validar hooks pre-commit e pre-push.

**Aceitação:** todas as verificações obrigatórias passam.

### TASK-012 — Preparar publicação
- Definir configuração de hospedagem estática.
- Documentar como executar localmente.
- Documentar como gerar o build.
- Preparar instruções de publicação.

**Aceitação:** projeto documentado e pronto para publicação.

## Regras de execução

1. Executar tarefas respeitando suas dependências.
2. Não iniciar uma tarefa dependente enquanto seus pré-requisitos não estiverem concluídos.
3. Não ampliar o escopo sem aprovação.
4. Atualizar o status das tarefas conforme o progresso.
5. Registrar decisões técnicas relevantes.
6. Executar verificações de qualidade após cada etapa pertinente.
7. Não inventar conteúdo profissional ou projetos.
8. Solicitar informações ao usuário quando algum conteúdo real for necessário.

## Fluxo de status

`PENDING → IN PROGRESS → VERIFYING → COMPLETED`

Se uma verificação falhar, corrigir antes de concluir a tarefa.