import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { pickAutoCorrectionResponse } from '../../shared/scoreMessages.ts';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const payload = await req.json().catch(() => ({}));
  const isAutomation = payload?.automation?.type === 'scheduled';
  const user = await base44.auth.me().catch(() => null);

  if (!isAutomation && user?.role !== 'admin' && user?.role !== 'teacher') {
    return Response.json({ error: 'Forbidden: only admin/teacher users or scheduled automation can run forumBot' }, { status: 403 });
  }

  // Busca posts recentes que ainda não receberam resposta automática
  const allPosts = await base44.asServiceRole.entities.ForumPost.list('-created_date', 100);
  const eligible = allPosts.filter((p) => !p.bot_replied && p.author_role !== 'teacher');

  let processed = 0;

  for (const post of eligible) {
    const replyText = pickAutoCorrectionResponse(post.id, 'participation');
    if (!replyText) continue;

    await base44.asServiceRole.entities.ForumReply.create({
      post_id: post.id,
      content: replyText,
      author_name: 'Prof. William Ribeiro · Autocorreção',
      author_email: 'professor@wr-edu.com',
      author_role: 'teacher',
      course: post.course || 'tcc',
      space: post.space || 'debates',
    });

    await base44.asServiceRole.entities.ForumPost.update(post.id, {
      bot_replied: true,
      reply_count: (post.reply_count || 0) + 1,
    });

    processed++;
  }

  return Response.json({ ok: true, processed, eligible: eligible.length });
});