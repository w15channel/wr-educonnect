import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Pin, CheckCheck } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { useQueryClient } from '@tanstack/react-query';
import useProfessorAutoReactions from '@/hooks/useProfessorAutoReactions';
import { toast } from 'sonner';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { getAvatarPrefixedName, resolveAvatarEmoji } from '@/lib/avatarUtils';
import { adminApi } from '@/lib/adminApi';
import useOvercomingWall from '@/hooks/useOvercomingWall';
import { highlightKey, MONITOR_MEDALS, splitWeeklyHighlights } from '@/lib/chatHighlights';
import LunaChat from '@/components/luna/LunaChat';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessageItem from '@/components/chat/ChatMessageItem';
import ChatFeedNotice from '@/components/chat/ChatFeedNotice';
import ChatReactions from '@/components/chat/ChatReactions';
import ChatContacts from '@/components/chat/ChatContacts';
import ChatComposer from '@/components/chat/ChatComposer';

const WALL_EMOJIS = ['🙂', '😉', '😄', '😛', '😮', '😢', '😎', '❤️', '💔', '👍', '👎', '☕', '🍕', '😴', '🌹', '🥀', '💋', '👏', '💪', '✨', '🎉', '🌟', '🎓', '🚀'];

const MSN_LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/10fc0b060_pngegg.png';
const ATTENTION_PREFIX = '[MSN_ATTENTION]';

const MSN_COLORS = ['#4f6edc', '#0a7ad1', '#9a59c5', '#de4f8b', '#f2a327', '#17a589'];

