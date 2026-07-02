import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { exam_id, student_email, grade, feedback } = payload;

    if (!exam_id || !student_email || grade === undefined) {
      return Response.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Get exam details
    const exam = await base44.asServiceRole.entities.Exam.get(exam_id);
    if (!exam) {
      return Response.json({ error: 'Prova não encontrada' }, { status: 404 });
    }

    // Create or update ScoreItem for the exam
    const existingScores = await base44.asServiceRole.entities.ScoreItem.filter({
      student_email,
      category: 'exam',
      ref_id: exam_id,
    });

    const scoreData = {
      student_email,
      category: 'exam',
      ref_id: exam_id,
      ref_title: exam.title,
      score: 60,
      max_score: 60,
      verified: true,
      notes: feedback || `Prova entregue/corrigida conforme a regra atual: +60 pontos de estudo. Nota registrada: ${grade}/${exam.max_grade || 60}`,
    };

    if (existingScores && existingScores.length > 0) {
      await base44.asServiceRole.entities.ScoreItem.update(existingScores[0].id, scoreData);
    } else {
      await base44.asServiceRole.entities.ScoreItem.create(scoreData);
    }

    return Response.json({
      success: true,
      message: 'Correção salva e pontuação atualizada',
      score: scoreData.score,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});