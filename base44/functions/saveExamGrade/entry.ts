import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { examScoreNote } from '../../shared/scoreMessages.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const payload = await req.json().catch(() => ({}));
    const { exam_id, student_email, grade, feedback, admin_email } = payload;

    // Auth: native admin role, AdminCredential, or AccessCode with admin/management profile
    let isAdmin = user?.role === 'admin';
    if (!isAdmin && admin_email) {
      const normAdmin = String(admin_email).trim().toLowerCase();
      const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
      isAdmin = credentials.some((c) => String(c.email || '').trim().toLowerCase() === normAdmin);
      if (!isAdmin) {
        const codes = await base44.asServiceRole.entities.AccessCode.filter(
          { student_email: normAdmin }, '-created_date', 10
        );
        isAdmin = codes.some((c) =>
          c.is_active !== false &&
          ['admin', 'management'].includes(c.profile_category)
        );
      }
    }
    if (!isAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

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
      notes: feedback || examScoreNote(exam_id, grade),
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
