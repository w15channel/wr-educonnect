import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito ao administrador.' }, { status: 403 });
    }

    const all = await base44.asServiceRole.entities.StudentProfile.list('-created_date', 2000);

    // Agrupa por (email normalizado + dashboard_course). Perfis sem course
    // agrupam-se sob a chave "null" para não somar cursos diferentes.
    const norm = (v: string) => String(v || '').trim().toLowerCase();
    const groups = new Map<string, typeof all>();
    for (const p of all) {
      const courseKey = p.dashboard_course || '__no_course__';
      const key = `${norm(p.student_email)}|${courseKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    let deletedCount = 0;
    let keptCount = 0;
    const batchDeletes: string[] = [];

    for (const [, records] of groups) {
      if (records.length <= 1) {
        keptCount += records.length;
        continue;
      }

      // Seleciona o "melhor" registro: o mais completo (mais campos preenchidos),
      // e em caso de empate, o mais recentemente atualado.
      const fieldCount = (r: typeof records[0]) =>
        ['full_name', 'nickname', 'email', 'birth_date', 'whatsapp', 'photo_url',
         'avatar_color', 'avatar_emoji', 'bio', 'points', 'pontuacao_total',
         'pontuacao_estudos', 'dashboard_rank', 'dashboard_course',
         'pontuacao_total_manual', 'participacoes_manual']
        .filter((f) => {
          const val = (r as Record<string, unknown>)[f];
          return val !== undefined && val !== null && val !== '' && val !== 0;
        }).length;

      const sorted = [...records].sort((a, b) => {
        const fa = fieldCount(a);
        const fb = fieldCount(b);
        if (fb !== fa) return fb - fa;
        return new Date(b.updated_date || 0).getTime() - new Date(a.updated_date || 0).getTime();
      });

      const keeper = sorted[0];
      const dups = sorted.slice(1);

      // Mescla campos não-vazios dos duplicados no keeper antes de excluí-los,
      // para não perder dados que existem apenas em cópias secundárias.
      const merged: Record<string, unknown> = { ...keeper };
      for (const dup of dups) {
        for (const field of ['full_name', 'nickname', 'email', 'birth_date',
          'whatsapp', 'photo_url', 'avatar_color', 'avatar_emoji', 'bio',
          'pontuacao_total_manual', 'participacoes_manual']) {
          const current = merged[field];
          const candidate = (dup as Record<string, unknown>)[field];
          if ((current === undefined || current === null || current === '') &&
              candidate !== undefined && candidate !== null && candidate !== '') {
            merged[field] = candidate;
          }
        }
      }

      // Atualiza o keeper com os campos mesclados (apenas se houver mudança).
      const updateData: Record<string, unknown> = {};
      for (const field of Object.keys(merged)) {
        if (merged[field] !== (keeper as Record<string, unknown>)[field]) {
          updateData[field] = merged[field];
        }
      }
      if (Object.keys(updateData).length > 0) {
        await base44.asServiceRole.entities.StudentProfile.update(keeper.id, updateData);
      }

      for (const dup of dups) {
        batchDeletes.push(dup.id);
      }
      keptCount += 1;
    }

    // Exclui em lotes de 500 (limite da plataforma).
    for (let i = 0; i < batchDeletes.length; i += 500) {
      const chunk = batchDeletes.slice(i, i + 500);
      if (chunk.length === 0) break;
      await base44.asServiceRole.entities.StudentProfile.deleteMany({ id: { $in: chunk } });
      deletedCount += chunk.length;
    }

    return Response.json({
      success: true,
      totalBefore: all.length,
      kept: keptCount,
      deleted: deletedCount,
      totalAfter: all.length - deletedCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}