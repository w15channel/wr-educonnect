import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Smile, Lock, Heart, Search, Minus, Square, X, Bell, Pencil, Trash2, Check, PartyPopper, Hand, Share2 } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { getAvatarPrefixedName, resolveAvatarEmoji } from '@/lib/avatarUtils';
import { adminApi } from '@/lib/adminApi';
import { isLegacyMsnAction, isSinceOvercomingWallCutoff } from '@/lib/overcomingWall';

const WALL_EMOJIS = ['🙂', '😉', '😄', '😛', '😮', '😢', '😎', '❤️', '💔', '👍', '👎', '☕', '🍕', '😴', '🌹', '🥀', '💋', '👏', '💪', '✨', '🎉', '🌟', '🎓', '🚀'];

const MSN_LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/10fc0b060_pngegg.png';
const ATTENTION_PREFIX = '[MSN_ATTENTION]';

const MSN_COLORS = ['#4f6edc', '#0a7ad1', '#9a59c5', '#de4f8b', '#f2a327', '#17a589'];

function formatBRT(dateStr) {
  if (!dateStr) return '';
  const d = new Date(new Date(dateStr).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(11, 16);
}

function MessageItem({ msg, isMe, isAdmin, name, color, email, time, onEdit, onDelete, onShare, sharing, shared, reactions }) {
  const cleanContent = (msg.content || '').replace(ATTENTION_PREFIX, '').replace('[MSN_ACTION]', '').trim();

  return (
    <div className="group rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-[#3f2932] shadow-sm dark:border-white dark:bg-white dark:text-black" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-lg" aria-hidden="true">🌟</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ClickableStudent email={email} className="font-bold text-[12px] dark:!text-black" style={{ color: isMe ? '#be123c' : color }}>{name}</ClickableStudent>
            <span className="text-[10px] text-[#8b7180]">{time}</span>
            <div className="ml-auto flex items-center gap-1">
              {isAdmin && <button type="button" onClick={() => onShare(msg)} disabled={sharing || shared} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-default disabled:opacity-60" title="Encaminhar para o Mural de Superação da dashboard" aria-label="Compartilhar publicação no mural"><Share2 size={12}/>{shared ? 'No mural' : sharing ? 'Enviando...' : 'Compartilhar'}</button>}
              {isMe && <button type="button" onClick={() => onEdit(msg)} className="rounded p-1 text-[#9f667a] hover:bg-rose-50 hover:text-rose-700" title="Editar minha mensagem" aria-label="Editar minha mensagem"><Pencil size={13}/></button>}
              {isAdmin && <button type="button" onClick={() => onDelete(msg)} className="rounded p-1 text-[#9f667a] hover:bg-red-50 hover:text-red-700" title="Excluir permanentemente" aria-label="Excluir permanentemente"><Trash2 size={13}/></button>}
            </div>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-inherit">{cleanContent}</p>
          {reactions}
          {msg.updated_date && msg.updated_date !== msg.created_date && <span className="text-[9px] italic text-[#a38a94]">editada</span>}
        </div>
      </div>
    </div>
  );
}

export default function ClassChat() {
  const { user: session, isAdmin } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral');
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [sharingMessageId, setSharingMessageId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const bottomRef = useRef(null);
  const lastAttentionRef = useRef(null);

  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';
  const CHAT_SESSION = `class_chat_${userCourse}`;

  const { data: messages = [] } = useQuery({
    queryKey: ['class-chat', userCourse],
    queryFn: async () => {
      const res = await base44.functions.invoke('saveStudentRecord', {
        action: 'listChatMessages',
        session_id: CHAT_SESSION,
      });
      return res.data?.records || [];
    },
    refetchInterval: 3000,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000),
    refetchInterval: 15000,
  });

  const { data: recentAchievements = [] } = useQuery({
    queryKey: ['class-chat-achievements', userCourse],
    queryFn: async () => {
      const [progresses, submissions, examSubmissions, challenges, forumPosts, pairings, lessons, tasks, exams] = await Promise.all([
        base44.entities.LessonProgress.list('-created_date', 10000),
        base44.entities.TaskSubmission.list('-created_date', 10000),
        base44.entities.ExamSubmission.list('-submitted_at', 10000),
        base44.entities.DailyChallengeResponse.list('-created_date', 10000),
        base44.entities.ForumPost.list('-created_date', 10000),
        base44.entities.TherapistPairing.list('-updated_date', 10000),
        base44.entities.RecordedLesson.list('-created_date', 500),
        base44.entities.Task.list('-created_date', 500),
        base44.entities.Exam.list('-created_date', 500),
      ]);
      const lessonById = Object.fromEntries(lessons.map((item) => [item.id, item]));
      const taskById = Object.fromEntries(tasks.map((item) => [item.id, item]));
      const examById = Object.fromEntries(exams.map((item) => [item.id, item]));
      const makeAchievement = (record, kind, content, occurredAt) => ({ id: `achievement-${kind}-${record.id}`, student_email: record.student_email, content, occurredAt });
      return [
        ...progresses.filter((record) => record.watched && lessonById[record.lesson_id]).map((record) => makeAchievement(record, 'lesson', `concluiu a aula “${lessonById[record.lesson_id].title}”.`, record.updated_date || record.created_date)),
        ...submissions.filter((record) => taskById[record.task_id]).map((record) => makeAchievement(record, 'task', `respondeu a tarefa “${taskById[record.task_id].title}”.`, record.submitted_at || record.created_date)),
        ...examSubmissions.filter((record) => examById[record.exam_id]).map((record) => makeAchievement(record, 'exam', `concluiu “${examById[record.exam_id].title}”.`, record.submitted_at || record.created_date)),
        ...challenges.map((record) => makeAchievement(record, 'challenge', 'venceu mais uma etapa da ofensiva diária.', record.updated_date || record.created_date || record.date)),
        ...forumPosts.filter((record) => record.author_role !== 'teacher').map((record) => makeAchievement({ ...record, student_email: record.author_email }, record.space === 'debates' ? 'debate' : 'forum', record.space === 'debates' ? 'participou da sala de debates.' : 'compartilhou conhecimento no fórum.', record.created_date)),
        ...pairings.flatMap((record) => [
          record.therapist_submitted && makeAchievement({ ...record, id: `${record.id}-therapist`, student_email: record.therapist_email }, 'report', 'concluiu seu relato como terapeuta da semana.', record.updated_date || record.created_date),
          record.patient_submitted && makeAchievement({ ...record, id: `${record.id}-patient`, student_email: record.patient_email }, 'report', 'concluiu seu relato como paciente da semana.', record.updated_date || record.created_date),
        ].filter(Boolean)),
      ].filter((achievement) => isSinceOvercomingWallCutoff(achievement.occurredAt));
    },
    staleTime: 30000,
  });

  const { data: savedAchievements = [] } = useQuery({
    queryKey: ['class-chat-saved-achievements', userCourse],
    queryFn: () => base44.entities.Achievement.filter({ course: userCourse }, '-occurred_at', 500),
    refetchInterval: 5000,
  });

  const { data: wallReactions = [] } = useQuery({
    queryKey: ['overcoming-wall-reactions', userCourse],
    queryFn: () => base44.entities.AchievementReaction.list('-created_date', 2000),
    refetchInterval: 5000,
  });

  const { data: sharedPublications = [] } = useQuery({
    queryKey: ['wall-publications', userCourse],
    queryFn: () => base44.entities.WallPublication.filter({ course: userCourse }, '-published_at', 500),
    refetchInterval: 5000,
  });

  const reactMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('manageOvercomingWall', { action: 'react', actor_email: session?.email, access_code: session?.code, ...payload }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['overcoming-wall-reactions'] });
      toast.success(response?.data?.duplicate ? 'Você já registrou esta reação.' : 'Sua reação foi enviada!');
    },
    onError: (error) => toast.error(error?.message || 'Não foi possível enviar sua reação.'),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeTab]);

  const courseLabel = userCourse === 'tcc' ? 'TC' : userCourse.toUpperCase();

  const playAttention = () => {
    document.body.classList.add('msn-attention-shake');
    setTimeout(() => document.body.classList.remove('msn-attention-shake'), 1200);
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audio = new AudioContext();
    [0, 0.42, 0.9].forEach((offset) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(740, audio.currentTime + offset);
      oscillator.frequency.exponentialRampToValueAtTime(980, audio.currentTime + offset + 0.08);
      gain.gain.setValueAtTime(0.001, audio.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + offset + 0.36);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(audio.currentTime + offset);
      oscillator.stop(audio.currentTime + offset + 0.38);
    });
  };

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.id === lastAttentionRef.current) return;
    if (last.is_hand_raised && last.author_email !== session?.email && last.content?.startsWith(ATTENTION_PREFIX)) {
      lastAttentionRef.current = last.id;
      playAttention();
      if (Notification.permission === 'granted') {
        new Notification('EDU Live Messenger', { body: last.content.replace(ATTENTION_PREFIX, '').trim(), icon: MSN_LOGO_URL });
      }
    }
  }, [messages, session?.email]);

  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === CHAT_SESSION) queryClient.invalidateQueries({ queryKey: ['class-chat', userCourse] });
    });
    return unsub;
  }, [queryClient, CHAT_SESSION, userCourse]);

  useEffect(() => {
    const myCode = codes.find(c => c.student_email === session?.email);
    if (!myCode?.id) return;
    const markOnline = () => base44.entities.AccessCode.update(myCode.id, { is_online: true, last_seen_at: new Date().toISOString() });
    markOnline();
    const timer = setInterval(markOnline, 30000);
    const markAway = () => base44.entities.AccessCode.update(myCode.id, { is_online: false, last_seen_at: new Date().toISOString() });
    window.addEventListener('beforeunload', markAway);
    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeunload', markAway);
      markAway();
    };
  }, [codes, session?.email]);

  const sendMessage = async (content, isSticker = false) => {
    if (!content.trim()) return;
    setText('');
    setShowPicker(false);
    await base44.functions.invoke('saveStudentRecord', {
      action: 'create', entity: 'ChatMessage', data: {
        session_id: CHAT_SESSION,
        author_name: session?.name || 'Aluno',
        author_email: session?.email || session?.code || '',
        content,
        is_hand_raised: isSticker,
      },
    });
    queryClient.invalidateQueries({ queryKey: ['class-chat'] });
  };

  const startEditing = (message) => {
    if (message.author_email !== session?.email) return;
    setEditingMessage(message);
    setEditText((message.content || '').replace(ATTENTION_PREFIX, '').replace('[MSN_ACTION]', '').trim());
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const content = editText.trim();
    if (!editingMessage?.id || !content || editingMessage.author_email !== session?.email) return;
    await base44.entities.ChatMessage.update(editingMessage.id, { content });
    setEditingMessage(null);
    setEditText('');
    await queryClient.invalidateQueries({ queryKey: ['class-chat', userCourse] });
  };

  const deleteMessage = async (message) => {
    if (!isAdmin || !message?.id || !window.confirm('Excluir esta mensagem permanentemente? Esta ação não pode ser desfeita.')) return;
    await adminApi.delete('ChatMessage', message.id);
    await queryClient.invalidateQueries({ queryKey: ['class-chat', userCourse] });
  };

  const shareToWall = async (item, sourceType = 'chat') => {
    if (!isAdmin || !item?.id || sharingMessageId) return;
    if (sharedPublications.some((post) => post.source_type === sourceType && post.source_id === item.id)) {
      toast.info(sourceType === 'achievement' ? 'Esta conquista já está no mural.' : 'Esta publicação já está no mural.');
      return;
    }
    setSharingMessageId(item.id);
    try {
      const profile = sourceType === 'achievement' ? getProfile(item.student_email) : null;
      await adminApi.create('WallPublication', {
        course: userCourse,
        source_type: sourceType,
        source_id: item.id,
        title: sourceType === 'achievement' ? 'Conquista da turma' : 'Destaque da comunidade',
        content: sourceType === 'achievement' ? item.content : (item.content || '').replace(ATTENTION_PREFIX, '').replace('[MSN_ACTION]', '').trim(),
        author_name: sourceType === 'achievement' ? (profile?.name || 'Aluno da turma') : (item.author_name || 'Comunidade EDU'),
        published_by: session?.email,
        published_at: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ['wall-publications', userCourse] });
      toast.success(`${sourceType === 'achievement' ? 'Conquista' : 'Publicação'} encaminhada ao mural da dashboard dos alunos!`);
    } catch (error) {
      toast.error(error?.message || 'Não foi possível compartilhar a publicação.');
    } finally {
      setSharingMessageId(null);
    }
  };

  const getProfile = (email) => {
    const code = codes.find(c => c.student_email === email);
    const idx = Math.abs(email?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % MSN_COLORS.length;
    return { color: code?.profile_avatar_color || MSN_COLORS[idx], emoji: resolveAvatarEmoji(code?.profile_avatar_emoji), name: code?.profile_name || null };
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'nunca visto';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isStudentOnline = (student) => student.is_online && student.last_seen_at && Date.now() - new Date(student.last_seen_at).getTime() < 90000;

  const otherStudents = codes.filter(c => c.student_email && c.student_email !== session?.email && c.is_active !== false)
    .filter(c => codePrefix ? (c.code || '').startsWith(codePrefix) : true)
    .filter(c => courseEmails ? courseEmails.has(c.student_email) : !userCourse || c.course === userCourse)
    .filter(c => (c.profile_name || c.student_name || c.student_email || '').toLowerCase().includes(dmSearch.toLowerCase()));
  const onlineStudents = otherStudents.filter(isStudentOnline);
  const awayStudents = otherStudents.filter(c => !isStudentOnline(c));
  const courseStudentEmails = new Set(codes.filter((code) => !userCourse || code.course === userCourse || (userCourse === 'tcc' && !code.course)).map((code) => code.student_email));
  const persistedAchievements = savedAchievements.map((achievement) => ({ ...achievement, content: achievement.message, occurredAt: achievement.occurred_at || achievement.created_date }));
  const wallFeed = [
    ...messages.filter((message) => !isLegacyMsnAction(message)).map((message) => ({ ...message, feedType: 'message', occurredAt: message.created_date || message.updated_date })),
    ...recentAchievements.filter((achievement) => courseStudentEmails.has(achievement.student_email)).map((achievement) => ({ ...achievement, feedType: 'achievement' })),
    ...persistedAchievements.filter((achievement) => courseStudentEmails.has(achievement.student_email)).map((achievement) => ({ ...achievement, feedType: 'achievement' })),
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.feedType === item.feedType && candidate.student_email === item.student_email && candidate.content === item.content) === index).sort((a, b) => new Date(a.occurredAt || 0) - new Date(b.occurredAt || 0));

  const reactionButtons = (item, targetType, ownerEmail) => <div className="mt-2 flex flex-wrap gap-1 border-t border-amber-200 pt-2" aria-label="Reações à publicação">
    {[
      ['love', 'Amar', Heart, 'text-rose-700 bg-rose-100'],
      ['celebrate', 'Celebrar', PartyPopper, 'text-amber-800 bg-amber-100'],
      ['applaud', 'Aplaudir', Hand, 'text-sky-800 bg-sky-100'],
    ].map(([key, label, Icon, active]) => {
      const count = wallReactions.filter((reaction) => reaction.target_id === item.id && reaction.reaction === key).length;
      const reacted = wallReactions.some((reaction) => reaction.target_id === item.id && reaction.reaction === key && reaction.actor_email === session?.email);
      return <button key={key} type="button" disabled={ownerEmail === session?.email || reactMutation.isPending} onClick={() => reactMutation.mutate({ target_id: item.id, target_type: targetType, target_owner_email: ownerEmail, reaction: key })} aria-pressed={reacted} title={ownerEmail === session?.email ? 'Você não pode reagir à própria publicação' : label} className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${reacted ? active : 'bg-white text-slate-600 hover:bg-slate-100'}`}><Icon size={12}/>{label}{count > 0 && <span>{count}</span>}</button>;
    })}
  </div>;

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return alert('Este aparelho não suporta notificações do navegador.');
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotificationsEnabled(enabled);
    const myCode = codes.find(c => c.student_email === session?.email);
    if (myCode?.id) await base44.entities.AccessCode.update(myCode.id, { site_notifications_enabled: enabled });
    if (enabled) new Notification('EDU Live Messenger', { body: 'Notificações ativadas neste aparelho.', icon: MSN_LOGO_URL });
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto h-full min-h-0 p-2 sm:p-3 bg-[#b9cdf3] overflow-hidden">
      <div className="h-full rounded-md border border-[#3a5db6] shadow-[0_2px_0_#fff,inset_0_1px_0_rgba(255,255,255,.7)] bg-[#dfe9fb] overflow-hidden">
        <div className="h-8 px-3 bg-gradient-to-r from-[#2f58b6] via-[#4e7de0] to-[#2f58b6] text-white flex items-center">
          <img src={MSN_LOGO_URL} alt="MSN" className="w-5 h-5 object-contain mr-2" />
          <span className="font-bold text-xs tracking-wide">Mural de Superação • {courseLabel}</span>
          <div className="ml-auto flex items-center gap-2"><Minus size={13}/><Square size={11}/><X size={13}/></div>
        </div>

        <div className="h-9 px-3 bg-[#eaf1ff] border-b border-[#abc0ea] flex items-center justify-between text-[11px]">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('geral')} className={`px-3 py-1 rounded ${activeTab==='geral'?'bg-white border border-[#abc0ea] text-[#be123c] font-bold':'text-[#4f5f87]'}`}><Heart size={12} className="inline mr-1 fill-rose-100"/>Mural de Superação</button>
            <button onClick={() => setActiveTab('particular')} className={`px-3 py-1 rounded ${activeTab==='particular'?'bg-white border border-[#abc0ea] text-[#25449c] font-bold':'text-[#4f5f87]'}`}><Lock size={11} className="inline mr-1"/>Particular</button>
          </div>
          <button onClick={enableNotifications} className={`flex items-center gap-1 px-2 py-1 rounded border ${notificationsEnabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-[#abc0ea] text-[#5471b9]'}`} title="Ativar notificações neste aparelho">
            <Bell size={11} /> {notificationsEnabled ? 'Notificações ativas' : 'Ativar notificações'}
          </button>
        </div>

        <div className="h-[calc(100%-68px)] flex flex-col lg:flex-row overflow-hidden">
          {activeTab === 'geral' && <>
            <div className="w-full lg:w-[68%] h-[65%] lg:h-full border-b lg:border-b-0 lg:border-r border-[#abc0ea] flex flex-col bg-white min-h-0">
              <div className="px-3 py-2 text-[11px] bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100 text-[#815568]"><strong>Inspire a turma.</strong> Compartilhe uma conquista, uma palavra de força ou um passo importante da sua jornada.</div>
              <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gradient-to-b from-[#fffafb] to-white">
                {wallFeed.length === 0 ? <p className="text-sm text-center text-[#9a7180] py-8">Seja a primeira pessoa a compartilhar uma mensagem de superação. 🌟</p> : wallFeed.map((msg) => {
                  if (msg.feedType === 'achievement') {
                    const profile = getProfile(msg.student_email);
                    const shared = sharedPublications.some((post) => post.source_type === 'achievement' && post.source_id === msg.id);
                    return <div key={msg.id} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-white dark:bg-white dark:text-black"><div className="flex items-start gap-2"><p className="min-w-0 flex-1"><span aria-hidden="true">🏆 </span><strong className="text-black">{profile.name || 'Um colega da turma'}</strong> {msg.content} <span aria-hidden="true">🎉</span></p>{isAdmin && <button type="button" onClick={() => shareToWall(msg, 'achievement')} disabled={sharingMessageId === msg.id || shared} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-300 bg-white px-2 py-1 text-[10px] font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-default disabled:opacity-60" title="Compartilhar conquista na dashboard dos alunos"><Share2 size={12}/>{shared ? 'No mural' : sharingMessageId === msg.id ? 'Enviando...' : 'Compartilhar'}</button>}</div>{reactionButtons(msg, 'achievement', msg.student_email)}</div>;
                  }
                  const isMe = msg.author_email === session?.email;
                  const profile = getProfile(msg.author_email);
                  return <MessageItem key={msg.id} msg={msg} isMe={isMe} isAdmin={isAdmin} name={getAvatarPrefixedName(profile.name || msg.author_name, profile.emoji)} email={msg.author_email} color={profile.color} time={formatBRT(msg.created_date)} onEdit={startEditing} onDelete={deleteMessage} onShare={shareToWall} sharing={sharingMessageId === msg.id} shared={sharedPublications.some((post) => post.source_type === 'chat' && post.source_id === msg.id)} reactions={reactionButtons(msg, 'publication', msg.author_email)} />;
                })}
                <div ref={bottomRef} />
              </div>

              {showPicker && <div className="border-t border-[#dae5fa] bg-[#f8fbff]">
                <div className="px-3 py-1.5 text-[11px] font-bold text-[#25449c] border-b border-[#dae5fa]">Emojis</div>
                <div className="p-2 grid grid-cols-8 gap-1">{WALL_EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => setText((current) => `${current}${emoji}`)} className="h-9 border border-[#d5e2fa] rounded hover:bg-[#ecf3ff] text-lg" aria-label={`Inserir ${emoji}`}>{emoji}</button>)}</div>
              </div>}

              {editingMessage && <form onSubmit={saveEdit} className="border-t border-amber-200 bg-amber-50 p-2 flex items-center gap-2">
                <Pencil size={14} className="text-amber-700 shrink-0"/><input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 h-9 px-3 text-sm border border-amber-300 rounded bg-white focus:outline-none" aria-label="Editar mensagem"/><button type="button" onClick={() => setEditingMessage(null)} className="text-xs text-slate-600 px-2">Cancelar</button><button type="submit" disabled={!editText.trim()} className="h-9 px-3 rounded bg-amber-600 text-white text-xs font-semibold disabled:opacity-50"><Check size={14} className="inline mr-1"/>Salvar</button>
              </form>}
              <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) sendMessage(text); }} className="border-t border-rose-100 bg-rose-50/70 p-2 flex items-center gap-2">
                <button type="button" onClick={() => setShowPicker(v => !v)} className="p-2 border border-[#abc0ea] bg-white rounded hover:bg-[#f2f7ff]"><Smile size={16} className="text-[#3f62ba]"/></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Compartilhe uma mensagem de superação..." className="flex-1 h-9 px-3 text-sm border border-rose-200 rounded bg-white focus:outline-none focus:border-rose-400" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }} />
                <button type="submit" className="h-9 px-4 rounded bg-rose-600 text-white text-sm font-semibold disabled:opacity-50" disabled={!text.trim()}><Send size={14} className="inline mr-1"/>Publicar</button>
              </form>
            </div>

            <div className="w-full lg:w-[32%] h-[35%] lg:h-full bg-[#f2f6ff] p-2 min-h-0">
              <div className="space-y-2 max-h-full overflow-y-auto">
                <div>
                  <div className="text-[11px] font-bold text-[#2f7d32] mb-1 border-b border-green-200 pb-1">🟢 Online ({onlineStudents.length})</div>
                  {onlineStudents.slice(0, 60).map((c) => {
                    const name = getAvatarPrefixedName(c.profile_name || c.student_name || c.student_email, c.profile_avatar_emoji);
                    return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="w-full text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-[#c8d7f5] text-xs text-[#334155] dark:text-black truncate"><span className="text-green-500">●</span> {name}<span className="block pl-3 text-[10px] text-[#6f7ba8]">Online agora</span></button>;
                  })}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#b42318] mb-1 border-b border-red-200 pb-1">🔴 Ausentes ({awayStudents.length})</div>
                  {awayStudents.slice(0, 60).map((c) => {
                    const name = getAvatarPrefixedName(c.profile_name || c.student_name || c.student_email, c.profile_avatar_emoji);
                    return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="w-full text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-[#c8d7f5] text-xs text-[#64748b] dark:text-black truncate"><span className="text-red-500">●</span> {name}<span className="block pl-3 text-[10px] text-[#8a6f6f]">Visto por último: {formatLastSeen(c.last_seen_at)}</span></button>;
                  })}
                </div>
              </div>
            </div>
          </>}

          {activeTab === 'particular' && <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
            <p className="text-sm text-[#4f5f87] mb-3">Selecione um contato para abrir chat privado.</p>
            <div className="relative mb-3"><Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/><input value={dmSearch} onChange={e => setDmSearch(e.target.value)} className="w-full h-9 pl-8 pr-3 border border-[#abc0ea] rounded" placeholder="Buscar contato..."/></div>
            <div className="grid md:grid-cols-2 gap-2">
              {otherStudents.map((c) => {
                const name = getAvatarPrefixedName(c.profile_name || c.student_name || c.student_email, c.profile_avatar_emoji);
                const online = isStudentOnline(c);
                return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="border border-[#c8d7f5] rounded px-3 py-2 text-left hover:bg-[#f6f9ff] text-sm"><span className={online ? 'text-green-500' : 'text-red-500'}>●</span> 🔒 {name}<span className="block text-[10px] text-[#6f7ba8] ml-4">{online ? 'Online agora' : `Visto por último: ${formatLastSeen(c.last_seen_at)}`}</span></button>;
              })}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
