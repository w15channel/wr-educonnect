import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { isOutstandingTuition, tuitionSettlement } from '../../shared/tuitionSettlement.ts';

const PAGE_SIZE = 500;
const WRITE_BATCH = 25;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const dryRun = payload.dry_run === true;
    const today = new Date().toISOString().slice(0, 10);
    const store = base44.asServiceRole.entities.Tuition;
    const outstanding = [];

    for (let skip = 0; ; skip += PAGE_SIZE) {
      const page = await store.list('created_date', PAGE_SIZE, skip);
      outstanding.push(...page.filter(row => isOutstandingTuition(row, today)));
      if (page.length < PAGE_SIZE) break;
    }

    if (!dryRun) {
      const settlement = tuitionSettlement(today);
      for (let offset = 0; offset < outstanding.length; offset += WRITE_BATCH) {
        const batch = outstanding.slice(offset, offset + WRITE_BATCH);
        await Promise.all(batch.map(row => store.update(row.id, settlement)));
      }
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      settled: outstanding.length,
      paid_amount: 0.01,
      paid_date: today,
    });
  } catch (error) {
    console.error('Falha ao quitar mensalidades devedoras.', error);
    return Response.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
