import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// closeModule — Encerra um módulo de um curso.
// 1) Captura o ranking geral atual (snapshot congelado) a partir dos AccessCodes/StudentProfiles.
// 2) Registra um ModuleClosure com o corte temporal (closed_at).
// 3) A partir do corte, o recalculateScores só conta ScoreItems criados APÓS closed_at,
//    reiniciando a contagem do ranking do zero para o novo módulo.

function roundScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round((numeric + Number.EPSILON) * 1000) / 1000;
}

function sameCourse(record, course) {
  return record?.course === course || (course === 'tcc' && !record?.course);
}

function displayName(code) {
  return code?.profile_name || code?.student_name || code?.student_email || '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    const payload = await req.json().catch(() => ({}));
    const adminEmail = payload?.admin_email || user?.email || '';
    const course = payload?.course;
    const moduleNumber = Number(payload?.module_number);

    // Auth: only admins can close modules (native admin OR verified custom admin_email).
    const isNativeAdmin = user?.role === 'admin';
    let isCustomAdmin = false;
    if (!isNativeAdmin && adminEmail) {
      // AdminCredential is the source of truth for custom admins
      const adminCreds = await base44.asServiceRole.entities.AdminCredential.filter({ email: adminEmail }, '-created_date', 1).catch(() => []);
      isCustomAdmin = adminCreds.length > 0;
    }
    if (!isNativeAdmin && !isCustomAdmin) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (!course || !Number.isFinite(moduleNumber) || moduleNumber <= 0) {
      return Response.json({ error: 'Parâmetros inválidos: course e module_number são obrigatórios.' }, { status: 400 });
    }

    // ── Build current ranking snapshot for this course ──────────────────────
    const [accessCodes, studentProfiles] = await Promise.all([
      base44.asServiceRole.entities.AccessCode.list('-created_date', 5000),
      base44.asServiceRole.entities.StudentProfile.list('-updated_date', 10000),
    ]);

    const courseCodes = accessCodes.filter(
      (c) => c.student_email && c.is_active !== false && sameCourse(c, course)
    );

    const profileByEmail = new Map();
    for (const p of studentProfiles) {
      if (!p.student_email) continue;
      if (p.dashboard_course === course || (!p.dashboard_course && course === 'tcc')) {
        if (!profileByEmail.has(p.student_email)) profileByEmail.set(p.student_email, p);
      }
    }

    const ranked = courseCodes
      .map((c) => {
        const profile = profileByEmail.get(c.student_email);
        const points = roundScore(c.pontuacao_total ?? profile?.pontuacao_total ?? profile?.points ?? 0);
        return { email: c.student_email, name: displayName(c), points, nameLower: displayName(c).toLowerCase() };
      })
      .sort((a, b) => (b.points !== a.points ? b.points - a.points : a.nameLower.localeCompare(b.nameLower, 'pt-BR')));

    const snapshot = ranked.map((r, idx) => ({
      student_email: r.email,
      student_name: r.name,
      points: roundScore(r.points),
      rank: idx + 1,
    }));

    const closedAt = new Date().toISOString();

    // ── Persist the closure ──────────────────────────────────────────────────
    const closure = await base44.asServiceRole.entities.ModuleClosure.create({
      course,
      module_number: moduleNumber,
      module_label: `Módulo ${moduleNumber}`,
      closed_at: closedAt,
      closed_by: adminEmail,
      snapshot,
    });

    // ── Reset ranking caches to zero for the new module ──────────────────────
    // ScoreItems are preserved (individual academic history stays intact).
    // recalculateScores will only count items created after closed_at from now on.
    let resetCount = 0;
    for (const c of courseCodes) {
      if (roundScore(c.pontuacao_total) !== 0 || roundScore(c.pontuacao_estudos) !== 0) {
        await base44.asServiceRole.entities.AccessCode.update(c.id, {
          pontuacao_total: 0,
          pontuacao_estudos: 0,
        }).catch(() => null);
        resetCount++;
      }
      const profile = profileByEmail.get(c.student_email);
      if (profile) {
        await base44.asServiceRole.entities.StudentProfile.update(profile.id, {
          points: 0,
          pontuacao_total: 0,
          pontuacao_estudos: 0,
        }).catch(() => null);
      }
    }

    return Response.json({
      success: true,
      closure_id: closure.id,
      course,
      module_number: moduleNumber,
      closed_at: closedAt,
      students_snapshotted: snapshot.length,
      caches_reset: resetCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});