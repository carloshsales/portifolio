# Plano de Ação — TASK-005 — Push do workflow de CI bloqueado pelo âmbito do token

- Status: PENDING ACCEPTANCE
- Change: 005-refactor-portfolio-baseline
- Task: TASK-005
- Data: 2026-11-15
- Severidade: MEDIA
- Origem: Falha de Git ao enviar `.github/workflows/ci.yml`

## 1. Problema ou risco

O commit `f142eab` da TASK-005 foi criado localmente, mas o `git push` foi rejeitado pelo GitHub:

```text
refusing to allow an OAuth App to create or update workflow
`.github/workflows/ci.yml` without `workflow` scope
```

O token OAuth em uso não tem o âmbito `workflow`, que o GitHub exige para criar ou alterar ficheiros em `.github/workflows/`. Consequência: o workflow de CI existe no repositório local e no commit, mas **não está no remoto**, e a branch `task/005-005-introduzir-integracao-continua` ainda não existe em `origin`.

Enquanto o push estiver bloqueado:

- a TASK-005 fica `COMPLETED` + `VERIFIED` mas não arquivável, porque a invariável de arquivamento exige que o trabalho esteja enviado;
- as tasks seguintes, que dependem desta, ficam bloqueadas pela dependência;
- o repositório remoto não tem o CI, o que anula o objetivo da task.

## 2. Impacto se não tratado

- O CI não existe para o repositório remoto, apesar de estar escrito e validado localmente.
- A sequência de tasks da change 005 fica parada na TASK-005.
- O commit fica local, vulnerável a perda, e divergente do remoto.
- A regra de branch por tarefa (ADR-005) fica violada: existe trabalho confirmado sem branch remota correspondente.

## 3. Evidências

- `git push -u origin task/005-005-introduzir-integracao-continua` termina com `error: failed to push some refs to 'https://github.com/carloshsales/portifolio.git'` e a mensagem de âmbito `workflow`.
- Commits locais criados: `f142eab feat(rawspec): Introduzir integração contínua` e `ac80978 docs(rawspec): record CI push blocker action plan`.
- `git status --porcelain` está limpo: o trabalho está consolidado nos commits, sem alterações por commitar.
- `git ls-remote --heads origin` não devolve a branch: a branch não existe no remoto.
- `gh auth status` revela a causa raiz: o token `gho_****` tem os âmbitos `admin:public_key`, `gist`, `read:org`, `repo` — **falta `workflow`**.
- O Git usa `credential.https://github.com.helper = gh auth git-credential`, ou seja, a credencial vem do `gh` CLI, e é essa que está sem o âmbito.
- Caminho SSH avaliado como alternativa: existe `~/.ssh/id_ed25519`, a chave pública já está registada na conta (`gh ssh-key add` devolveu "Public key already exists"), mas o serviço `ssh-agent` está `Stopped` e `Disabled`, e `ssh -T git@github.com` devolve `Permission denied (publickey)`.
- `gh auth refresh -s workflow` foi iniciado e devolveu o código de dispositivo `FE33-159C`, exigindo confirmação no browser.
- O workflow foi validado estruturalmente e todos os comandos foram executados localmente com sucesso; o problema é exclusivamente de permissão.

## 4. Opções consideradas

1. **Autorizar o âmbito `workflow` no GitHub e repetir o push.** Requer acção manual na conta GitHub (ou em um GitHub App instalado com o âmbito correto). Resolve a causa raiz e mantém a automatização de commit e push intacta.
2. **Usar um Personal Access Token com o âmbito `workflow`.** Alternativa à opção 1, com a mesma desvantagem: exige configuração manual de credenciais.
3. **Mover o workflow para fora de `.github/workflows/` e entregá-lo por outro canal.** Evita o bloqueio, mas tira o CI do ponto de execução natural e exige um passo manual no destino, que ainda não está decidido.
4. **Adiar o push e continuar o trabalho localmente.** Mantém o ritmo, mas acumula commits não enviados e deixa o CI ausente do remoto durante todo o tempo.
5. **Remover o workflow desta task e reintroduzi-lo depois de configurada a credencial.** Evita o bloqueio, mas entrega a TASK-005 incompleta e deixa o CI fora do âmbito da change.
6. **Reativar e usar o SSH.** Requer ativar o serviço `ssh-agent` no Windows, carregar a chave e configurar o remote com `git@github.com:...`. Evita o âmbito do token, já que o GitHub só exige `workflow` para tokens OAuth; torna-se uma alternativa válida a avaliar.

## 5. Ação recomendada

**Opção 1**, com a opção 2 como alternativa equivalente e a opção 6 como alternativa sem necessidade de novo âmbito.

Justificativa: o âmbito `workflow` é o mecanismo previsto pelo GitHub para exatamente este caso. É uma configuração única, resolve a causa raiz, mantém a automação de commit e push (decidida no ADR-005) e não exige qualquer alteração no código, no design ou no workflow. Nenhuma das outras opções introduz uma etapa manual recorrente no caminho crítico.

## 6. Passos de execução

1. No GitHub, abrir as definições da aplicação OAuth em uso, ou criar uma Personal Access Token com os âmbitos `repo` e `workflow`.
2. Atualizar a credencial no `gh` CLI ou no gestor de credenciais do Git local.
3. Executar `git push -u origin task/005-005-introduzir-integracao-continua` na branch da TASK-005.
4. Confirmar que o workflow `.github/workflows/ci.yml` está visível no repositório remoto.
5. Confirmar que o GitHub Actions executou o workflow na branch.
6. Se o push continuar a ser recusado, parar e criar um plano de ação novo com a diagnóstico atualizado.

O passo 2 tem o comando já preparado, que devolveu o código de dispositivo `FE33-159C`:

```bash
gh auth refresh -h github.com -s workflow
```

### 6.1 Alternativa SSH

Se preferir evitar a autorização de âmbito:

1. Ativar o serviço: `Set-Service ssh-agent -StartupType Automatic` e `Start-Service ssh-agent` (requer administrador).
2. Carregar a chave: `ssh-add "$env:USERPROFILE\.ssh\id_ed25519"` (requer a passphrase da chave).
3. Alterar o remote: `git remote set-url origin git@github.com:carloshsales/portifolio.git`.
4. Repetir o push e repor o remote para HTTPS se necessário.

## 7. Validação

- `git push` termina com `exit 0` e sem mensagem de recusa.
- `git ls-remote --heads origin task/005-005-introduzir-integracao-continua` devolve a branch.
- `git status` confirma que `HEAD` e `origin/<branch>` estão alinhados.
- O workflow aparece em `.github/workflows/ci.yml` no repositório remoto.
- A execução do GitHub Actions aparece na branch com todos os steps verdes.

## 8. Rollback

- O commit é local e verificado; nada se perde se o push falhar.
- Se for necessário reverter o workflow: remover `.github/workflows/ci.yml` num novo commit na mesma branch.
- A task pode ser revertida para `IN PROGRESS` com `node scripts/rawspec-v2-cli.mjs fail TASK-005 --evidence "<motivo>" --change 005-refactor-portfolio-baseline`, sem perda da evidência das verificações já executadas.

## 9. Critérios de aceite

- O push da branch da TASK-005 é aceite pelo remoto.
- O repositório remoto passa a conter `.github/workflows/ci.yml`.
- A TASK-005 é arquivada normalmente, com o commit de arquivamento também enviado.
- A TASK-006 pode ser iniciada sem bloqueio de dependência.

## 10. Aprovação

- Decisão:
- Data:
- Observações:
