import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Smile, Lock, Users, Search, Minus, Square, X, Bell } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { getAvatarPrefixedName, resolveAvatarEmoji } from '@/lib/avatarUtils';

const MSN_CLASSIC_EMOJIS = [
  { code: ':-)', icon: '🙂' }, { code: ';-)', icon: '😉' }, { code: ':-D', icon: '😄' },
  { code: ':-P', icon: '😛' }, { code: ':-O', icon: '😮' }, { code: ':-(', icon: '😢' },
  { code: '(H)', icon: '😎' }, { code: '(L)', icon: '❤️' }, { code: '(U)', icon: '💔' },
  { code: '(Y)', icon: '👍' }, { code: '(N)', icon: '👎' }, { code: '(C)', icon: '☕' },
  { code: '(PI)', icon: '🍕' }, { code: '(B)', icon: '🍺' }, { code: '(Z)', icon: '😴' },
  { code: '(F)', icon: '🌹' }, { code: '(W)', icon: '🥀' }, { code: '(K)', icon: '💋' },
];

const MSN_LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/10fc0b060_pngegg.png';
const ACTION_PREFIX = '[MSN_ACTION]';
const ATTENTION_PREFIX = '[MSN_ATTENTION]';

const STICKERS = [
  { id: 'attention', emoji: '🔔', label: 'Chamar atenção', message: 'chamou a atenção da sala.', attention: true },
  { id: 'brb', emoji: '⏳', label: 'Volto já', message: 'ficou com status: volto já.' },
  { id: 'afk', emoji: '🌙', label: 'Ausente', message: 'avisou que está ausente por alguns minutos.' },
  { id: 'help', emoji: '🙋', label: 'Pedir ajuda', message: 'pediu ajuda para a turma.' },
  { id: 'material', emoji: '📎', label: 'Pedir material', message: 'pediu o material ou link citado no chat.' },
  { id: 'summary', emoji: '📝', label: 'Pedir resumo', message: 'pediu um resumo dos pontos principais.' },
  { id: 'coffee', emoji: '☕', label: 'Pausa rápida', message: 'avisou que fará uma pausa rápida.' },
  { id: 'done', emoji: '✅', label: 'Concluído', message: 'marcou que concluiu essa etapa.' },
  { id: 'celebrate', emoji: '🎉', label: 'Comemorar', message: 'comemorou com a turma.' },
];

const MSN_COLORS = ['#4f6edc', '#0a7ad1', '#9a59c5', '#de4f8b', '#f2a327', '#17a589'];

