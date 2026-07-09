import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════════════════
// auditFixAllScores
// ─────────────────────────────────────────────────────────────────────────
// Auditoria definitiva de pontuação. Corrige de uma vez, para TODOS os alunos:
//   1. ScoreItems duplicados (mesmo student|category|ref_id) → mantém 1, apaga o resto
//   2. ScoreItems "task"/"quiz" órfãos: sem TaskSubmission real correspondente
//   3. ScoreItems "exam" órfãos: sem ExamSubmission real correspondente
//   4. ScoreItems "live_attendance" com score > 0 → lives valem 0 hoje
//   5. Recalcula StudentProfile / AccessCode / cache com base APENAS nos itens válidos
//
// Regras oficiais (fonte da verdade):
//   lesson 2 · task 5 · quiz/exam 50 · forum 0.1(+bônus) · therapist 10 · live 0
//
// Uso:
//   { dry_run: true }  → só relatório, não apaga nada
//   {}                 → executa a correção completa
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function roundScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

function isTherapistRef(item) {
  return String(item?.ref_id || '').startsWith('therapist_pairing:');
}

function isStudyItem(item) {
  return ['lesson', 'task', 'quiz', 'exam'].includes(item?.category) && !isTherapistRef(item);
}

function rankingScore(item) {
  if (item?.category === 'live_attendance') return 0;
  return roundScore(item?.score);
}

async function fetchAllPages(lister, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await lister(pageSize, skip);
    if (!page || page.length === 0) break;
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
    await sleep(120);
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = ['scheduled', 'entity'].includes(payload?.automation?.type);
    const user = await base44.auth.me().catch(() => null);

    if (!isAutomation && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const dryRun = payload?.dry_run === true;

    // ── Carrega tudo o que precisamos para validar ──────────────────────────
    const [scoreItems, taskSubs, examSubs, accessCodes, profiles] = await Promise.all([
      fetchAllPages((limit, skip) => base44.asServiceRole.entities.ScoreItem.list('-created_date', limit, skip)),
      fetchAllPages((limit, skip) => base44.asServiceRole.entities.TaskSubmission.list('-created_date', limit, skip)),
      fetchAllPages((limit, skip) => base44.asServiceRole.entities.ExamSubmission.list('-submitted_at', limit, skip)),
      base44.asServiceRole.entities.AccessCode.list('-created_date', 20000),
      base44.asServiceRole.entities.StudentProfile.list('-updated_date', 20000),
    ]);

    // Conjuntos de validação: qual (aluno, tarefa/prova) tem entrega real
    const validTaskKeys = new Set(); // `${email}|${task_id}`
    taskSubs.forEach((s) => { if (s.student_email && s.task_id) validTaskKeys.add(`${s.student_email}|${s.task_id}`); });
    const validExamKeys = new Set(); // `${email}|exam:${exam_id}`  E também `${email}|${exam_id}`
    examSubs.forEach((s) => {
      if (s.student_email && s.exam_id) {
        validExamKeys.add(`${s.student_email}|exam:${s.exam_id}`);
        validExamKeys.add(`${s.student_email}|${s.exam_id}`);
      }
    });

    // ── Fase 1: decidir o que apagar ────────────────────────────────────────
    const seen = new Map(); // `${email}|${category}|${ref_id}` → item vencedor mantido
    const toDelete = [];
    const stats = { duplicates: 0, orphanTask: 0, orphanExam: 0, liveWithScore: 0, invalid: 0 };

    for (const item of scoreItems) {
      const email = item.student_email;
      if (!email || !item.category || !item.ref_id) { toDelete.push(item.id); stats.invalid++; continue; }

      // Órfãos: quiz/task sem submission; exam sem ExamSubmission
      if ((item.category === 'task' || item.category === 'quiz') && !isTherapistRef(item)) {
        if (!validTaskKeys.has(`${email}|${item.ref_id}`)) { toDelete.push(item.id); stats.orphanTask++; continue; }
      }
      if (item.category === 'exam') {
        const bareRef = String(item.ref_id || '').replace(/^exam:/, '');
        if (!validExamKeys.has(`${email}|${item.ref_id}`) && !validExamKeys.has(`${email}|${bareRef}`) && !validExamKeys.has(`${email}|exam:${bareRef}`)) {
          toDelete.push(item.id); stats.orphanExam++; continue;
        }
      }
      // Lives com score → resíduo (hoje valem 0)
      if (item.category === 'live_attendance' && (Number(item.score) || 0) !== 0) {
        toDelete.push(item.id); stats.liveWithScore++; continue;
      }

      // Deduplicação: mantém verificado > maior score > mais recente
      const key = `${email}|${item.category}|${item.ref_id}`;
      const prev = seen.get(key);
      if (!prev) { seen.set(key, item); continue; }
      const keepPrev =
        (prev.verified && !item.verified) ||
        (prev.verified === item.verified && (Number(prev.score) || 0) >= (Number(item.score) || 0));
      if (keepPrev) { toDelete.push(item.id); stats.duplicates++; }
      else { toDelete.push(prev.id); stats.duplicates++; seen.set(key, item); }
    }

    if (dryRun) {
      return Response.json({
        success: true, dryRun: true,
        totalScoreItems: scoreItems.length,
        toDeleteTotal: toDelete.length,
        breakdown: stats,
        validItemsRemaining: seen.size,
      });
    }

    // ── Fase 2: apagar o lixo em ondas ──────────────────────────────────────
    let deleted = 0, failed = 0;
    const WAVE = 8;
    for (let i = 0; i < toDelete.length; i += WAVE) {
      const wave = toDelete.slice(i, i + WAVE);
      const results = await Promise.allSettled(wave.map((id) => base44.asServiceRole.entities.ScoreItem.delete(id)));
      results.forEach((r) => r.status === 'fulfilled' ? deleted++ : failed++);
      await sleep(250);
    }

    // ── Fase 3: recalcular totais SÓ com os itens válidos que ficaram ────────
    const totals = new Map();
    const studyTotals = new Map();
    for (const item of seen.values()) {
      if (!item.verified || !item.student_email) continue;
      const email = item.student_email;
      totals.set(email, roundScore((totals.get(email) || 0) + rankingScore(item)));
      if (isStudyItem(item)) {
        studyTotals.set(email, roundScore((studyTotals.get(email) || 0) + roundScore(item.score)));
      }
    }

    // ── Fase 4: gravar cache/profile de cada aluno ──────────────────────────
    const emails = [...new Set([
      ...accessCodes.map((c) => c.student_email).filter(Boolean),
      ...profiles.map((p) => p.student_email).filter(Boolean),
    ])];

    let updated = 0;
    for (const email of emails) {
      const total = roundScore(totals.get(email) || 0);
      const study = roundScore(studyTotals.get(email) || 0);

      for (const p of profiles.filter((x) => x.student_email === email)) {
        await base44.asServiceRole.entities.StudentProfile.update(p.id, {
          points: total, pontuacao_total: total, pontuacao_estudos: study,
        }).catch(() => null);
      }
      for (const c of accessCodes.filter((x) => x.student_email === email)) {
        await base44.asServiceRole.entities.AccessCode.update(c.id, {
          pontuacao_total: total, pontuacao_estudos: study,
        }).catch(() => null);
      }
      updated++;
      if (updated % 20 === 0) await sleep(200);
    }

    return Response.json({
      success: true,
      totalScoreItemsBefore: scoreItems.length,
      deleted, failed,
      breakdown: stats,
      validItemsRemaining: seen.size,
      studentsRecalculated: updated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});