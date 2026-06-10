import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sortBySequence } from '@/lib/sequenceUtils';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { MessageSquare, Send, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import PostCard from '@/components/shared/PostCard';
import ParticipationCelebration from '@/components/shared/ParticipationCelebration';

const LESSON_TOPICS = [
  'Geral', 'Introdução à Terapia', 'Escuta Ativa', 'Técnicas Terapêuticas',
  'Ética Profissional', 'Terapia Familiar', 'Psicologia Positiva', 'Sexualidade', 'Traumas e Cura', 'Outro'
];

export default function Forum() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [topic, setTopic] = useState('Geral');
  const [filterTopic, setFilterTopic] = useState('Todos');
  const [expandedPost, setExpandedPost] = useState(null);
  const [replyTexts, setReplyTexts] = useState({}); // postId -> text
  const [editingReply, setEditingReply] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { course: routeCourse } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';

  const { data: posts = [] } = useQuery({
    queryKey: ['forum-posts', userCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: userCourse, space: 'forum' }, '-created_date', 100),
  });

  const { data: allReplies = [] } = useQuery({
    queryKey: ['forum-replies-all', userCourse],
    queryFn: () => base44.entities.ForumReply.filter({ course: userCourse, space: 'forum' }, 'created_date', 500),
  });

  const getRepliesForPost = (postId) => allReplies.filter(r => r.post_id === postId);

  const triggerCelebration = (msg) => {
    setCelebrationMsg(msg);
    setCelebrating(true);
  };

  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('saveStudentRecord', {
        action: 'create', entity: 'ForumPost',
        data: { content: data.content, topic: data.topic, author_name: session?.name || 'Anônimo', author_email: session?.email || session?.code || '', author_role: isTeacher ? 'teacher' : 'student', course: userCourse, space: 'forum', reply_count: 0 },
      });
      return res.data.record;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['forum-posts', userCourse] });
      const previous = queryClient.getQueryData(['forum-posts', userCourse]);
      queryClient.setQueryData(['forum-posts', userCourse], old => [{
        id: `optimistic-${Date.now()}`, content: data.content, topic: data.topic,
        author_name: session?.name || 'Anônimo', author_email: session?.email || '',
        author_role: isTeacher ? 'teacher' : 'student', reply_count: 0, space: 'forum',
        created_date: new Date().toISOString(),
      }, ...(old || [])]);
      setNewPost('');
      return { previous };
    },
    onError: (_err, _data, context) => { if (context?.previous) queryClient.setQueryData(['forum-posts', userCourse], context.previous); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['forum-posts'] }),
    onSuccess: async (post) => {
      triggerCelebration('Pergunta publicada! A turma vai te ajudar! 💬');
      if (post?.id && !post.id.startsWith('optimistic-')) {
        await base44.entities.ScoreItem.create({ student_email: session?.email || '', category: 'forum', ref_id: post.id, ref_title: 'Pergunta no Fórum', score: 0.1, max_score: 0.1, verified: true });
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
        data: { post_id: postId, content, author_name: session?.name || 'Anônimo', author_email: session?.email || session?.code || '', author_role: isTeacher ? 'teacher' : 'student', course: userCourse, space: 'forum' },
      });
      return res.data.record;
    },
    onSuccess: async (reply) => {
      queryClient.invalidateQueries({ queryKey: ['forum-replies-all', userCourse] });
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      setReplyTexts(prev => ({ ...prev, [reply?.post_id]: '' }));
      const parentPost = posts.find(p => p.id === reply?.post_id);
      const isColleague = parentPost?.author_email && parentPost.author_email !== (session?.email || '');
      triggerCelebration(isColleague ? 'Incrível! +0,500 ponto por ajudar um colega! 🌟' : 'Resposta enviada! Parabéns pela participação! 🎉');
      if (isColleague) {
        await base44.entities.ScoreItem.create({ student_email: session?.email || '', category: 'forum', ref_id: reply?.id || `reply-${Date.now()}`, ref_title: 'Resposta em pergunta de colega', score: 0.5, max_score: 0.5, verified: true, notes: 'Resposta em pergunta aberta por colega no fórum: +0,5 ponto.' });
        await base44.functions.invoke('populateScoreCache', { student_email: session?.email || '' });
        queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      }
    },
  });

  const deletePostMutation = useMutation({ mutationFn: (id) => base44.entities.ForumPost.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-posts'] }) });
  const updatePostMutation = useMutation({ mutationFn: ({ id, content }) => base44.entities.ForumPost.update(id, { content }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['forum-posts'] }); setEditingPost(null); } });
  const deleteReplyMutation = useMutation({ mutationFn: (id) => base44.entities.ForumReply.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-replies-all', userCourse] }) });
  const updateReplyMutation = useMutation({ mutationFn: ({ id, content }) => base44.entities.ForumReply.update(id, { content }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['forum-replies-all', userCourse] }); setEditingReply(null); } });

  const getUserAvatar = (authorEmail, authorRole) => {
    const code = accessCodes.find(c => c.student_email === authorEmail);
    return { photoUrl: code?.profile_photo_url || '', avatarColor: code?.profile_avatar_color || (authorRole === 'teacher' ? '#5b5ef4' : '#7c3aed') };
  };

  const myAv = getUserAvatar(session?.email, session?.role);
  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const filteredPosts = filterTopic === 'Todos' ? sortBySequence(posts) : sortBySequence(posts).filter(p => p.topic === filterTopic);

  return (
    <div className="app-page app-page--narrow animate-fade-in-up">
      {celebrating && <ParticipationCelebration message={celebrationMsg} onClose={() => setCelebrating(false)} />}

      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Fórum de Dúvidas</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Faça perguntas e compartilhe conhecimento (+0,500 ponto por resposta em dúvida de colega)</p>
      </div>

      {/* New Post */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-5">
        <div className="flex items-start gap-3">
          {myAv.photoUrl
            ? <img src={myAv.photoUrl} alt={session?.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style={{ backgroundColor: myAv.avatarColor }}>{initials(session?.name)}</div>
          }
          <div className="flex-1">
            <form onSubmit={e => { e.preventDefault(); if (newPost.trim()) createPostMutation.mutate({ content: newPost, topic }); }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Tema da dúvida</label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{LESSON_TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Textarea placeholder="Faça uma pergunta para a turma ou professor..." value={newPost} onChange={e => setNewPost(e.target.value)} className="resize-none text-sm" rows={2} />
              <div className="flex justify-end">
                <Button type="submit" disabled={!newPost.trim()} className="gap-2 h-9 text-sm"><Send size={14} /> Publicar</Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Topic filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['Todos', ...LESSON_TOPICS.slice(0, 6)].map(t => (
          <button key={t} onClick={() => setFilterTopic(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filterTopic === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma publicação ainda</p>
          <p className="text-sm mt-1">Seja o primeiro a fazer uma pergunta!</p>
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
              replyPlaceholder="Responder a esta pergunta..."
            />
          ))}
        </div>
      )}
    </div>
  );
}