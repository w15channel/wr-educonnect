/**
 * deduplicateScoreItems
 *
 * Scans the entire ScoreItem table for records sharing the same
 * (student_email, category, ref_id) triplet — which must be globally unique.
 * For each duplicate group it keeps the record with the highest score (or the
 * most-recently updated one when scores are equal) and deletes the rest.
 *
 * This function can be called:
 *   - Manually by an admin to repair historical data
 *   - At the start of recalculateScores to guarantee a clean slate
 *
 * Returns a summary: { duplicateGroups, deletedItems, keptItems }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const isAutomation = ['scheduled', 'entity'].includes(payload?.automation?.type);
    const user = await base44.auth.me().catch(() => null);

    if (!isAutomation && user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // ── 1. Load all ScoreItems ──────────────────────────────────────────────
    const allItems = await base44.asServiceRole.entities.ScoreItem.list('-created_date', 50000);

    // ── 2. Group by unique key ─────────────────────────────────────────────
    const groups = new Map(); // key → [ScoreItem]
    for (const item of allItems) {
      if (!item.student_email || !item.category || !item.ref_id) continue;
      const key = `${item.student_email}|${item.category}|${item.ref_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    // ── 3. For each group with >1 record, keep best & delete rest ──────────
    let duplicateGroups = 0;
    let deletedItems = 0;
    let keptItems = 0;
    const deletedIds = [];

    for (const [, members] of groups) {
      if (members.length <= 1) {
        keptItems++;
        continue;
      }

      duplicateGroups++;

      // Priority: verified > higher score > more recent updated_date
      members.sort((a, b) => {
        if (a.verified !== b.verified) return b.verified ? 1 : -1;
        if (b.score !== a.score) return (Number(b.score) || 0) - (Number(a.score) || 0);
        const aDate = new Date(a.updated_date || a.created_date || 0).getTime();
        const bDate = new Date(b.updated_date || b.created_date || 0).getTime();
        return bDate - aDate;
      });

      const [keeper, ...dupes] = members;
      keptItems++;

      for (const dupe of dupes) {
        await base44.asServiceRole.entities.ScoreItem.delete(dupe.id);
        deletedIds.push(dupe.id);
        deletedItems++;
      }
    }

    return Response.json({
      success: true,
      totalScanned: allItems.length,
      duplicateGroups,
      deletedItems,
      keptItems,
      deletedIds,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});