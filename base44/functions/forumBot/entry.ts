import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { invokePollinations } from '../../shared/pollinations.ts';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const payload = await req.json().catch(() => ({}));
  const isAutomation = payload?.automation?.type === 'scheduled';
  const user = await base44.auth.me().catch(() => null);

  if (!isAutomation && user?.role !== 'admin' && user?.role !== 'teacher') {
    return Response.json({ error: 'Forbidden: only admin/teacher users or scheduled automation can run forumBot' }, { status: 403 });
  }

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  // Get recent posts not yet bot-replied
  const allPosts = await base44.asServiceRole.entities.ForumPost.list('-created_date', 100);

  const eligible = allPosts.filter(p =>
    !p.bot_replied &&
    p.author_role !== 'teacher' &&
    new Date(p.created_date) < thirtyMinAgo
  );

  let processed = 0;

  for (const post of eligible) {
    const courseLabel =
      post.course === 'psicanalise' ? 'Psicanálise Freudiana' :
      post.course === 'sexologia' ? 'Sexologia Integrativa' :
      'Terapia Cognitivo-Comportamental (TCC)';

    const reply = await invokePollinations({
      prompt: `Você é o Professor William Ribeiro, especialista em psicoterapia e formador de terapeutas no curso de ${courseLabel}. Um aluno publicou o seguinte no fórum da turma:\n\n"${post.content}"\n\nResponda de forma acolhedora, técnica e encorajadora, como professor experiente. Seja direto, empático e orientador. Máximo 180 palavras. Responda em português, sem saudações formais excessivas.`
    });

    const replyText = typeof reply === 'string' ? reply : '';
    if (!replyText) continue;

    await base44.asServiceRole.entities.ForumReply.create({
      post_id: post.id,
      content: replyText,
      author_name: 'Prof. William Ribeiro',
      author_email: 'professor@wr-edu.com',
      author_role: 'teacher',
    });

    await base44.asServiceRole.entities.ForumPost.update(post.id, {
      bot_replied: true,
      reply_count: (post.reply_count || 0) + 1,
    });

    processed++;
  }

  return Response.json({ ok: true, processed, eligible: eligible.length });
});
