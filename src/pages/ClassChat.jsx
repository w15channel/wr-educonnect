import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Smile, Lock, Users, Search, Minus, Square, X } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';

const MSN_CLASSIC_EMOJIS = [
  { code: ':-)', icon: '🙂' }, { code: ';-)', icon: '😉' }, { code: ':-D', icon: '😄' },
  { code: ':-P', icon: '😛' }, { code: ':-O', icon: '😮' }, { code: ':-(', icon: '😢' },
  { code: '(H)', icon: '😎' }, { code: '(L)', icon: '❤️' }, { code: '(U)', icon: '💔' },
  { code: '(Y)', icon: '👍' }, { code: '(N)', icon: '👎' }, { code: '(C)', icon: '☕' },
  { code: '(PI)', icon: '🍕' }, { code: '(B)', icon: '🍺' }, { code: '(Z)', icon: '😴' },
  { code: '(F)', icon: '🌹' }, { code: '(W)', icon: '🥀' }, { code: '(K)', icon: '💋' },
];

const STICKERS = [
  { id: 's1', emoji: '(nudge)', label: 'Cutucar' },
  { id: 's2', emoji: '(brb)', label: 'Volto já' },
  { id: 's3', emoji: '(afk)', label: 'Ausente' },
  { id: 's4', emoji: '(bah)', label: 'Bah' },
  { id: 's5', emoji: '(h5)', label: 'Toca aqui' },
  { id: 's6', emoji: '(rock)', label: 'Rock' },
  { id: 's7', emoji: '(rain)', label: 'Chovendo' },
  { id: 's8', emoji: '(party)', label: 'Festa' },
  { id: 's9', emoji: '(cof)', label: 'Café' },
];

const MSN_COLORS = ['#4f6edc', '#0a7ad1', '#9a59c5', '#de4f8b', '#f2a327', '#17a589'];

