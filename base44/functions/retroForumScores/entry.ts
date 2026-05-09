import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [posts, replies, existingScores] = await Promise.all([
      base44.asServiceRole.entities.ForumPost.list('-created_date', 2000),
      base44.asServiceRole.entities.ForumReply.list('-created_date', 2000),
      base44.asServiceRole.entities.ScoreItem.filter({ category: 'forum' }, '-created_date', 5000),
    ]);

    const existingSet = new Set(existingScores.map(s => s.ref_id));
    let created = 0;

    // Posts: 0.1 pts each
    for (const post of posts) {
      if (!post.author_email || !post.id) continue;
      if (existingSet.has(post.id)) continue;
      await base44.asServiceRole.entities.ScoreItem.create({
        student_email: post.author_email,
        category: 'forum',
        ref_id: post.id,
        ref_title: 'Pergunta no Fórum',
        score: 0.1,
        max_score: 0.1,
        verified: true,
      });
      created++;
    }

    // Replies: 1 pt each
    for (const reply of replies) {
      if (!reply.author_email || !reply.id) continue;
      if (existingSet.has(reply.id)) continue;
      await base44.asServiceRole.entities.ScoreItem.create({
        student_email: reply.author_email,
        category: 'forum',
        ref_id: reply.id,
        ref_title: 'Resposta no Fórum',
        score: 1,
        max_score: 1,
        verified: true,
      });
      created++;
    }

    return Response.json({ success: true, created, posts: posts.length, replies: replies.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});