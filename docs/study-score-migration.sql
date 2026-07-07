-- Migração da nova métrica de pontuação.
-- pontuacao_estudos = apenas aulas assistidas, trabalhos entregues e provas.
-- pontuacao_total = pontuação de ranking geral, excluindo lives e somando estudos + demais atividades do site.

ALTER TABLE access_codes
  ADD COLUMN IF NOT EXISTS pontuacao_estudos DECIMAL(10,3) NOT NULL DEFAULT 0.000;

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS pontuacao_estudos DECIMAL(10,3) NOT NULL DEFAULT 0.000;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pontuacao_estudos DECIMAL(10,3) NOT NULL DEFAULT 0.000;

-- Zera lives legadas para que não gerem pontuação após a mudança de regra.
UPDATE score_items
SET score = 0.000,
    max_score = 0.000,
    notes = COALESCE(NULLIF(notes, ''), 'Presença confirmada em live: sem pontuação pela regra atual.')
WHERE category = 'live_attendance';

WITH totals AS (
  SELECT
    student_email,
    ROUND(SUM(CASE WHEN category = 'live_attendance' THEN 0 ELSE COALESCE(score, 0)::numeric END), 3)::DECIMAL(10,3) AS ranking_total,
    ROUND(SUM(CASE
      WHEN category IN ('lesson', 'task', 'quiz', 'exam')
       AND COALESCE(ref_id, '') NOT LIKE 'therapist_pairing:%'
      THEN COALESCE(score, 0)::numeric
      ELSE 0
    END), 3)::DECIMAL(10,3) AS study_total
  FROM score_items
  WHERE verified = true
  GROUP BY student_email
)
UPDATE access_codes c
SET pontuacao_total = COALESCE(t.ranking_total, 0.000),
    pontuacao_estudos = COALESCE(t.study_total, 0.000)
FROM totals t
WHERE c.student_email = t.student_email;

WITH totals AS (
  SELECT
    student_email,
    ROUND(SUM(CASE WHEN category = 'live_attendance' THEN 0 ELSE COALESCE(score, 0)::numeric END), 3)::DECIMAL(10,3) AS ranking_total,
    ROUND(SUM(CASE
      WHEN category IN ('lesson', 'task', 'quiz', 'exam')
       AND COALESCE(ref_id, '') NOT LIKE 'therapist_pairing:%'
      THEN COALESCE(score, 0)::numeric
      ELSE 0
    END), 3)::DECIMAL(10,3) AS study_total
  FROM score_items
  WHERE verified = true
  GROUP BY student_email
)
UPDATE student_profiles p
SET pontuacao_total = COALESCE(t.ranking_total, 0.000),
    points = COALESCE(t.ranking_total, 0.000),
    pontuacao_estudos = COALESCE(t.study_total, 0.000)
FROM totals t
WHERE p.student_email = t.student_email;
