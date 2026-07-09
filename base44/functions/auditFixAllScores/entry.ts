import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════════════════
// auditFixAllScores  —  auditoria de pontuação em LOTES RECURSIVOS
// ─────────────────────────────────────────────────────────────────────────
// Processa os alunos em blocos (BATCH). Cada execução:
//   1. Pega um lote de alunos (por email, ordenado) a partir de `offset`
//   2. Para cada aluno do lote, carrega SÓ os dados dele e:
//      - remove ScoreItems duplicados (mesmo category|ref_id → mantém 1)
//      - remove ScoreItems "task"/"quiz" órfãos (sem TaskSubmission)
//      - remove ScoreItems "exam" órfãos (sem ExamSubmission)
//      - remove ScoreItems "live_attendance" com score > 0
//      - recalcula StudentProfile / AccessCode com base nos itens válidos
//   3. Se ainda houver alunos, auto-invoca para o próximo `offset`
//
// Regras oficiais: lesson 2 · task 5 · quiz/exam 50 · forum 0.1 · therapist 10 · live 0
//
// Uso:
//   {}                       → começa do zero e roda até o fim sozinha
//   { offset: 0 }            → idem
//   { dry_run: true }        → só relatório do lote, não apaga nada, não recorre
//   { auto_continue: false } → processa apenas UM lote e para (para testes)
// ═══════════════════════════════════════════════════════════════════════════

const BATCH = 40; // alunos por execução

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
    const autoContinue = payload?.auto_continue !== false; // padrão: continua sozinha
    const offset = Math.max(0, Number(payload?.offset) || 0);

    // ── Lista de todos os emails de alunos (fonte única, ordenada) ───────────
    // AccessCode é a fonte da verdade de "quem é aluno".
    const accessCodes = await base44.asServiceRole.entities.AccessCode.list('-created_date', 20000);
    const allEmails = [...new Set(accessCodes.map((c) => c.student_email).filter(Boolean))].sort();
    const totalStudents = allEmails.length;

    const batchEmails = allEmails.slice(offset, offset + BATCH);
    const hasMore = offset + BATCH < totalStudents;

    const stats = { duplicates: 0, orphanTask: 0, orphanExam: 0, liveWithScore: 0, invalid: 0 };
    let deleted = 0, failed = 0, updated = 0;

    for (const email of batchEmails) {
      // Carrega SÓ os dados deste aluno
      const [items, taskSubs, examSubs] = await Promise.all([
        base44.asServiceRole.entities.ScoreItem.filter({ student_email: email }, '-created_date', 5000),
        base44.asServiceRole.entities.TaskSubmission.filter({ student_email: email }, '-created_date', 2000),
        base44.asServiceRole.entities.ExamSubmission.filter({ student_email: email }, '-created_date', 2000),
      ]);

      const validTaskKeys = new Set();
      taskSubs.forEach((s) => { if (s.task_id) validTaskKeys.add(String(s.task_id)); });
      const validExamKeys = new Set();
      examSubs.forEach((s) => { if (s.exam_id) validExamKeys.add(String(s.exam_id)); });

      const seen = new Map(); // `${category}|${ref_id}` → item mantido
      const toDelete = [];

      for (const item of items) {
        if (!item.category || !item.ref_id) { toDelete.push(item.id); stats.invalid++; continue; }

        // Órfãos
        if ((item.category === 'task' || item.category === 'quiz') && !isTherapistRef(item)) {
          if (!validTaskKeys.has(String(item.ref_id))) { toDelete.push(item.id); stats.orphanTask++; continue; }
        }
        if (item.category === 'exam') {
          const bareRef = String(item.ref_id || '').replace(/^exam:/, '');
          if (!validExamKeys.has(String(item.ref_id)) && !validExamKeys.has(bareRef)) {
            toDelete.push(item.id); stats.orphanExam++; continue;
          }
        }
        // Live com score → resíduo
        if (item.category === 'live_attendance' && (Number(item.score) || 0) !== 0) {
          toDelete.push(item.id); stats.liveWithScore++; continue;
        }

        // Deduplicação: verificado > maior score > mais recente
        const key = `${item.category}|${item.ref_id}`;
        const prev = seen.get(key);
        if (!prev) { seen.set(key, item); continue; }
        const keepPrev =
          (prev.verified && !item.verified) ||
          (prev.verified === item.verified && (Number(prev.score) || 0) >= (Number(item.score) || 0));
        if (keepPrev) { toDelete.push(item.id); stats.duplicates++; }
        else { toDelete.push(prev.id); stats.duplicates++; seen.set(key, item); }
      }

      if (dryRun) continue;

      // Apaga o lixo deste aluno em ondas
      for (let i = 0; i < toDelete.length; i += 8) {
        const wave = toDelete.slice(i, i + 8);
        const results = await Promise.allSettled(wave.map((id) => base44.asServiceRole.entities.ScoreItem.delete(id)));
        results.forEach((r) => r.status === 'fulfilled' ? deleted++ : failed++);
        await sleep(120);
      }

      // Recalcula totais SÓ com itens válidos verificados
      let total = 0, study = 0;
      for (const item of seen.values()) {
        if (!item.verified) continue;
        total = roundScore(total + rankingScore(item));
        if (isStudyItem(item)) study = roundScore(study + roundScore(item.score));
      }

      // Grava profile + access code deste aluno
      const profiles = await base44.asServiceRole.entities.StudentProfile.filter({ student_email: email }, '-updated_date', 20);
      for (const p of profiles) {
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
      await sleep(80);
    }

    // ── Auto-invocação para o próximo lote ──────────────────────────────────
    if (!dryRun && autoContinue && hasMore) {
      // Dispara o próximo lote sem esperar a resposta (fire-and-forget)
      base44.functions.invoke('auditFixAllScores', { offset: offset + BATCH }).catch(() => null);
    }

    return Response.json({
      success: true,
      dryRun,
      totalStudents,
      processedRange: [offset, offset + batchEmails.length],
      studentsInBatch: batchEmails.length,
      hasMore,
      nextOffset: hasMore ? offset + BATCH : null,
      deleted, failed,
      studentsRecalculated: updated,
      breakdown: stats,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});