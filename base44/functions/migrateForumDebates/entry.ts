import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEBATE_POST_IDS = [
  '6a0155d81b863811f925d97a',
  '6a01554a8c92f497a2cf67dc',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const updatedPosts = [];
    let updatedReplies = 0;

    for (const postId of DEBATE_POST_IDS) {
      await base44.asServiceRole.entities.ForumPost.update(postId, { space: 'debates' });
      updatedPosts.push(postId);

      const replies = await base44.asServiceRole.entities.ForumReply.filter({ post_id: postId }, '-created_date', 100);
      for (const reply of replies) {
        await base44.asServiceRole.entities.ForumReply.update(reply.id, { space: 'debates' });
        updatedReplies += 1;
      }
    }

    return Response.json({ success: true, updatedPosts, updatedReplies });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});