function formatBRT(dateStr) {
  if (!dateStr) return '';
  const d = new Date(new Date(dateStr).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(11, 16);
}

function MessageItem({ msg, isMe, name, color, email, time }) {
  const isAttention = msg.content?.startsWith(ATTENTION_PREFIX);
  const isAction = msg.content?.startsWith(ACTION_PREFIX);
  const cleanContent = (msg.content || '').replace(ATTENTION_PREFIX, '').replace(ACTION_PREFIX, '').trim();

  if (isAttention || isAction) {
    return (
      <div className={`text-[12px] px-2 py-1 rounded border ${isAttention ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-[#eef6ff] border-[#c8d7f5] text-[#31558c]'}`} style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <span className="text-[11px] opacity-70">[{time}] </span>
        <span className="font-bold">{isAttention ? '🔔 Atenção: ' : '⚡ Ação MSN: '}</span>{cleanContent}
      </div>
    );
  }

  return (
    <div className="text-[13px] leading-relaxed" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <span className="text-[11px] text-[#6f7ba8]">[{time}] </span>
      <ClickableStudent email={email} className="font-bold" style={{ color: isMe ? '#0d5d9a' : color }}>
        {name}
      </ClickableStudent>
      <span className="text-[#1f2937]"> diz:</span>
      <span className="ml-1 text-[#0f172a]">{cleanContent}</span>
    </div>
  );
}

export default function ClassChat() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral');
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji');
  const [dmSearch, setDmSearch] = useState('');
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

  const handleMsnAction = async (action) => {
    const name = session?.name || 'Aluno';
    if (action.attention) {
      const key = `msn_attention_${CHAT_SESSION}_${session?.email || 'anon'}`;
      const now = Date.now();
      const saved = JSON.parse(localStorage.getItem(key) || '{"count":0,"blockedUntil":0}');
      if (saved.blockedUntil > now) {
        alert(`Aguarde ${Math.ceil((saved.blockedUntil - now) / 1000)}s para chamar atenção novamente.`);
        return;
      }
      const nextCount = (saved.count || 0) + 1;
      localStorage.setItem(key, JSON.stringify({ count: nextCount >= 3 ? 0 : nextCount, blockedUntil: nextCount >= 3 ? now + 60000 : 0 }));
      await sendMessage(`${ATTENTION_PREFIX} ${name} ${action.message}`, true);
      playAttention();
      return;
    }
    await sendMessage(`${ACTION_PREFIX} ${action.emoji} ${name} ${action.message}`, true);
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
          <span className="font-bold text-xs tracking-wide">EDU Live Messenger - Conversa da Turma</span>
          <div className="ml-auto flex items-center gap-2"><Minus size={13}/><Square size={11}/><X size={13}/></div>
        </div>

        <div className="h-9 px-3 bg-[#eaf1ff] border-b border-[#abc0ea] flex items-center justify-between text-[11px]">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('geral')} className={`px-3 py-1 rounded ${activeTab==='geral'?'bg-white border border-[#abc0ea] text-[#25449c] font-bold':'text-[#4f5f87]'}`}><Users size={12} className="inline mr-1"/>Chat geral</button>
            <button onClick={() => setActiveTab('particular')} className={`px-3 py-1 rounded ${activeTab==='particular'?'bg-white border border-[#abc0ea] text-[#25449c] font-bold':'text-[#4f5f87]'}`}><Lock size={11} className="inline mr-1"/>Particular</button>
          </div>
          <button onClick={enableNotifications} className={`flex items-center gap-1 px-2 py-1 rounded border ${notificationsEnabled ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-[#abc0ea] text-[#5471b9]'}`} title="Ativar notificações neste aparelho">
            <Bell size={11} /> {notificationsEnabled ? 'Notificações ativas' : 'Ativar notificações'}
          </button>
        </div>

        <div className="h-[calc(100%-68px)] flex flex-col lg:flex-row overflow-hidden">
          {activeTab === 'geral' && <>
            <div className="w-full lg:w-[68%] h-[65%] lg:h-full border-b lg:border-b-0 lg:border-r border-[#abc0ea] flex flex-col bg-white min-h-0">
              <div className="px-3 py-1 text-[11px] bg-[#f4f8ff] border-b border-[#dae5fa] text-[#5a6d9e]">Sala geral • {courseLabel} • mensagens públicas</div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1">
                {messages.length === 0 ? <p className="text-sm text-[#7182ac]">Ninguém falou ainda. Inicie com um “Oi :)”.</p> : messages.map((msg) => {
                  const isMe = msg.author_email === session?.email;
                  const profile = getProfile(msg.author_email);
                  return <MessageItem key={msg.id} msg={msg} isMe={isMe} name={getAvatarPrefixedName(profile.name || msg.author_name, profile.emoji)} email={msg.author_email} color={profile.color} time={formatBRT(msg.created_date)} />;
                })}
                <div ref={bottomRef} />
              </div>

              {showPicker && <div className="border-t border-[#dae5fa] bg-[#f8fbff]">
                <div className="flex text-[11px] border-b border-[#dae5fa]"><button onClick={() => setPickerTab('emoji')} className={`px-3 py-1.5 ${pickerTab==='emoji'?'font-bold text-[#25449c]':''}`}>Emoticons clássicos</button><button onClick={() => setPickerTab('sticker')} className={`px-3 py-1.5 ${pickerTab==='sticker'?'font-bold text-[#25449c]':''}`}>Ações MSN</button></div>
                {pickerTab === 'emoji' ? <div className="p-2 grid grid-cols-6 gap-1">{MSN_CLASSIC_EMOJIS.map((em) => <button key={em.code} onClick={() => setText(t => `${t}${em.code} `)} className="border border-[#d5e2fa] rounded px-2 py-1 hover:bg-[#ecf3ff] text-left text-xs"><span className="mr-1">{em.icon}</span>{em.code}</button>)}</div> : <div className="p-2 grid grid-cols-3 gap-1.5">{STICKERS.map(s => <button key={s.id} onClick={() => handleMsnAction(s)} className="border border-[#d5e2fa] rounded px-2 py-1 hover:bg-[#ecf3ff] text-xs text-left"><span className="mr-1">{s.emoji}</span>{s.label}</button>)}</div>}
              </div>}

              <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) sendMessage(text); }} className="border-t border-[#abc0ea] bg-[#edf3ff] p-2 flex items-center gap-2">
                <button type="button" onClick={() => setShowPicker(v => !v)} className="p-2 border border-[#abc0ea] bg-white rounded hover:bg-[#f2f7ff]"><Smile size={16} className="text-[#3f62ba]"/></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite aqui e pressione Enter..." className="flex-1 h-9 px-3 text-sm border border-[#abc0ea] rounded bg-white focus:outline-none" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }} />
                <button type="submit" className="h-9 px-4 rounded bg-[#4f7de0] text-white text-sm font-semibold disabled:opacity-50" disabled={!text.trim()}><Send size={14} className="inline mr-1"/>Enviar</button>
              </form>
            </div>

            <div className="w-full lg:w-[32%] h-[35%] lg:h-full bg-[#f2f6ff] p-2 min-h-0">
              <div className="space-y-2 max-h-full overflow-y-auto">
                <div>
                  <div className="text-[11px] font-bold text-[#2f7d32] mb-1 border-b border-green-200 pb-1">🟢 Online ({onlineStudents.length})</div>
                  {onlineStudents.slice(0, 60).map((c) => {
                    const name = getAvatarPrefixedName(c.profile_name || c.student_name || c.student_email, c.profile_avatar_emoji);
                    return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="w-full text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-[#c8d7f5] text-xs text-[#334155] truncate"><span className="text-green-500">●</span> {name}<span className="block pl-3 text-[10px] text-[#6f7ba8]">Online agora</span></button>;
                  })}
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#b42318] mb-1 border-b border-red-200 pb-1">🔴 Ausentes ({awayStudents.length})</div>
                  {awayStudents.slice(0, 60).map((c) => {
                    const name = getAvatarPrefixedName(c.profile_name || c.student_name || c.student_email, c.profile_avatar_emoji);
                    return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="w-full text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-[#c8d7f5] text-xs text-[#64748b] truncate"><span className="text-red-500">●</span> {name}<span className="block pl-3 text-[10px] text-[#8a6f6f]">Visto por último: {formatLastSeen(c.last_seen_at)}</span></button>;
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