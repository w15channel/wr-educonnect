# Revisão de distribuição interna (entidades) e adaptação mobile

## 1) Mapa de responsabilidade por entidade

### Identidade e acesso
- `User`: identidade base de autenticação e papel (admin/aluno).
- `AccessCode`: onboarding e vínculo inicial do aluno por curso.
- `AdminCredential`: credencial administrativa operacional.
- `StudentProfile`: dados de perfil acadêmico exibidos em telas de aluno.

### Acadêmico e avaliação
- `RecordedLesson`, `LiveSession`, `LiveAttendance`: trilha de aula gravada, ao vivo e presença.
- `Task`, `TaskSubmission`: proposta de atividade e entrega.
- `ScoreItem`: item de nota por referência (aula, live, quiz, tarefa).
- `LessonProgress`: progresso do consumo de conteúdo.
- `MonitorFeedback`, `MonitorHistory`: qualidade de monitoria e histórico.

### Comunidade e comunicação
- `ForumPost`, `ForumReply`, `ChatMessage`: colaboração assíncrona e síncrona.
- `Announcement`, `Notification`: comunicação institucional e alertas.

### Operação e financeiro
- `Tuition`: mensalidades e status financeiro.
- `CalendarEvent`: agenda institucional/acadêmica.
- `TherapistPairing`: relacionamento terapêutico/alocação.
- `SiteImprovementRequest`: canal interno de melhoria.
- `Book`, `BookChapter`: biblioteca e capítulos.

## 2) Pontos de sobreposição/duplicidade para tratar

1. **Dados de perfil duplicados em `AccessCode` e `StudentProfile`**  
   Recomendação: manter `AccessCode` apenas para acesso (`code`, `student_email`, `course`, `is_active`) e consolidar dados de exibição no `StudentProfile`.

2. **Comunicação potencialmente redundante (`Announcement` vs `Notification`)**  
   Recomendação: usar `Announcement` para mensagem institucional por curso e `Notification` para evento transacional por usuário.

3. **Fragmentação de nota entre `TaskSubmission.grade` e `ScoreItem.score`**  
   Recomendação: definir `ScoreItem` como fonte oficial para ranking e histórico; usar `TaskSubmission.grade` somente como entrada do corretor.

4. **Possível ambiguidade entre `LiveAttendance` e presença convertida em `ScoreItem`**  
   Recomendação: `LiveAttendance` guarda evidência de presença; `ScoreItem` guarda impacto em nota.

## 3) Regras de organização sugeridas (modelo alvo)

- **Single Source of Truth por domínio**:
  - Acesso: `AccessCode`
  - Perfil: `StudentProfile`
  - Avaliação/ranking: `ScoreItem`
  - Entrega bruta: `TaskSubmission`

- **Padronização de chaves de vínculo**:
  - Priorizar sempre `student_email` + `course` em registros relacionáveis.

- **Nomenclatura de status**:
  - Evitar variações de idioma no mesmo domínio (`active/inactive`, `paid/pending/overdue`) e documentar enums oficiais.

## 4) Checklist de UX mobile por formulário/campo

1. Inputs críticos com altura mínima de toque (`>= 40px`).
2. Seletores ocupando largura total em telas pequenas.
3. Botões de ação primária/secundária empilháveis em mobile.
4. Informações densas em cards com blocos de métrica (evitar tabela horizontal).
5. Ações destrutivas separadas visualmente (cor, borda e confirmação).

## 5) Ajustes já aplicados nesta iteração

- Reorganização da página de alunos para mobile com:
  - barra de filtros/ações em layout responsivo;
  - cards com métricas (entregas e média);
  - status editável no próprio card;
  - botões com melhor área de toque e rótulo explícito.

## 6) Próxima etapa recomendada

Aplicar o mesmo padrão mobile-first nas páginas com maior densidade de dados:
1. `ScoreControl`
2. `Tasks` / `TaskQuizView`
3. `Tuitions`
4. `Forum` (composer + listagem)
