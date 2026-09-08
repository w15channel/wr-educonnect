import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function hashPassword(password) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(String(password || '') + '_educonnect')));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

function nowBRT() {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().replace('Z', '-03:00');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const mode = payload?.mode;

    if (mode === 'student') {
      const code = normalizeCode(payload?.code);
      if (!code) {
        return Response.json({ error: 'Informe o código de acesso.' }, { status: 400 });
      }

      const matches = await base44.asServiceRole.entities.AccessCode.filter({ code }, '-created_date', 10);
      const record = matches.find((item) => item.is_active !== false);

      if (!record) {
        return Response.json({ error: 'Código inválido ou desativado.' }, { status: 401 });
      }

      await base44.asServiceRole.entities.AccessCode.update(record.id, { last_login: nowBRT(), is_active: true });

      // A função (profile_category) salva pelo admin concede os privilégios do papel.
      const profileCategory = record.profile_category || 'student';
      // Professor acompanha a plataforma pela navegação do aluno (sem gestão de
      // alunos/códigos de acesso), por isso não recebe o painel administrativo.
      const privileged = ['admin', 'management'].includes(profileCategory);

      return Response.json({
        success: true,
        session: {
          role: privileged ? 'admin' : 'student',
          profileCategory,
          codeId: record.id,
          code,
          name: record.profile_name || record.student_name || 'Aluno',
          email: record.student_email || '',
          bio: record.profile_bio || '',
          avatarColor: record.profile_avatar_color || '#5b5ef4',
          photoUrl: record.profile_photo_url || '',
          course: record.course || 'tcc',
        },
      });
    }

    if (mode === 'admin') {
      const email = normalizeEmail(payload?.email);
      const passwordHash = hashPassword(payload?.password);
      const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
      const credential = credentials.find((item) => normalizeEmail(item.email) === email && item.password_hash === passwordHash);

      if (!credential) {
        return Response.json({ error: 'Email ou senha incorretos.' }, { status: 401 });
      }

      return Response.json({
        success: true,
        session: {
          role: 'admin',
          profileCategory: 'admin',
          name: 'Professor',
          email: credential.email,
          course: null,
        },
      });
    }

    return Response.json({ error: 'Tipo de login inválido.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});