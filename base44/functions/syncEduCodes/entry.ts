import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const adminEmail = String(payload?.admin_email || '').trim().toLowerCase();

    if (adminEmail) {
      const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
      const isKnownAdmin = credentials.some((item) => String(item.email || '').trim().toLowerCase() === adminEmail);
      if (!isKnownAdmin) {
        return Response.json({ error: 'Acesso negado para sincronizar códigos da turma TC.' }, { status: 403 });
      }
    }

    const codes = await base44.asServiceRole.entities.AccessCode.list('-created_date', 1000);
    const eduCodesToSync = codes.filter((code) => String(code.code || '').startsWith('EDU-') && code.course !== 'tcc');

    let updated = 0;
    for (const code of eduCodesToSync) {
      await base44.asServiceRole.entities.AccessCode.update(code.id, { course: 'tcc' });
      updated += 1;
    }

    return Response.json({ success: true, message: `${updated} código(s) vinculados à turma TC.`, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});