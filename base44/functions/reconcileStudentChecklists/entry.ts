import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { checklistRoster, checklistBatchData } from '../../shared/checklistAuditData.ts';
import { buildVerifiedChecklist } from '../../shared/checklistVerification.ts';
import { readAll, pause } from '../../shared/moduleReleasePlan.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const cursor = typeof body.cursor === 'string' ? body.cursor : '';
    const batchSize = Math.min(20, Math.max(1, Number(body.batch_size) || 20));
    const dryRun = body.dry_run === true;
    const store = base44.asServiceRole.entities;
    const roster = await checklistRoster(store);
    const remaining = roster.filter(student => student.key.localeCompare(cursor) > 0);
    const selected = body.all_students === true ? remaining : remaining.slice(0, batchSize);
    if (!selected.length) return Response.json({ checked: 0, has_more: false, next_cursor: cursor });
    // One paginated pass through the sources; writes stay in small sequential batches.
    const data = await checklistBatchData(store, selected);
    const now = new Date().toISOString();
    const summary = { dry_run: dryRun, checked: 0, ambiguous_students: 0, completed_items: 0, newly_recognized_items: 0, created: 0, refreshed: 0, has_more: remaining.length > selected.length, next_cursor: selected[selected.length - 1].key, verified_at: now };
    for (let offset = 0; offset < selected.length; offset += batchSize) {
      const batch = selected.slice(offset, offset + batchSize);
      const existing = await readAll(store.ChecklistVerification, { student_key: { $in: batch.map(s => s.key) } });
      const creates = [], updates = [];
      for (const student of batch) {
        if (!student.aliases.length) { summary.ambiguous_students++; continue; }
        const result = buildVerifiedChecklist(student, data, now);
        const previous = existing.filter(row => row.student_key === student.key && row.course === student.course).sort((a, b) => Date.parse(b.verified_at) - Date.parse(a.verified_at))[0];
        for (const module of result.modules) {
          const old = previous?.modules?.find(row => row.moduleNumber === module.moduleNumber);
          for (const item of module.items.filter(row => row.done)) {
            summary.completed_items++;
            if (!old?.items?.some(row => row.key === item.key && row.done)) summary.newly_recognized_items++;
          }
        }
        if (previous) updates.push({ id: previous.id, ...result });
        else creates.push(result);
        summary.checked++;
      }
      if (!dryRun) {
        if (creates.length) { await store.ChecklistVerification.bulkCreate(creates); await pause(); }
        if (updates.length) { await store.ChecklistVerification.bulkUpdate(updates); await pause(); }
      }
      summary.created += creates.length;
      summary.refreshed += updates.length;
      console.info('Lote de checklist concluído', { checked: summary.checked, remaining: selected.length - offset - batch.length });
    }
    console.info('Conferência de checklist concluída', summary);
    return Response.json(summary);
  } catch (error) {
    console.error('Conferência interrompida; nenhuma baixa sem leitura completa das fontes.', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}