# Conteúdo real do portfólio

Inventário de tudo o que é preciso fornecer para o portfólio deixar de estar vazio. Não contém dados reais: apenas o que pedir, onde colocar e como validar.

O conteúdo vive em `src/content/`. Os componentes nunca são editados para introduzir dados.

## 1. Onde editar

| Ficheiro | Secção do portfólio | Tipo |
|---|---|---|
| `src/content/profile.ts` | Início e barra lateral | Identidade, apresentação e contactos |
| `src/content/projects.ts` | Projetos | Lista de projetos |
| `src/content/skills.ts` | Habilidades | Grupos de habilidades |
| `public/images/` | Início | Fotografia |

`src/data/` reexporta estes ficheiros e normaliza os valores. **Não editar `src/data/`** — o conteúdo entra por `src/content/`.

## 2. Identidade — `src/content/profile.ts`

| Campo | Obrigatório | Descrição | Exemplo |
|---|---|---|---|
| `name` | Sim | Nome como quer que apareça no portfólio e na barra lateral. | `'Carlos Henrique'` |
| `role` | Sim | Função ou área profissional. Curto, sem adjectivos. | `'Desenvolvedor Frontend'` |
| `summary` | Sim |Apresentação breve: o que faz, o que valoriza no trabalho. 2 a 4 frases. | `'Desenvolvedor frontend com foco em interfaces acessíveis e rápidas.'` |
| `photoUrl` | Sim | Caminho da fotografia dentro de `public/`. | `'/images/foto-perfil.jpg'` |
| `location` | Não | Localidade. Não é exibida enquanto vazia. | `'Braga, Portugal'` |
| `social` | Sim | Canais de contacto. Ver secção 3. | — |

### Regras de conteúdo

- Não inventar experiência, anos de trabalho, certificações ou clientes.
- Não mencionar empresas anteriores nem histórico profissional.
- O `summary` é a primeira impressão: prefere factos a adjectivos.
- O `location` só aparece no perfil se for preenchido.

## 3. Contactos — `social`

Cada entrada tem três campos:

```ts
{
  label: 'GitHub',
  url: 'https://github.com/teu-utilizador',
  icon: 'github',
}
```

| Campo | Regras |
|---|---|
| `label` | Texto visível do link. Curto e reconhecível. |
| `url` | URL completo e funcional. `mailto:` para email. |
| `icon` | Obrigatoriamente `github`, `linkedin` ou `email`. Não há outros valores. |

Canais prováveis:

| Canal | `url` | `icon` |
|---|---|---|
| GitHub | `https://github.com/<utilizador>` | `github` |
| LinkedIn | `https://www.linkedin.com/in/<perfil>` | `linkedin` |
| Email | `mailto:<email>` | `email` |

Entradas com `url` vazia são removidas automaticamente. **Preencher apenas canais que existam e que quer公開** — um canal sem valor é pior do que nenhum.

## 4. Projetos — `src/content/projects.ts`

Lista de objetos `Project`:

