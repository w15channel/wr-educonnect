import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const exam = await base44.asServiceRole.entities.Exam.get(exam_id);
    if (!exam) {
      return Response.json({ error: 'Prova não encontrada' }, { status: 404 });
    }

    const existingScores = await base44.asServiceRole.entities.ScoreItem.filter({
      student_email,
      category: 'exam',
    });
    const matchingScore = existingScores?.find((item) => item.ref_id === `exam:${exam_id}` || item.ref_id === exam_id);

    const scoreData = {
      student_email,
      category: 'exam',
      ref_id: `exam:${exam_id}`,
      ref_title: exam.title,
      score: 50,
      max_score: 50,
      verified: true,
      notes: feedback || `Prova entregue/corrigida conforme a regra atual: +50 pontos de estudo. Nota registrada: ${grade}/${exam.max_grade || 50}`,
    };

    if (matchingScore) {
      await base44.asServiceRole.entities.ScoreItem.update(matchingScore.id, scoreData);
    } else {
      await base44.asServiceRole.entities.ScoreItem.create(scoreData);
    }

    await base44.functions.invoke('populateScoreCache', { student_email });

    return Response.json({
      success: true,
      message: 'Correção salva e pontuação atualizada',
      score: scoreData.score,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
