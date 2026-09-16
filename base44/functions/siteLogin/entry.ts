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

      const profileCategory = record.profile_category || 'student';

      // ── Novo modelo de permissões ──────────────────────────────────────
      // Admin/management NÃO recebem mais role 'admin' via código de acesso.
      // Apenas o fluxo admin_google (Google OAuth) concede role 'admin'.
      // Teacher e support recebem role 'teacher' com permissões restritas:
      //   • Podem navegar, ler, criar e atualizar conteúdo (aulas, avisos, tarefas)
      //   • NÃO podem excluir, remover ou alterar dados de forma definitiva
      //   • NÃO têm acesso à Luna (Gerente de Operações)
      // Admin/management que tentarem entrar via código recebem role 'teacher'.
      const role = ['student'].includes(profileCategory) ? 'student' : 'teacher';

      return Response.json({
        success: true,
        session: {
          role,
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

    // ── Login admin via Google OAuth (Base44 native auth) ───────────────
    // Usa base44.auth.me() que valida o token de autenticação nativa do
    // Base44 (Google OAuth) presente na requisição. O email autorizado é
    // validado contra a entidade AdminCredential — nunca exposto no frontend.
    if (mode === 'admin_google') {
      const user = await base44.auth.me().catch(() => null);
      if (!user || !user.email) {
        return Response.json({ error: 'Autenticação Google necessária.' }, { status: 401 });
      }

      const email = normalizeEmail(user.email);
      const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 100);
      const credential = credentials.find((item) => normalizeEmail(item.email) === email);

      if (!credential) {
        return Response.json({ error: 'Conta não autorizada como administradora.' }, { status: 403 });
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

    // ── Modo legado: login admin com email+senha ────────────────────────
    // Mantido como fallback de emergência, mas NÃO exposto no frontend.
    // Removível quando a migração para Google OAuth estiver consolidada.
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