```ts
{
  title: 'Nome do projeto',
  description: 'Descrição breve do projeto, do problema que resolve e do teu contributo.',
  technologies: ['TypeScript', 'React'],
  repositoryUrl: 'https://github.com/utilizador/repositorio',
  liveUrl: 'https://exemplo.com',
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `title` | Sim | Nome do projeto. |
| `description` | Sim | O que é, que problema resolve e qual foi o contributo. 2 a 3 frases. |
| `technologies` | Sim | Tecnologias realmente usadas. Lista não vazia. |
| `repositoryUrl` | Não | Link para o repositório, se for público. |
| `liveUrl` | Não | Link para a demonstração, se existir. |

### Regras de conteúdo

- **Não inventar projetos.** Cada entrada tem de corresponder a trabalho real.
- **Não inventar links.** Se o repositório é privado, omitir `repositoryUrl`.
- `technologies` deve reflecting o que foi mesmo usado, não o que seria desejável.
- A descrição é lida primeiro: deve explicar o contributo, não apenas listar funcionalidades.

## 5. Habilidades — `src/content/skills.ts`

Lista de grupos:

```ts
{
  title: 'Frontend',
  skills: [
    {
      name: 'TypeScript',
      description: 'O que a habilidade é.',
      usage: 'Como a habilidade é usada neste projecto.',
      application: 'applied',
    },
  ],
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `title` | Sim | Nome da categoria. |
| `skills` | Sim | Habilidades da categoria. Lista não vazia. |
| `skills[].name` | Sim | Nome da habilidade, como aparece no rótulo. |
| `skills[].description` | Sim | O que a habilidade é. 1 a 3 frases. |
| `skills[].usage` | Sim | Como a habilidade é usada neste projecto. 1 a 3 frases. |
| `skills[].application` | Sim | `applied` ou `experienced`. |

Cada habilidade é um painel fechado que se abre ao clicar no rótulo. O texto
`description` responde a "o que é" e o texto `usage` responde a "como é usada
aqui".

O campo `application` distingue dois estados, e apenas um deles recebe
rótulo:

- `applied` — a habilidade é usada neste projecto. O painel mostra o rótulo
  **"Aplicado nesse Portfólio"**, e o texto `usage` descreve o que foi de facto
  feito aqui.
- `experienced` — a habilidade é conhecida e usada noutros contextos, mas não
  é usada neste projecto. O painel **não mostra rótulo**, e o texto `usage`
  descreve a experiência, sem sugerir aplicação aqui.

A distinção importa: sem ela, uma tecnologia ainda não usada neste projecto
apareceria ao leitor como algo já feito aqui.

### Regras de conteúdo

- **Sem níveis de proficiência.** Não escrever "avançado", "expert" ou percentagens.
- **Sem categorias vagas.** Evitar "Diversos", "Vários", "Outras".
- Usar nomes de tecnologia reconhecíveis, para que a lista seja útil a quem lê.
- 3 a 5 categorias é o padrão razoável para um portfólio.
- **`description` descreve a tecnologia, não este projecto.** É o mesmo texto para
  qualquer pessoa que não conheça o projecto.
- **`usage` é específico deste projecto.** Citar o que é realmente feito, e
  dizer com franqueza quando a tecnologia ainda não é usada.
- **`application` é uma afirmação verificável.** Pôr `applied` só quando a
  habilidade está de facto em uso no repositório — uma dependência
  instalada, um ficheiro de configuração presente, um comando executado.
  Não é uma avaliação de proficiência, e sim um facto.
- **`experienced` não é uma habilidade mais fraca.** A habilidade conta, e o
  texto `usage` descreve onde e como é usada, sem a apresentar como aplicação
  neste projecto.

## 6. Fotografia

| Aspeto | Requisito |
|---|---|
| Local | `public/images/` |
| Formato | `.jpg` ou `.webp`. `.png` apenas se tiver transparência. |
| Nome | Deve coincidir com `photoUrl` em `src/content/profile.ts`. |
| Proporção | Quadrada, para a moldura circular não cortar o rosto. |
| Resolução | 400 a 800 px de lado. Acima disso o peso não acrescenta qualidade. |
| Peso | Idealmente abaixo de 150 kB. |

O `public/images/foto-perfil.png` actual tem **1,8 MB** e é demasiado pesado. Se for usado, converter para `.webp` ou substituir pelo `.jpg` de 64 kB.

## 7. Ordem de preenchimento

1. `src/content/profile.ts` — identidade e contactos.
2. `src/content/skills.ts` — habilidades. **Preenchido.**
3. `src/content/projects.ts` — projetos.
4. `public/images/` — fotografia, com o nome registado no passo 1.

## 8. Validação

Depois de preencher:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Verificar:

- [ ] Não existe nenhum placeholder no ecrã.
- [ ] Todos os links de contacto abrem e não estão vazios.
- [ ] A fotografia carrega e não aparece distorcida.
- [ ] Cada projeto tem pelo menos uma tecnologia.
- [ ] Cada grupo de habilidades tem pelo menos uma habilidade.
- [ ] Nenhuma link de repositório ou demonstração devolve 404.
- [ ] O texto não menciona empresas anteriores nem inventa experiência.

Os comandos acima não detectam conteúdo inventado nem links quebrados: **a verificação final é visual, no browser**.

## 9. Ficheiros relacionados

- `src/content/profile.ts`, `src/content/projects.ts`, `src/content/skills.ts` — destino dos dados.
- `src/data/` — ponto de importação e normalização. Não editar.
- `src/types/index.ts` — os tipos `Profile`, `Project`, `SkillGroup` e `SocialLink`.
- `docs/deployment.md` — o que verificar depois de publicar.