function formatBRT(dateStr) {
  if (!dateStr) return '';
  const d = new Date(new Date(dateStr).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(11, 16);
}

export default function ClassChat() {
  const { user: session, isAdmin } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = requestedTab === 'particular' || (!isAdmin && requestedTab === 'luna') ? requestedTab : 'geral';
  const [lunaOpened, setLunaOpened] = useState(activeTab === 'luna');
  const setActiveTab = (tab) => {
    if (tab === 'luna') setLunaOpened(true);
    const next = new URLSearchParams(searchParams);
    if (tab === 'geral') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [sharingMessageId, setSharingMessageId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted');
  const lastAttentionRef = useRef(null);

  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';
  const CHAT_SESSION = `class_chat_${userCourse}`;

  const wall = useOvercomingWall({ course: userCourse, session });
  const messages = wall.messages;
  const codes = wall.accessCodes;
  const wallReactions = wall.reactions;
  const sharedPublications = wall.sharedPublications;
  const reactMutation = wall.reactMutation;
  const replyMutation = wall.replyMutation;
  const readKeys = new Set(wall.readReceipts.map((receipt) => receipt.highlight_key));

  useProfessorAutoReactions({ enabled: isAdmin, session, feed: wall.feed, reactions: wallReactions });

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
      if (event.data?.session_id === CHAT_SESSION) wall.refreshMessages();
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

  const dmBase = location.pathname.endsWith('/chat') ? location.pathname.slice(0, -5) : location.pathname;

  const sendMessage = async (content, isSticker = false) => {
    if (!content.trim()) return;
    setText('');
    setShowPicker(false);
    await wall.sendMessageMutation.mutateAsync(content);
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
    await wall.refreshMessages();
  };

  const deleteMessage = async (message) => {
    if (!isAdmin || !message?.id || !window.confirm('Excluir esta mensagem permanentemente? Esta ação não pode ser desfeita.')) return;
    await adminApi.delete('ChatMessage', message.id);
    await wall.refreshMessages();
  };

  const shareToWall = async (item, sourceType = 'chat') => {
    if (!isAdmin || !item?.id || sharingMessageId) return;
    if (sharedPublications.some((post) => post.source_type === sourceType && post.source_id === item.id)) {
      toast.info(sourceType === 'achievement' ? 'Esta conquista já está no mural.' : 'Esta publicação já está no mural.');
      return;
    }
    setSharingMessageId(item.id);
    try {
      await adminApi.create('WallPublication', {
        course: userCourse,
        source_type: sourceType,
        source_id: item.id,
        title: sourceType === 'achievement' ? 'Conquista da turma' : 'Destaque da comunidade',
        content: sourceType === 'achievement' ? item.content : (item.content || '').replace(ATTENTION_PREFIX, '').replace('[MSN_ACTION]', '').trim(),
        author_name: sourceType === 'achievement' ? (item.studentName || 'Aluno da turma') : (item.author_name || 'Comunidade EDU'),
        published_by: session?.email,
        published_at: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ['overcoming-wall-institutional', userCourse] });
      toast.success(`${sourceType === 'achievement' ? 'Conquista' : 'Publicação'} encaminhada ao mural da dashboard dos alunos!`);
    } catch (error) {
      toast.error(error?.message || 'Não foi possível compartilhar a publicação.');
    } finally {
      setSharingMessageId(null);
    }
  };

  const shareMessageExternal = async (msg) => {
    const cleanContent = (msg.content || '').replace(ATTENTION_PREFIX, '').replace('[MSN_ACTION]', '').trim();
    const author = msg.author_name || 'Aluno';
    const shareText = `${author} escreveu no Mural de Superação:\n\n"${cleanContent}"`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mural de Superação', text: shareText });
      } catch (e) {
        if (e.name !== 'AbortError') toast.error('Não foi possível compartilhar.');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Mensagem copiada! Cole no app desejado.');
      } catch {
        toast.error('Não foi possível compartilhar.');
      }
    }
  };

  const getProfile = (email) => {
    const code = codes.find(c => c.student_email === email);
    const idx = Math.abs(email?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % MSN_COLORS.length;
    return { color: code?.profile_avatar_color || MSN_COLORS[idx], emoji: resolveAvatarEmoji(code?.profile_avatar_emoji), name: code?.profile_name || null };
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'nunca visitou';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isStudentOnline = (student) => student.is_online && student.last_seen_at && Date.now() - new Date(student.last_seen_at).getTime() < 90000;

  const otherStudents = codes.filter(c => c.student_email && c.student_email !== session?.email && c.is_active !== false)
    .filter(c => codePrefix ? (c.code || '').startsWith(codePrefix) : true)
    .filter(c => courseEmails ? courseEmails.has(c.student_email) : !userCourse || c.course === userCourse)
    .filter(c => (c.profile_name || c.student_name || c.student_email || '').toLowerCase().includes(dmSearch.toLowerCase()));
  const onlineStudents = otherStudents.filter(isStudentOnline);
  const awayStudents = otherStudents.filter(c => !isStudentOnline(c))
    .slice()
    .sort((a, b) => {
      const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      return bTime - aTime;
    });
  const { pinned: pinnedHighlights, regular: regularFeed } = splitWeeklyHighlights(wall.feed, readKeys);
  const wallFeed = [...pinnedHighlights, ...regularFeed];

  const getMonitor = (email, occurredAt) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const date = String(occurredAt || '').slice(0, 10);
    return wall.monitorHistory.find((monitor) => String(monitor.student_email || '').trim().toLowerCase() === normalizedEmail
      && (!monitor.period_start || date >= monitor.period_start)
      && (!monitor.period_end || date <= monitor.period_end));
  };

  const monitorMention = (email, occurredAt) => {
    const monitor = getMonitor(email, occurredAt);
    const medal = MONITOR_MEDALS[monitor?.rank_position];
    const profile = getProfile(email);
    const code = codes.find((item) => String(item.student_email || '').trim().toLowerCase() === String(email || '').trim().toLowerCase());
    if (!medal) return null;
    return <ClickableStudent key={email} email={email} className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2 text-foreground">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {code?.profile_photo_url ? <img src={code.profile_photo_url} alt="" className="h-full w-full rounded-full object-cover" /> : <span aria-hidden="true">{profile.emoji}</span>}
      </span>
      <span className="min-w-0"><span className="block truncate text-xs font-semibold">{profile.name || monitor.student_name || email}</span><span className="block text-xs text-muted-foreground">Monitor(a) · {medal.label}</span></span>
      <span className="text-base" aria-label={`Medalha de ${medal.label}`}>{medal.emoji}</span>
    </ClickableStudent>;
  };

  const reactionButtons = (item, targetType, ownerEmail, mentionedEmails = []) => <ChatReactions
    item={item} targetType={targetType} ownerEmail={ownerEmail} mentionedEmails={mentionedEmails}
    session={session} wallReactions={wallReactions} reactMutation={reactMutation} replyMutation={replyMutation}
    replyTarget={replyTarget} setReplyTarget={setReplyTarget} replyText={replyText} setReplyText={setReplyText}
  />;

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return alert('Este aparelho não suporta notificações do navegador.');
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotificationsEnabled(enabled);
    const myCode = codes.find(c => c.student_email === session?.email);
    if (myCode?.id) await base44.entities.AccessCode.update(myCode.id, { site_notifications_enabled: enabled });
    if (enabled) new Notification('EDU Live Messenger', { body: 'Notificações ativadas neste aparelho.', icon: MSN_LOGO_URL });
  };

  const contactProps = { students: otherStudents, onlineStudents, awayStudents, isOnline: isStudentOnline, formatLastSeen, onContact: (email) => navigate(`${dmBase}/dm/${encodeURIComponent(email)}`), search: dmSearch, onSearch: setDmSearch };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col p-2 text-foreground sm:p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <ChatHeader courseLabel={courseLabel} activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} notificationsEnabled={notificationsEnabled} onNotifications={enableNotifications}/>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {activeTab === 'geral' && <>
            <section aria-label="Mural de Superação" className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-border bg-secondary/30 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Inspire a turma.</strong> Compartilhe uma conquista, uma palavra de força ou um passo importante da sua jornada.</div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
                {pinnedHighlights.length > 0 && <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground"><Pin size={14} className="shrink-0 text-primary"/>Lembretes importantes · fixados por até 7 dias</div>}
                {wallFeed.length === 0 ? <p className="px-3 py-8 text-center text-sm leading-relaxed text-muted-foreground">Seja a primeira pessoa a compartilhar uma mensagem de superação.</p> : wallFeed.map((msg) => {
                  const isPinned = pinnedHighlights.includes(msg);
                  const readButton = isPinned && !isAdmin ? <button type="button" onClick={() => wall.markHighlightReadMutation.mutate(highlightKey(msg))} disabled={wall.markHighlightReadMutation.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/20 disabled:opacity-50" aria-label="Marcar lembrete como lido e desafixar"><CheckCheck size={14}/>Marcar como lido</button> : null;
                  if (['personal', 'notification', 'institutional', 'achievement'].includes(msg.feedType)) return <ChatFeedNotice key={msg.id} msg={msg} isPinned={isPinned} readButton={readButton} isAdmin={isAdmin} shared={sharedPublications.some((post) => post.source_type === 'achievement' && post.source_id === msg.id)} sharing={sharingMessageId === msg.id} onShare={shareToWall} monitorMention={monitorMention} reactions={msg.feedType === 'achievement' ? reactionButtons(msg, 'achievement', msg.studentEmail, msg.mentionedEmails) : null}/>;
                  const profile = getProfile(msg.author_email);
                  return <ChatMessageItem key={msg.id} msg={msg} isMe={msg.author_email === session?.email} isAdmin={isAdmin} name={getAvatarPrefixedName(profile.name || msg.author_name, profile.emoji)} email={msg.author_email} time={formatBRT(msg.created_date)} onEdit={startEditing} onDelete={deleteMessage} onShare={shareToWall} onShareExternal={shareMessageExternal} sharing={sharingMessageId === msg.id} shared={sharedPublications.some((post) => post.source_type === 'chat' && post.source_id === msg.id)} reactions={reactionButtons(msg, 'publication', msg.author_email)}/>;
                })}
              </div>
              <ChatComposer text={text} setText={setText} showPicker={showPicker} setShowPicker={setShowPicker} emojis={WALL_EMOJIS} onSend={sendMessage} sending={wall.sendMessageMutation.isPending} editingMessage={editingMessage} editText={editText} setEditText={setEditText} onSaveEdit={saveEdit} onCancelEdit={() => setEditingMessage(null)}/>
            </section>
            <aside aria-label="Contatos da turma" className="hidden w-64 shrink-0 border-l border-border bg-card/50 lg:block"><ChatContacts {...contactProps} compact/></aside>
          </>}
          {activeTab === 'particular' && <section aria-label="Conversas particulares" className="min-h-0 min-w-0 flex-1"><ChatContacts {...contactProps}/></section>}
          {!isAdmin && (lunaOpened || activeTab === 'luna') && <section aria-label="Conversa com a Luna" className={activeTab === 'luna' ? 'flex min-h-0 min-w-0 flex-1 flex-col' : 'hidden'}><LunaChat session={session} isActive={activeTab === 'luna'}/></section>}
        </div>
      </div>
    </div>
  );
}