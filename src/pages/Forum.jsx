import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, ChevronDown, ChevronUp, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Forum() {
  const { user: session } = useOutletContext();
  const user = session;
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date', 100),
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['forum-replies', expandedPost],
    queryFn: () => base44.entities.ForumReply.filter({ post_id: expandedPost }, 'created_date', 100),
    enabled: !!expandedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: (content) => base44.entities.ForumPost.create({
      content,
      author_name: user?.name || user?.full_name || 'Anônimo',
      author_email: user?.email || '',
      author_role: isTeacher ? 'teacher' : 'student',
      reply_count: 0,
    }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['forum-posts'] });
      const previous = queryClient.getQueryData(['forum-posts']);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        content,
        author_name: user?.name || user?.full_name || 'Anônimo',
        author_email: user?.email || '',
        author_role: isTeacher ? 'teacher' : 'student',
        reply_count: 0,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(['forum-posts'], old => [optimistic, ...(old || [])]);
      setNewPost('');
      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) queryClient.setQueryData(['forum-posts'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: ({ postId, content }) => {
      const post = posts.find(p => p.id === postId);
      base44.entities.ForumPost.update(postId, { reply_count: (post?.reply_count || 0) + 1 });
      return base44.entities.ForumReply.create({
        post_id: postId,
        content,
        author_name: user?.name || user?.full_name || 'Anônimo',
        author_email: user?.email || '',
        author_role: isTeacher ? 'teacher' : 'student',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', expandedPost] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      setReplyText('');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.ForumPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts'] }),
  });

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

  const handleReplySubmit = (e, postId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    createReplyMutation.mutate({ postId, content: replyText });
  };

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const getUserAvatar = (authorName, authorEmail, role) => {
    const code = accessCodes.find(c => c.student_email === authorEmail || c.profile_name === authorName);
    return {
      photoUrl: code?.profile_photo_url || '',
      avatarColor: code?.profile_avatar_color || (role === 'teacher' ? '#6366f1' : '#8b5cf6'),
    };
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Fórum de Dúvidas</h2>
        <p className="text-muted-foreground text-sm mt-1">Faça perguntas e compartilhe conhecimento</p>
      </div>

      {/* New Post */}
      <form onSubmit={handlePostSubmit} className="bg-card p-5 rounded-2xl border border-border shadow-sm mb-6">
        <div className="flex gap-3 items-start">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ backgroundColor: user?.avatarColor || '#6366f1' }}>
              {initials(user?.name || user?.full_name)}
            </div>
          )}
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <Textarea
              placeholder="Faça uma pergunta para a turma ou professor..."
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              className="flex-1 min-h-[44px] resize-none"
              rows={1}
            />
            <Button type="submit" className="shrink-0 self-end">Publicar</Button>
          </div>
        </div>
      </form>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma publicação ainda</p>
          <p className="text-sm mt-1">Seja o primeiro a fazer uma pergunta!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {(() => {
                    const av = getUserAvatar(post.author_name, post.author_email, post.author_role);
                    return av.photoUrl ? (
                      <img src={av.photoUrl} alt={post.author_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: av.avatarColor }}>
                        {initials(post.author_name)}
                      </div>
                    );
                  })()}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{post.author_name}</p>
                    {post.author_role === 'teacher' && (
                      <Badge className="bg-accent/20 text-accent text-[10px]">Professor</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{format(new Date(post.created_date), 'dd/MM HH:mm')}</span>
                  </div>
                  {(isTeacher || post.author_email === user?.email) && (
                    <button
                      onClick={() => deletePostMutation.mutate(post.id)}
                      aria-label="Excluir post"
                      className="ml-auto text-muted-foreground hover:text-destructive min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-foreground text-sm leading-relaxed">{post.content}</p>
              </div>

              <div className="border-t border-border px-5 py-3 flex items-center gap-4">
                <button
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={15} /> {post.reply_count || 0} Respostas
                  {expandedPost === post.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {expandedPost === post.id && (
                <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
                  {replies.map(reply => (
                    <div key={reply.id} className="flex gap-3 pl-2">
                      {(() => {
                        const av = getUserAvatar(reply.author_name, reply.author_email, reply.author_role);
                        return av.photoUrl ? (
                          <img src={av.photoUrl} alt={reply.author_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: av.avatarColor }}>
                            {initials(reply.author_name)}
                          </div>
                        );
                      })()}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-xs text-foreground">{reply.author_name}</p>
                          {reply.author_role === 'teacher' && <Badge className="bg-accent/20 text-accent text-[9px] py-0">Prof.</Badge>}
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                  <form onSubmit={e => handleReplySubmit(e, post.id)} className="flex gap-2 pt-2">
                    <Input
                      placeholder="Responder..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="flex-1 h-9 text-sm"
                    />
                    <Button type="submit" size="sm" aria-label="Enviar resposta" className="h-11 w-11 p-0 shrink-0">
                      <Send size={14} />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}