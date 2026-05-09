import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only check
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all access codes
    const codes = await base44.entities.AccessCode.list('-created_date', 500);

    // Filter EDU- codes that don't have course = 'tcc'
    const eduCodesToSync = codes.filter(c => c.code && c.code.startsWith('EDU-') && c.course !== 'tcc');

    if (eduCodesToSync.length === 0) {
      return Response.json({ success: true, message: 'No EDU codes to sync', updated: 0 });
    }

    // Update each to course='tcc'
    let updated = 0;
    for (const code of eduCodesToSync) {
      await base44.entities.AccessCode.update(code.id, { course: 'tcc' });
      updated++;
    }

    return Response.json({ success: true, message: `Synced ${updated} EDU codes to TCC`, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});