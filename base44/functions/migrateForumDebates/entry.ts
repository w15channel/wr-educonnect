import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEBATE_POST_IDS = [
  '6a0155d81b863811f925d97a',
  '6a01554a8c92f497a2cf67dc',
];

function fallbackTopic(topic) {
  return topic || 'Geral';
}

function fallbackCourse(course) {
  return course || 'tcc';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const posts = await base44.asServiceRole.entities.ForumPost.list('-created_date', 5000);
    const replies = await base44.asServiceRole.entities.ForumReply.list('-created_date', 10000);

    const postById = new Map(posts.map((post) => [post.id, post]));
    const replyCountByPost = new Map();
    for (const reply of replies) {
      replyCountByPost.set(reply.post_id, (replyCountByPost.get(reply.post_id) || 0) + 1);
    }

    let restoredForumPosts = 0;
    let restoredForumReplies = 0;
    let updatedDebatePosts = 0;
    let updatedDebateReplies = 0;
    let correctedReplyCounts = 0;

    for (const post of posts) {
      const shouldBeDebate = DEBATE_POST_IDS.includes(post.id);
      const desiredSpace = shouldBeDebate ? 'debates' : (post.space || 'forum');
      const updates = {};

      if (post.space !== desiredSpace) updates.space = desiredSpace;
      if (!post.course) updates.course = 'tcc';
      if (!post.topic && desiredSpace === 'forum') updates.topic = fallbackTopic(post.topic);

      const realReplyCount = replyCountByPost.get(post.id) || 0;
      if (Number(post.reply_count || 0) !== realReplyCount) updates.reply_count = realReplyCount;

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ForumPost.update(post.id, updates);
        if (desiredSpace === 'debates') updatedDebatePosts += 1;
        else restoredForumPosts += 1;
        if (updates.reply_count !== undefined) correctedReplyCounts += 1;
      }
    }

    for (const reply of replies) {
      const parentPost = postById.get(reply.post_id);
      const shouldBeDebate = parentPost && DEBATE_POST_IDS.includes(parentPost.id);
      const desiredSpace = shouldBeDebate ? 'debates' : (reply.space || 'forum');
      const updates = {};

      if (reply.space !== desiredSpace) updates.space = desiredSpace;
      if (!reply.course) updates.course = fallbackCourse(parentPost?.course);

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.ForumReply.update(reply.id, updates);
        if (desiredSpace === 'debates') updatedDebateReplies += 1;
        else restoredForumReplies += 1;
      }
    }

    return Response.json({
      success: true,
      restoredForumPosts,
      restoredForumReplies,
      updatedDebatePosts,
      updatedDebateReplies,
      correctedReplyCounts,
      message: 'Histórico do Fórum de Dúvidas restaurado e separado da Sala de Debates.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});