# Liberação de Provas (ferramenta do admin)

Permite ao administrador acompanhar, aluno a aluno, o percentual do checklist
cumprido no **módulo em vigência** e liberar as provas de quem já cumpriu o
exigido.

## Onde fica

- Menu **Gestão → Liberação de Provas** (`/adm/exam-release`).
- A rota é protegida por `AdminOnly`; alunos são redirecionados para a dashboard
  e a página também exibe um aviso caso a sessão não seja de admin.

## O que é exibido por aluno

- Módulo em vigência (o último liberado em `StudentModuleUnlock`, começando no 1).
- Total de atividades exigidas no módulo, cumpridas, faltantes e percentual.
- Quais requisitos ainda estão pendentes.
- Se o aluno atingiu o mínimo (`EXAM_RELEASE_MIN_PERCENT`, hoje 100%).
- Se as provas já foram liberadas manualmente (`ExamRelease`).

## Regras e onde elas moram

- Requisitos do módulo: `src/lib/examChecklistRules.js` (mesmas regras do
  checklist do aluno) — o resumo vem de `summarizeChecklistProgress` e o guarda
  de liberação de `examReleaseBlockReason` / `canReleaseExams`.
- Agrupamento por aluno: `src/lib/adminModuleProgress.js`.
- Carga dos dados da turma: `src/hooks/useAdminModuleProgress.js`.

## Liberação

O botão só fica ativo para alunos aptos. A gravação passa pela função de backend
`base44/functions/releaseModuleExams`, que:

1. valida o e-mail do admin em `AdminCredential` (mesmo critério do `adminSave`);
2. valida `student_email`, `module_number` (1–10) e a ação (`release`/`revoke`);
3. **recalcula o checklist no servidor** (`base44/shared/examChecklistProgress.ts`)
   — percentuais enviados pelo navegador não são aceitos como prova de
   elegibilidade — e recusa a liberação (HTTP 409) de quem não atingiu o mínimo;
4. grava/atualiza o registro `ExamRelease` com o percentual do momento.

Em `/exams`, a prova de um módulo abre quando o checklist do aluno está completo
**ou** quando existe um `ExamRelease` do admin para aquele módulo.

> Ao alterar as regras do checklist em `src/lib/examChecklistRules.js`, atualize
> também o espelho do backend em `base44/shared/examChecklistProgress.ts`.

## Testes

`npm test` (Vitest) cobre o cálculo de percentual, a regra de elegibilidade e o
guarda de liberação — no app e no espelho do backend.
