import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Marca uma lista de ScoreItems como pertencentes a um módulo (1-10).
 * Usado pelo Controle de Pontuação: o admin escolhe o módulo e salva a
 * sequência — assim os pontos passam a aparecer no ranking por módulo do aluno.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { admin_email, module_number, score_item_ids } = payload;

    const normEmail = String(admin_email || '').trim().toLowerCase();
    if (!normEmail) return Response.json({ error: 'admin_email obrigatório.' }, { status: 403 });

    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
    const isValidAdmin = credentials.some((c) => String(c.email || '').trim().toLowerCase() === normEmail);
    if (!isValidAdmin) return Response.json({ error: 'Acesso não autorizado.' }, { status: 403 });

    const moduleNumber = Number(module_number);
    if (!Number.isFinite(moduleNumber) || moduleNumber < 1 || moduleNumber > 10) {
      return Response.json({ error: 'module_number deve ser um número entre 1 e 10.' }, { status: 400 });
    }

    const ids = Array.isArray(score_item_ids) ? [...new Set(score_item_ids.filter(Boolean))] : [];
    if (ids.length === 0) return Response.json({ success: true, updated: 0 });

    let updated = 0;
    for (let i = 0; i < ids.length; i += 200) {
      const batch = ids.slice(i, i + 200).map((id) => ({ id, module_number: moduleNumber }));
      await base44.asServiceRole.entities.ScoreItem.bulkUpdate(batch);
      updated += batch.length;
    }

    return Response.json({ success: true, updated, module_number: moduleNumber });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});