function formatBRT(dateStr) {
  if (!dateStr) return '';
  const d = new Date(new Date(dateStr).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(11, 16);
}

function MessageItem({ msg, isMe, name, color, email, time }) {
  return (
    <div className="text-[13px] leading-relaxed" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
      <span className="text-[11px] text-[#6f7ba8]">[{time}] </span>
      <ClickableStudent email={email} className="font-bold" style={{ color: isMe ? '#0d5d9a' : color }}>
        {name}
      </ClickableStudent>
      <span className="text-[#1f2937]"> diz:</span>
      <span className="ml-1 text-[#0f172a]">{msg.content}</span>
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
  const bottomRef = useRef(null);

  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';
  const CHAT_SESSION = `class_chat_${userCourse}`;

  const { data: messages = [] } = useQuery({
    queryKey: ['class-chat', userCourse],
    queryFn: () => base44.entities.ChatMessage.filter({ session_id: CHAT_SESSION }, 'created_date', 300),
    refetchInterval: 3000,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 300),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeTab]);

  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === CHAT_SESSION) queryClient.invalidateQueries({ queryKey: ['class-chat', userCourse] });
    });
    return unsub;
  }, [queryClient, CHAT_SESSION, userCourse]);

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

  const getProfile = (email) => {
    const code = codes.find(c => c.student_email === email);
    const idx = Math.abs(email?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % MSN_COLORS.length;
    return { color: code?.profile_avatar_color || MSN_COLORS[idx], emoji: code?.profile_emoji || '•', name: code?.profile_name || null };
  };

  const otherStudents = codes.filter(c => c.student_email && c.student_email !== session?.email && c.is_active !== false)
    .filter(c => codePrefix ? (c.code || '').startsWith(codePrefix) : true)
    .filter(c => courseEmails ? courseEmails.has(c.student_email) : !userCourse || c.course === userCourse)
    .filter(c => (c.profile_name || c.student_name || c.student_email || '').toLowerCase().includes(dmSearch.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] p-3 bg-[#b9cdf3]">
      <div className="h-full rounded-md border border-[#3a5db6] shadow-[0_2px_0_#fff,inset_0_1px_0_rgba(255,255,255,.7)] bg-[#dfe9fb] overflow-hidden">
        <div className="h-8 px-3 bg-gradient-to-r from-[#2f58b6] via-[#4e7de0] to-[#2f58b6] text-white flex items-center">
          <span className="font-bold text-xs tracking-wide">Windows Live Messenger - WR EDU</span>
          <div className="ml-auto flex items-center gap-2"><Minus size={13}/><Square size={11}/><X size={13}/></div>
        </div>

        <div className="h-9 px-3 bg-[#eaf1ff] border-b border-[#abc0ea] flex items-center justify-between text-[11px]">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('geral')} className={`px-3 py-1 rounded ${activeTab==='geral'?'bg-white border border-[#abc0ea] text-[#25449c] font-bold':'text-[#4f5f87]'}`}><Users size={12} className="inline mr-1"/>Conversa da turma</button>
            <button onClick={() => setActiveTab('particular')} className={`px-3 py-1 rounded ${activeTab==='particular'?'bg-white border border-[#abc0ea] text-[#25449c] font-bold':'text-[#4f5f87]'}`}><Lock size={11} className="inline mr-1"/>Particular</button>
          </div>
          <span className="text-[#5471b9]">Status: Online</span>
        </div>

        <div className="h-[calc(100%-68px)] flex">
          {activeTab === 'geral' && <>
            <div className="w-[68%] border-r border-[#abc0ea] flex flex-col bg-white">
              <div className="px-3 py-1 text-[11px] bg-[#f4f8ff] border-b border-[#dae5fa] text-[#5a6d9e]">Sala geral • {userCourse.toUpperCase()} • mensagens públicas</div>
              <div className="flex-1 p-3 overflow-y-auto space-y-1">
                {messages.length === 0 ? <p className="text-sm text-[#7182ac]">Ninguém falou ainda. Inicie com um “Oi :)”.</p> : messages.map((msg) => {
                  const isMe = msg.author_email === session?.email;
                  const profile = getProfile(msg.author_email);
                  return <MessageItem key={msg.id} msg={msg} isMe={isMe} name={`${profile.emoji} ${profile.name || msg.author_name}`} email={msg.author_email} color={profile.color} time={formatBRT(msg.created_date)} />;
                })}
                <div ref={bottomRef} />
              </div>

              {showPicker && <div className="border-t border-[#dae5fa] bg-[#f8fbff]">
                <div className="flex text-[11px] border-b border-[#dae5fa]"><button onClick={() => setPickerTab('emoji')} className={`px-3 py-1.5 ${pickerTab==='emoji'?'font-bold text-[#25449c]':''}`}>Emoticons clássicos</button><button onClick={() => setPickerTab('sticker')} className={`px-3 py-1.5 ${pickerTab==='sticker'?'font-bold text-[#25449c]':''}`}>Ações MSN</button></div>
                {pickerTab === 'emoji' ? <div className="p-2 grid grid-cols-6 gap-1">{MSN_CLASSIC_EMOJIS.map((em) => <button key={em.code} onClick={() => setText(t => `${t}${em.code} `)} className="border border-[#d5e2fa] rounded px-2 py-1 hover:bg-[#ecf3ff] text-left text-xs"><span className="mr-1">{em.icon}</span>{em.code}</button>)}</div> : <div className="p-2 grid grid-cols-3 gap-1.5">{STICKERS.map(s => <button key={s.id} onClick={() => sendMessage(s.emoji, true)} className="border border-[#d5e2fa] rounded px-2 py-1 hover:bg-[#ecf3ff] text-xs">{s.label}</button>)}</div>}
              </div>}

              <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) sendMessage(text); }} className="border-t border-[#abc0ea] bg-[#edf3ff] p-2 flex items-center gap-2">
                <button type="button" onClick={() => setShowPicker(v => !v)} className="p-2 border border-[#abc0ea] bg-white rounded hover:bg-[#f2f7ff]"><Smile size={16} className="text-[#3f62ba]"/></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite aqui e pressione Enter..." className="flex-1 h-9 px-3 text-sm border border-[#abc0ea] rounded bg-white focus:outline-none" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }} />
                <button type="submit" className="h-9 px-4 rounded bg-[#4f7de0] text-white text-sm font-semibold disabled:opacity-50" disabled={!text.trim()}><Send size={14} className="inline mr-1"/>Enviar</button>
              </form>
            </div>

            <div className="w-[32%] bg-[#f2f6ff] p-2">
              <div className="text-[11px] font-bold text-[#4962a5] mb-2">Contatos online</div>
              <div className="space-y-1 max-h-full overflow-y-auto">
                {otherStudents.slice(0, 60).map((c) => {
                  const name = c.profile_name || c.student_name || c.student_email;
                  return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="w-full text-left px-2 py-1 rounded hover:bg-white border border-transparent hover:border-[#c8d7f5] text-xs text-[#334155] truncate">🟢 {name}</button>;
                })}
              </div>
            </div>
          </>}

          {activeTab === 'particular' && <div className="flex-1 p-4 bg-white">
            <p className="text-sm text-[#4f5f87] mb-3">Selecione um contato para abrir chat privado.</p>
            <div className="relative mb-3"><Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/><input value={dmSearch} onChange={e => setDmSearch(e.target.value)} className="w-full h-9 pl-8 pr-3 border border-[#abc0ea] rounded" placeholder="Buscar contato..."/></div>
            <div className="grid md:grid-cols-2 gap-2">
              {otherStudents.map((c) => {
                const name = c.profile_name || c.student_name || c.student_email;
                return <button key={c.id} onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)} className="border border-[#c8d7f5] rounded px-3 py-2 text-left hover:bg-[#f6f9ff] text-sm">🔒 {name}</button>;
              })}
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
