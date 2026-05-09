import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send, ChevronDown, ChevronUp, Trash2, Star, BookOpen } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

const LESSON_TOPICS = [
  'Geral', 'Introdução à Terapia', 'Escuta Ativa', 'Técnicas Terapêuticas',
  'Ética Profissional', 'Terapia Familiar',
  'Psicologia Positiva', 'Sexualidade', 'Traumas e Cura', 'Outro'
];

export default function Forum() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [topic, setTopic] = useState('Geral');
  const [filterTopic, setFilterTopic] = useState('Todos');
  const [expandedPost, setExpandedPost] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const userCourse = isTeacher ? null : (session?.course || 'tcc');

  const { data: posts = [] } = useQuery({
    queryKey: ['forum-posts', userCourse],
    queryFn: () => isTeacher
      ? base44.entities.ForumPost.list('-created_date', 100)
      : base44.entities.ForumPost.filter({ course: userCourse }, '-created_date', 100),
  });

  const { data: replies = [] } = useQuery({
    queryKey: ['forum-replies', expandedPost],
    queryFn: () => base44.entities.ForumReply.filter({ post_id: expandedPost }, 'created_date', 100),
    enabled: !!expandedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.ForumPost.create({
      content: data.content,
      topic: data.topic,
      author_name: session?.name || 'Anônimo',
      author_email: session?.email || '',
      author_role: isTeacher ? 'teacher' : 'student',
      course: isTeacher ? 'tcc' : (session?.course || 'tcc'),
      reply_count: 0,
    }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['forum-posts'] });
      const previous = queryClient.getQueryData(['forum-posts']);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        content: data.content,
        topic: data.topic,
        author_name: session?.name || 'Anônimo',
        author_email: session?.email || '',
        author_role: isTeacher ? 'teacher' : 'student',
        reply_count: 0,
        created_date: new Date().toISOString(),
      };
      queryClient.setQueryData(['forum-posts'], old => [optimistic, ...(old || [])]);
      setNewPost('');
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) queryClient.setQueryData(['forum-posts'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['forum-posts'] }),
  });

  const createReplyMutation = useMutation({
    mutationFn: ({ postId, content }) => {
      const post = posts.find(p => p.id === postId);
      base44.entities.ForumPost.update(postId, { reply_count: (post?.reply_count || 0) + 1 });
      return base44.entities.ForumReply.create({
        post_id: postId,
        content,
        author_name: session?.name || 'Anônimo',
        author_email: session?.email || '',
        author_role: isTeacher ? 'teacher' : 'student',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies', expandedPost] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      setReplyText('');
      toast.success('Resposta enviada! +1 ponto de participação');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.ForumPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts'] }),
  });

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const getUserAvatar = (authorEmail, authorRole) => {
    const code = accessCodes.find(c => c.student_email === authorEmail);
    return {
      photoUrl: code?.profile_photo_url || '',
      avatarColor: code?.profile_avatar_color || (authorRole === 'teacher' ? '#5b5ef4' : '#7c3aed'),
    };
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    createPostMutation.mutate({ content: newPost, topic });
  };

  const filteredPosts = filterTopic === 'Todos' ? posts : posts.filter(p => p.topic === filterTopic);

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Fórum de Dúvidas</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Faça perguntas e compartilhe conhecimento (+1 ponto por resposta)</p>
      </div>

      {/* New Post */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-5">
        <div className="flex items-start gap-3">
          {(() => {
            const av = getUserAvatar(session?.email, session?.role);
            return av.photoUrl ? (
              <img src={av.photoUrl} alt={session?.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ backgroundColor: av.avatarColor }}>
                {initials(session?.name)}
              </div>
            );
          })()}
          <div className="flex-1">
            <form onSubmit={handlePostSubmit} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Tema da dúvida</label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea
                placeholder="Faça uma pergunta para a turma ou professor..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!newPost.trim()} className="gap-2 h-9 text-sm">
                  <Send size={14} /> Publicar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Topic filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Todos', ...LESSON_TOPICS.slice(0, 6)].map(t => (
          <button
            key={t}
            onClick={() => setFilterTopic(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterTopic === t
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma publicação ainda</p>
          <p className="text-sm mt-1">Seja o primeiro a fazer uma pergunta!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => {
            const av = getUserAvatar(post.author_email, post.author_role);
            return (
              <div key={post.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {av.photoUrl ? (
                      <img src={av.photoUrl} alt={post.author_name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: av.avatarColor }}>
                        {initials(post.author_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                       <ClickableStudent email={post.author_email} className="font-bold text-sm text-foreground">{post.author_name}</ClickableStudent>
                        {post.author_role === 'teacher' && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-1.5">Professor</Badge>
                        )}
                        {post.topic && (
                          <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <BookOpen size={9} /> {post.topic}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(post.created_date), 'dd/MM HH:mm')}</span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{post.content}</p>
                    </div>
                    {(isTeacher || post.author_email === session?.email) && (
                      <button
                        onClick={() => deletePostMutation.mutate(post.id)}
                        className="text-muted-foreground hover:text-destructive min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-border px-4 sm:px-5 py-2.5 flex items-center gap-4 bg-secondary/20">
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare size={13} />
                    {post.reply_count || 0} {post.reply_count === 1 ? 'Resposta' : 'Respostas'}
                    {expandedPost === post.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {(post.reply_count || 0) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-yellow-500 font-semibold">
                      <Star size={10} className="fill-yellow-400" /> {post.reply_count} pts distribuídos
                    </span>
                  )}
                </div>

                {expandedPost === post.id && (
                  <div className="border-t border-border bg-secondary/10 p-4 space-y-3">
                    {replies.map(reply => {
                      const rav = getUserAvatar(reply.author_email, reply.author_role);
                      return (
                        <div key={reply.id} className="flex gap-3 pl-2">
                          {rav.photoUrl ? (
                            <img src={rav.photoUrl} alt={reply.author_name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: rav.avatarColor }}>
                              {initials(reply.author_name)}
                            </div>
                          )}
                          <div className="flex-1 bg-card rounded-xl p-3 border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <ClickableStudent email={reply.author_email} className="font-bold text-xs text-foreground">{reply.author_name}</ClickableStudent>
                              {reply.author_role === 'teacher' && <Badge className="bg-primary/10 text-primary text-[9px] py-0 px-1">Prof.</Badge>}
                              <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(reply.created_date), 'dd/MM HH:mm')}</span>
                            </div>
                            <p className="text-sm text-foreground/80">{reply.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <form
                      onSubmit={e => { e.preventDefault(); if (replyText.trim()) createReplyMutation.mutate({ postId: post.id, content: replyText }); }}
                      className="flex gap-2 pt-1"
                    >
                      <Input
                        placeholder="Responder a esta pergunta..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        className="flex-1 h-9 text-sm"
                      />
                      <Button type="submit" size="sm" className="h-9 w-9 p-0 shrink-0">
                        <Send size={13} />
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}