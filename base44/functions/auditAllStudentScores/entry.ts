import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT ALL STUDENT SCORES — Anti-Duplication Guard
// ─────────────────────────────────────────────────────────────────────────
// Detects and removes:
//   1. Legacy 'therapist' category items where the pairing is already scored
//      by a canonical 'task' category item (therapist_pairing:{id}:{role})
//   2. Exact duplicates: same (student_email, category, ref_id) — keeps best
//
// NOTE: Does NOT sync caches. After this runs, trigger recalculateScores
//       to recompute totals. The daily automation chains them.
// ═══════════════════════════════════════════════════════════════════════════

async function fetchAllPages(entityFn, sort, pageSize = 5000) {
  let all = [];
  let skip = 0;
  while (true) {
    const page = await entityFn(sort, pageSize, skip);
    if (!page || page.length === 0) break;
    all = all.concat(page);
    if (page.length < pageSize) break;
    skip += pageSize;
  }
  return all;
}

function scoreTime(item) {
  return new Date(item.updated_date || item.created_date || 0).getTime();
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

    const scoreItems = await base44.asServiceRole.entities.ScoreItem.list('-created_date', 10000);

    const deletedIds = new Set();
    const issues = [];
    let deletedLegacyTherapist = 0;
    let deletedExactDuplicates = 0;

    // ── 1. Legacy 'therapist' cross-category duplicates ──────────────────
    // Build set of pairing IDs covered by canonical 'task' therapist_pairing items
    const canonicalPairingIds = new Set();
    for (const item of scoreItems) {
      if (item.category === 'task' && String(item.ref_id || '').startsWith('therapist_pairing:')) {
        const pairingId = String(item.ref_id).split(':')[1];
        if (pairingId) canonicalPairingIds.add(pairingId);
      }
    }

    for (const item of scoreItems) {
      if (deletedIds.has(item.id)) continue;
      if (item.category === 'therapist' && canonicalPairingIds.has(item.ref_id)) {
        await base44.asServiceRole.entities.ScoreItem.delete(item.id).catch(() => null);
        deletedIds.add(item.id);
        deletedLegacyTherapist++;
        issues.push({ type: 'legacy_therapist_dup', student: item.student_email, ref_id: item.ref_id, pts: item.score });
      }
    }

    // ── 2. Exact duplicates: same (email | category | ref_id) ────────────
    const byKey = new Map();
    for (const item of scoreItems) {
      if (deletedIds.has(item.id)) continue;
      if (!item.student_email || !item.category || !item.ref_id) continue;
      const key = `${String(item.student_email).toLowerCase().trim()}|${item.category}|${item.ref_id}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(item);
    }

    for (const group of byKey.values()) {
      if (group.length <= 1) continue;
      // Keep: verified first, then highest score, then most recent
      const best = [...group].sort((a, b) => {
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        const sd = (Number(b.score) || 0) - (Number(a.score) || 0);
        if (sd !== 0) return sd;
        return scoreTime(b) - scoreTime(a);
      })[0];
      for (const dup of group) {
        if (dup.id === best.id) continue;
        await base44.asServiceRole.entities.ScoreItem.delete(dup.id).catch(() => null);
        deletedIds.add(dup.id);
        deletedExactDuplicates++;
        issues.push({ type: 'exact_dup', student: dup.student_email, category: dup.category, ref_id: dup.ref_id, pts: dup.score });
      }
    }

    return Response.json({
      success: true,
      totalScoreItemsScanned: scoreItems.length,
      deletedLegacyTherapist,
      deletedExactDuplicates,
      totalDeleted: deletedIds.size,
      issues,
      ranAt: new Date().toISOString(),
      note: deletedIds.size > 0
        ? 'Duplicatas removidas. Execute recalculateScores para atualizar totais.'
        : 'Nenhuma duplicata encontrada. Base de pontuação íntegra.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});