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
    const affectedEmails = new Set();

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
      affectedEmails.add(post.author_email);
    }

    // Replies: 0.5 pt each, only when answering a colleague
    for (const reply of replies) {
      if (!reply.author_email || !reply.id) continue;
      if (existingSet.has(reply.id)) continue;
      const parentPost = posts.find(post => post.id === reply.post_id);
      if (!parentPost || parentPost.author_email === reply.author_email) continue;
      await base44.asServiceRole.entities.ScoreItem.create({
        student_email: reply.author_email,
        category: 'forum',
        ref_id: reply.id,
        ref_title: 'Resposta em pergunta de colega',
        score: 0.5,
        max_score: 0.5,
        verified: true,
      });
      created++;
      affectedEmails.add(reply.author_email);
    }

    if (affectedEmails.size > 0) {
      const [scoreItems, accessCodes, profiles, users] = await Promise.all([
        base44.asServiceRole.entities.ScoreItem.list('-created_date', 50000),
        base44.asServiceRole.entities.AccessCode.list('-created_date', 20000),
        base44.asServiceRole.entities.StudentProfile.list('-updated_date', 20000),
        base44.asServiceRole.entities.User.list('-created_date', 20000).catch(() => []),
      ]);
      for (const email of affectedEmails) {
        const total = scoreItems
          .filter((item) => item.verified && item.student_email === email)
          .reduce((sum, item) => Math.round((sum + Math.round((Number(item.score) || 0) * 1000) / 1000) * 1000) / 1000, 0);
        for (const code of accessCodes.filter((item) => item.student_email === email)) {
          await base44.asServiceRole.entities.AccessCode.update(code.id, { pontuacao_total: total });
        }
        for (const profile of profiles.filter((item) => item.student_email === email)) {
          await base44.asServiceRole.entities.StudentProfile.update(profile.id, { pontuacao_total: total, points: total });
        }
        for (const cachedUser of users.filter((item) => item.email === email)) {
          await base44.asServiceRole.entities.User.update(cachedUser.id, { pontuacao_total: total });
        }
      }
    }

    return Response.json({ success: true, created, posts: posts.length, replies: replies.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});