-- Recalcula e substitui pontuações publicadas conforme regra confirmada:
-- aulas assistidas = 2,0; tarefas entregues = 5,0; provas = 50,0; sessões/relatos de terapeutas = 10,0.
-- Execute a função recalculateScores após esta migração para recriar itens a partir das evidências.

UPDATE score_items
SET score = 2.0,
    max_score = 2.0,
    notes = 'Aula assistida por completo: +2 pontos de estudo.'
WHERE category = 'lesson'
  AND verified = TRUE;

UPDATE score_items
SET score = 5.0,
    max_score = 5.0,
    notes = 'Trabalho pontuado conforme a regra atual: +5 pontos.'
WHERE category = 'task'
  AND verified = TRUE
  AND COALESCE(ref_id, '') NOT LIKE 'therapist_pairing:%';

UPDATE score_items
SET score = 50.0,
    max_score = 50.0,
    notes = 'Prova entregue/corrigida conforme a regra atual: +50 pontos de estudo.'
WHERE category IN ('quiz', 'exam')
  AND verified = TRUE;

UPDATE score_items
SET score = 10.0,
    max_score = 10.0,
    notes = CASE
      WHEN COALESCE(notes, '') = '' THEN 'Sessão/relato de Terapeuta da Semana confirmado: +10 pontos.'
      ELSE notes
    END
WHERE verified = TRUE
  AND (category = 'therapist' OR COALESCE(ref_id, '') LIKE 'therapist_pairing:%');

UPDATE score_items
SET score = 0.0,
    max_score = 0.0,
    notes = 'Presença confirmada em live: sem pontuação pela regra atual.'
WHERE category = 'live_attendance';

WITH deduplicated AS (
  SELECT DISTINCT ON (student_email, category, ref_id)
    student_email,
    category,
    ref_id,
    CASE WHEN category = 'live_attendance' THEN 0 ELSE COALESCE(score, 0)::numeric END AS score
  FROM score_items
  WHERE verified = TRUE
    AND student_email IS NOT NULL
  ORDER BY student_email, category, ref_id, verified DESC, score DESC, updated_date DESC NULLS LAST, created_date DESC NULLS LAST
), totals AS (
  SELECT
    student_email,
    ROUND(SUM(score), 1)::DECIMAL(10,1) AS pontuacao_total,
    ROUND(SUM(CASE
      WHEN category IN ('lesson', 'task', 'quiz', 'exam') AND COALESCE(ref_id, '') NOT LIKE 'therapist_pairing:%'
      THEN score ELSE 0 END), 1)::DECIMAL(10,1) AS pontuacao_estudos
  FROM deduplicated
  GROUP BY student_email
)
UPDATE access_codes ac
SET pontuacao_total = COALESCE(t.pontuacao_total, 0),
    pontuacao_estudos = COALESCE(t.pontuacao_estudos, 0)
FROM totals t
WHERE ac.student_email = t.student_email;

WITH deduplicated AS (
  SELECT DISTINCT ON (student_email, category, ref_id)
    student_email,
    category,
    ref_id,
    CASE WHEN category = 'live_attendance' THEN 0 ELSE COALESCE(score, 0)::numeric END AS score
  FROM score_items
  WHERE verified = TRUE
    AND student_email IS NOT NULL
  ORDER BY student_email, category, ref_id, verified DESC, score DESC, updated_date DESC NULLS LAST, created_date DESC NULLS LAST
), totals AS (
  SELECT
    student_email,
    ROUND(SUM(score), 1)::DECIMAL(10,1) AS pontuacao_total,
    ROUND(SUM(CASE
      WHEN category IN ('lesson', 'task', 'quiz', 'exam') AND COALESCE(ref_id, '') NOT LIKE 'therapist_pairing:%'
      THEN score ELSE 0 END), 1)::DECIMAL(10,1) AS pontuacao_estudos
  FROM deduplicated
  GROUP BY student_email
)
UPDATE student_profiles sp
SET pontuacao_total = COALESCE(t.pontuacao_total, 0),
    pontuacao_estudos = COALESCE(t.pontuacao_estudos, 0),
    points = COALESCE(t.pontuacao_total, 0)
FROM totals t
WHERE sp.student_email = t.student_email;

UPDATE access_codes ac
SET pontuacao_total = 0,
    pontuacao_estudos = 0
WHERE ac.student_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM score_items si WHERE si.student_email = ac.student_email AND si.verified = TRUE
  );

UPDATE student_profiles sp
SET pontuacao_total = 0,
    pontuacao_estudos = 0,
    points = 0
WHERE sp.student_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM score_items si WHERE si.student_email = sp.student_email AND si.verified = TRUE
  );
