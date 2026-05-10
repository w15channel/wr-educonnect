-- Migração do cache de pontuação total (DECIMAL(10,3)).
-- Ajuste os nomes físicos das tabelas se o provedor Base44 expor nomes diferentes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pontuacao_total DECIMAL(10,3) NOT NULL DEFAULT 0.000;

ALTER TABLE access_codes
  ADD COLUMN IF NOT EXISTS pontuacao_total DECIMAL(10,3) NOT NULL DEFAULT 0.000;

ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS pontuacao_total DECIMAL(10,3) NOT NULL DEFAULT 0.000;

-- Popular valores históricos somando exclusivamente itens verificados e já arredondados.
WITH totais AS (
  SELECT
    student_email,
    ROUND(SUM(ROUND(COALESCE(score, 0)::numeric, 3)), 3)::DECIMAL(10,3) AS total
  FROM score_items
  WHERE verified = TRUE
  GROUP BY student_email
)
UPDATE access_codes ac
SET pontuacao_total = COALESCE(t.total, 0.000)
FROM totais t
WHERE ac.student_email = t.student_email;

UPDATE access_codes
SET pontuacao_total = 0.000
WHERE student_email IS NOT NULL
  AND student_email NOT IN (SELECT student_email FROM totais);

UPDATE student_profiles sp
SET pontuacao_total = COALESCE(t.total, 0.000),
    points = COALESCE(t.total, 0.000)
FROM totais t
WHERE sp.student_email = t.student_email;

UPDATE users u
SET pontuacao_total = COALESCE(t.total, 0.000)
FROM totais t
WHERE u.email = t.student_email;
