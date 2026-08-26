import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sortBySequence } from '@/lib/sequenceUtils';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PostCard from '@/components/shared/PostCard';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';
import { resolveAvatarEmoji } from '@/lib/avatarUtils';

const DEBATE_TOPICS = [
  'Pensamentos automáticos', 'Distorções cognitivas', 'Reestruturação cognitiva', 'Registro de pensamentos',
  'Crenças centrais', 'Resolução de problemas', 'Ativação comportamental', 'Exposição gradual',
  'Prevenção de recaídas', 'Outro (criado por alunos)'
];

export default function SalaDebates() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [topic, setTopic] = useState('Pensamentos automáticos');
  const [filterTopic, setFilterTopic] = useState('Todos');
  const [expandedPost, setExpandedPost] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [editingReply, setEditingReply] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 10000),
  });

  const { course: routeCourse } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';

  const { data: posts = [] } = useQuery({
    queryKey: ['debate-posts', userCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: userCourse, space: 'debates' }, '-created_date', 100),
  });

  const { data: allReplies = [] } = useQuery({
    queryKey: ['debate-replies-all', userCourse],
    queryFn: () => base44.entities.ForumReply.filter({ course: userCourse, space: 'debates' }, 'created_date', 500),
  });

  const getRepliesForPost = (postId) => allReplies.filter(r => r.post_id === postId);

  const triggerCelebration = (msg) => { setCelebrationMsg(msg); setCelebrating(true); };

  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('saveStudentRecord', {
        action: 'create', entity: 'ForumPost',
        data: { content: data.content, topic: data.topic, author_name: session?.name || 'Anônimo', author_email: session?.email || session?.code || '', author_role: isTeacher ? 'teacher' : 'student', course: userCourse, reply_count: 0, space: 'debates' },
      });
      return res.data.record;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['debate-posts', userCourse] });
      const previous = queryClient.getQueryData(['debate-posts', userCourse]);
      queryClient.setQueryData(['debate-posts', userCourse], old => [{
        id: `optimistic-${Date.now()}`, content: data.content, topic: data.topic,
        author_name: session?.name || 'Anônimo', author_email: session?.email || '',
        author_role: isTeacher ? 'teacher' : 'student', reply_count: 0, space: 'debates',
        created_date: new Date().toISOString(),
      }, ...(old || [])]);
      setNewPost('');
      return { previous };
    },
    onError: (_err, _data, context) => { if (context?.previous) queryClient.setQueryData(['debate-posts', userCourse], context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['debate-posts'] }),
    onSuccess: async (post) => {
      triggerCelebration('Debate aberto! Inspire a turma com suas ideias! 🔥');
      if (post?.id && !post.id.startsWith('optimistic-')) {
        await base44.entities.ScoreItem.create({ student_email: session?.email || '', category: 'forum', ref_id: post.id, ref_title: 'Tópico criado na Sala de Debates', score: 0.01, max_score: 0.01, verified: true });
        await base44.functions.invoke('populateScoreCache', { student_email: session?.email || '' });
        queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      }
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      const post = posts.find(p => p.id === postId);
      await base44.functions.invoke('saveStudentRecord', { action: 'updateForumReplyCount', post_id: postId, reply_count: (post?.reply_count || 0) + 1 });
      const res = await base44.functions.invoke('saveStudentRecord', {
        action: 'create', entity: 'ForumReply',
        data: { post_id: postId, content, author_name: session?.name || 'Anônimo', author_email: session?.email || session?.code || '', author_role: isTeacher ? 'teacher' : 'student', course: userCourse, space: 'debates' },
      });
      return res.data.record;
    },
    onSuccess: async (reply) => {
      queryClient.invalidateQueries({ queryKey: ['debate-replies-all', userCourse] });
      queryClient.invalidateQueries({ queryKey: ['debate-posts'] });
      setReplyTexts(prev => ({ ...prev, [reply?.post_id]: '' }));
      triggerCelebration('Sua opinião entrou no debate! +0,01 ponto! 💪');
      await base44.entities.ScoreItem.create({ student_email: session?.email || '', category: 'forum', ref_id: reply?.id || `reply-${Date.now()}`, ref_title: 'Comentário na Sala de Debates', score: 0.01, max_score: 0.01, verified: true, notes: 'Participação na Sala de Debates (comentário): +0,01 ponto.' });
      await base44.functions.invoke('populateScoreCache', { student_email: session?.email || '' });
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
    },
  });

  const deletePostMutation = useMutation({ mutationFn: (id) => base44.entities.ForumPost.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debate-posts'] }) });
  const updatePostMutation = useMutation({ mutationFn: ({ id, content }) => base44.entities.ForumPost.update(id, { content }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['debate-posts'] }); setEditingPost(null); } });
  const deleteReplyMutation = useMutation({ mutationFn: (id) => base44.entities.ForumReply.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debate-replies-all', userCourse] }) });
  const updateReplyMutation = useMutation({ mutationFn: ({ id, content }) => base44.entities.ForumReply.update(id, { content }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['debate-replies-all', userCourse] }); setEditingReply(null); } });

  const getUserAvatar = (authorEmail, authorRole) => {
    const code = accessCodes.find(c => c.student_email === authorEmail);
    return {
      photoUrl: code?.profile_photo_url || '',
      avatarColor: code?.profile_avatar_color || (authorRole === 'teacher' ? '#5b5ef4' : '#7c3aed'),
      avatarEmoji: resolveAvatarEmoji(code?.profile_avatar_emoji),
    };
  };

  const myAv = getUserAvatar(session?.email, session?.role);
  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const filteredPosts = filterTopic === 'Todos' ? sortBySequence(posts) : sortBySequence(posts).filter(p => p.topic === filterTopic);

  return (
    <div className="app-page max-w-4xl mx-auto animate-fade-in-up">
      {celebrating && <ParticipationCelebration session={session} achievement={{ kind: 'debate', message: 'participou da sala de debates.' }} message={celebrationMsg} onClose={() => setCelebrating(false)} />}

      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Sala de Debates</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Debata temas de TCC e proponha novas ideias. Cada participação vale +0,01 ponto.</p>
      </div>

      {/* New Post */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-5">
        <div className="flex items-start gap-3">
          {myAv.photoUrl
            ? <img src={myAv.photoUrl} alt={session?.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ backgroundColor: myAv.avatarColor }}>{myAv.avatarEmoji || initials(session?.name)}</div>
          }
          <div className="flex-1">
            <form onSubmit={e => { e.preventDefault(); if (newPost.trim()) createPostMutation.mutate({ content: newPost, topic }); }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tema do debate</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEBATE_TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Abra um tópico para debate com a turma..." value={newPost} onChange={e => setNewPost(e.target.value)} className="resize-none text-sm" rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={!newPost.trim()} className="gap-2 h-9 text-sm"><Send size={14} /> Publicar</Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Topic filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Todos', ...DEBATE_TOPICS.slice(0, 6)].map(t => (
          <button key={t} onClick={() => setFilterTopic(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTopic === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum debate ainda</p>
          <p className="text-sm mt-1">Seja o primeiro a abrir um debate!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              replies={getRepliesForPost(post.id)}
              isTeacher={isTeacher}
              myEmail={session?.email}
              myName={session?.name}
              myAvatarColor={myAv.avatarColor}
              myPhotoUrl={myAv.photoUrl}
              getAvatar={getUserAvatar}
              replyText={replyTexts[post.id] || ''}
              setReplyText={(v) => setReplyTexts(prev => ({ ...prev, [post.id]: v }))}
              isExpanded={expandedPost === post.id}
              onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              onSubmitReply={(postId, content) => createReplyMutation.mutate({ postId, content })}
              onDeletePost={deletePostMutation.mutate}
              onEditPost={(p) => setEditingPost(p)}
              onDeleteReply={deleteReplyMutation.mutate}
              onEditReply={(r) => setEditingReply(r)}
              editingPost={editingPost}
              setEditingPost={setEditingPost}
              editingReply={editingReply}
              setEditingReply={setEditingReply}
              onUpdatePost={(id, content) => updatePostMutation.mutate({ id, content })}
              onUpdateReply={(id, content) => updateReplyMutation.mutate({ id, content })}
              replyPlaceholder="Comente neste debate..."
            />
          ))}
        </div>
      )}
    </div>
  );
}
