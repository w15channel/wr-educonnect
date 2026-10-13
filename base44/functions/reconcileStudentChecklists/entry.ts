import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { contributionAward, verifiedModuleAwards, saveAutomaticAwards } from '../../shared/automaticAchievementAwards.ts';
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
    let requestedEmail = String(body.student_email || '').trim().toLowerCase();
    if (body.source_entity || body.source_id) {
      if (!['Tuition', 'ExamSubmission'].includes(body.source_entity) || !body.source_id) return Response.json({ error: 'Origem inválida.' }, { status: 400 });
      const source = await store[body.source_entity].get(body.source_id);
      requestedEmail = String(source?.student_email || '').trim().toLowerCase();
      if (!requestedEmail) return Response.json({ error: 'Aluno não identificado.' }, { status: 400 });
    }
    const remaining = roster.filter(student => student.key.localeCompare(cursor) > 0 && (!requestedEmail || student.aliases.includes(requestedEmail)));
    const selected = body.all_students === true ? remaining : remaining.slice(0, batchSize);
    if (!selected.length) return Response.json({ checked: 0, has_more: false, next_cursor: cursor });
    // Evidence queries and writes stay in bounded sequential batches.
    const now = new Date().toISOString();
    const summary = { dry_run: dryRun, checked: 0, ambiguous_students: 0, completed_items: 0, newly_recognized_items: 0, created: 0, refreshed: 0, trophies_granted: 0, diamonds_granted: 0, has_more: remaining.length > selected.length, next_cursor: selected[selected.length - 1].key, verified_at: now };
    for (let offset = 0; offset < selected.length; offset += batchSize) {
      const batch = selected.slice(offset, offset + batchSize);
      const data = await checklistBatchData(store, batch);
      const existing = await readAll(store.ChecklistVerification, { student_key: { $in: batch.map(s => s.key) } });
      const creates = [], updates = [], trophies = [], diamonds = [], sharedTuitions = [];
      for (const student of batch) {
        if (!student.aliases.length) { summary.ambiguous_students++; continue; }
        const result = buildVerifiedChecklist(student, data, now);
        trophies.push(...verifiedModuleAwards(student, result, data, now));
        for (const tuition of data.Tuition.filter(row => student.aliases.includes(String(row.student_email || '').trim().toLowerCase()))) {
          const award = contributionAward(tuition, student, now);
          if (award) {
            diamonds.push(award);
            if (!tuition.wall_shared) sharedTuitions.push({ id: tuition.id, wall_shared: true });
          }
        }
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
      summary.trophies_granted += await saveAutomaticAwards(store, trophies, dryRun);
      await pause();
      summary.diamonds_granted += await saveAutomaticAwards(store, diamonds, dryRun);
      if (!dryRun && sharedTuitions.length) {
        await store.Tuition.bulkUpdate([...new Map(sharedTuitions.map(row => [row.id, row])).values()]);
        await pause();
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