import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Smile, Lock, Users, Search } from 'lucide-react';
import { ClickableStudent } from '@/components/shared/StudentProfileCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';

// MSN-style emoji/sticker sets
const EMOJI_LIST = ['😊','😂','😍','🥰','😭','😤','🤔','😅','🙏','❤️','🔥','✨','👏','🎉','💪','🌟','😎','🤗','😢','😱','👍','💯','🥺','😏','🌈','🌸','💖','🎶','🤩','😜'];

const STICKERS = [
  { id: 's1', emoji: '(づ￣ 3￣)づ', label: 'Abraço' },
  { id: 's2', emoji: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', label: 'Feliz' },
  { id: 's3', emoji: '(╯°□°）╯︵ ┻━┻', label: 'Nervoso' },
  { id: 's4', emoji: '┬─┬ ノ( ゜-゜ノ)', label: 'Calma' },
  { id: 's5', emoji: '(ಥ_ಥ)', label: 'Choro' },
  { id: 's6', emoji: '(ง •̀_•́)ง', label: 'Lutando' },
  { id: 's7', emoji: '(*˘︶˘*).｡.:*♡', label: 'Amor' },
  { id: 's8', emoji: '♪～(´ε｀ )', label: 'Cantando' },
  { id: 's9', emoji: '(≧◡≦)', label: 'Felicidade' },
  { id: 's10', emoji: 'zzz (=_=)', label: 'Dormindo' },
  { id: 's11', emoji: '\\(^o^)/', label: 'Uhul!' },
  { id: 's12', emoji: '(¬‿¬)', label: 'Sarcasmo' },
];

const MSN_COLORS = ['#5b5ef4','#e94f8b','#f4a23d','#1db89e','#a855f7','#ef4444','#3b82f6','#10b981'];

// MSN Live Messenger avatar SVGs (orange for "me", blue for others)
function MSNAvatar({ color = '#3b82f6', size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="9" r="5" fill={color}/>
      <ellipse cx="16" cy="23" rx="8" ry="6" fill={color}/>
      <ellipse cx="10" cy="20" rx="3" ry="5" fill={color} transform="rotate(-20 10 20)"/>
      <ellipse cx="22" cy="20" rx="3" ry="5" fill={color} transform="rotate(20 22 20)"/>
      <circle cx="14" cy="8" r="1.2" fill="#fff" opacity="0.7"/>
    </svg>
  );
}

function MSNBubble({ msg, isMe, name, color, time, email, avatarColor }) {
  return (
    <div className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="shrink-0">
        <MSNAvatar color={avatarColor || color || (isMe ? '#f97316' : '#3b82f6')} size={32} />
      </div>
      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMe && (
          <ClickableStudent email={email} className="text-[10px] font-bold mb-0.5 ml-1" style={{ color }}>
            <span style={{ color }}>{name}</span>
          </ClickableStudent>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm shadow-sm relative ${
            isMe
              ? 'rounded-br-sm bg-gradient-to-br from-[#5b5ef4] to-[#7c5ef4] text-white'
              : 'rounded-bl-sm bg-white border border-gray-200 text-gray-800'
          }`}
          style={!isMe ? { fontFamily: 'Tahoma, Arial, sans-serif' } : {}}
        >
          {msg.is_hand_raised ? (
            <span className="text-base" title={msg.content}>{msg.content}</span>
          ) : (
            <span className="leading-relaxed">{msg.content}</span>
          )}
        </div>
        <span className="text-[9px] text-gray-400 mt-0.5 mx-1">{time}</span>
      </div>
    </div>
  );
}

function formatBRT(dateStr) {
  if (!dateStr) return '';
  const d = new Date(new Date(dateStr).getTime() - 3 * 60 * 60 * 1000);
  return d.toISOString().slice(11, 16);
}

export default function ClassChat() {
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('geral'); // 'geral' | 'particular'
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState('emoji');
  const [dmSearch, setDmSearch] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Per-course chat room based on route (/tcc => EDU only)
  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const userCourse = routeCourse || session?.course || 'tcc';
  const CHAT_SESSION = `class_chat_${userCourse}`;

  const { data: messages = [] } = useQuery({
    queryKey: ['class-chat', userCourse],
    queryFn: () => base44.entities.ChatMessage.filter({ session_id: CHAT_SESSION }, 'created_date', 200),
    refetchInterval: 3000,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === CHAT_SESSION) {
        queryClient.invalidateQueries({ queryKey: ['class-chat', userCourse] });
      }
    });
    return unsub;
  }, [queryClient]);

  const sendMessage = async (content, isSticker = false) => {
    if (!content.trim()) return;
    setText('');
    setShowPicker(false);
    await base44.entities.ChatMessage.create({
      session_id: CHAT_SESSION,
      author_name: session?.name || 'Aluno',
      author_email: session?.email || '',
      content,
      is_hand_raised: isSticker,
    });
    queryClient.invalidateQueries({ queryKey: ['class-chat'] });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (text.trim()) sendMessage(text);
  };

  const getProfile = (email) => {
    const code = codes.find(c => c.student_email === email);
    const idx = Math.abs(email?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % MSN_COLORS.length;
    return {
      color: code?.profile_avatar_color || MSN_COLORS[idx],
      emoji: code?.profile_emoji || '✨',
      photo: code?.profile_photo_url || null,
      name: code?.profile_name || null,
    };
  };

  const groupedMessages = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameSender = prev?.author_email === msg.author_email;
    const sameMin = prev && Math.abs(new Date(msg.created_date) - new Date(prev.created_date)) < 60000;
    acc.push({ ...msg, groupedWithPrev: sameSender && sameMin });
    return acc;
  }, []);

  // Students list for DM tab
  const otherStudents = codes
    .filter(c => c.student_email && c.student_email !== session?.email && c.is_active !== false)
    .filter(c => codePrefix ? (c.code || '').startsWith(codePrefix) : true)
    .filter(c => courseEmails ? courseEmails.has(c.student_email) : !userCourse || c.course === userCourse)
    .filter(c => {
      const name = (c.profile_name || c.student_name || c.student_email || '').toLowerCase();
      return name.includes(dmSearch.toLowerCase());
    })
    .sort((a, b) => {
      const na = (a.profile_name || a.student_name || '').toLowerCase();
      const nb = (b.profile_name || b.student_name || '').toLowerCase();
      return na.localeCompare(nb, 'pt-BR');
    });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] max-w-3xl mx-auto">
      {/* MSN-style header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-gradient-to-r from-[#1e3a8a] via-[#3b5ef4] to-[#5b5ef4]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#3b5ef4]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Chat da Turma</p>
            <p className="text-white/60 text-[10px]">★ WR-EDU · Estilo MSN Messenger ★</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/60 text-[10px]">{messages.length > 0 ? `${new Set(messages.map(m => m.author_email)).size} online` : 'online'}</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'geral' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            <Users size={12} /> Geral
          </button>
          <button
            onClick={() => setActiveTab('particular')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'particular' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
          >
            <Lock size={12} /> Particular
          </button>
        </div>
      </div>

      {/* MSN marquee notice — only on geral */}
      {activeTab === 'geral' && (
        <div className="shrink-0 bg-[#dde8f8] border-b border-[#a8c0e8] overflow-hidden">
          <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap py-1 text-[11px] text-[#1e3a8a] font-medium px-4 inline-block">
            ✦ Bem-vindo ao Chat da Turma WR-EDU! ✦ Seja educado e respeitoso ✦ Use emojis e figurinhas para se expressar ✦ Bons estudos! ✦ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </div>
        </div>
      )}

      {/* Particular tab — student picker */}
      {activeTab === 'particular' && (
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_#e9efff,_#f7f9ff_45%,_#ecf3ff)] p-4">
          <p className="text-xs text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
            <Lock size={11} /> Selecione um colega para iniciar uma conversa privada
          </p>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#5b5ef4]/50"
              placeholder="Buscar colega..."
              value={dmSearch}
              onChange={e => setDmSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {otherStudents.map(c => {
              const name = c.profile_name || c.student_name || c.student_email;
              const color = c.profile_avatar_color || '#5b5ef4';
              const photo = c.profile_photo_url;
              const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`${location.pathname.replace(/\/chat$/, '')}/dm/${encodeURIComponent(c.student_email)}`)}
                  className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-[#5b5ef4]/5 hover:border-[#5b5ef4]/30 transition-all text-left"
                >
                  {photo ? (
                    <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover shrink-0" style={{ border: `2px solid ${color}` }} />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                    <p className="text-[11px] text-gray-400">Clique para abrir conversa privada</p>
                  </div>
                  <Lock size={13} className="text-gray-300 shrink-0" />
                </button>
              );
            })}
            {otherStudents.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">Nenhum colega encontrado</p>
            )}
          </div>
        </div>
      )}

      {/* Messages area — only geral */}
      {activeTab === 'geral' && <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f4fb]" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(91,94,244,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(29,184,158,0.05) 0%, transparent 50%)' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="text-5xl">💬</div>
            <p className="text-[#5b5ef4] font-bold text-lg">Seja o primeiro a falar!</p>
            <p className="text-gray-400 text-sm">Use emojis e figurinhas para se expressar 😊</p>
          </div>
        )}
        {groupedMessages.map((msg) => {
          const isMe = msg.author_email === session?.email;
          const profile = getProfile(msg.author_email);
          const color = profile.color;
          const time = formatBRT(msg.created_date);
          return (
            <MSNBubble
              key={msg.id}
              msg={msg}
              isMe={isMe}
              name={`${profile.emoji} ${profile.name || msg.author_name}`}
              email={msg.author_email}
              color={color}
              time={time}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>}

      {/* Emoji/sticker picker — only geral */}
      {activeTab === 'geral' && showPicker && (
        <div className="shrink-0 bg-white border-t border-border shadow-lg">
          <div className="flex border-b border-border">
            <button
              onClick={() => setPickerTab('emoji')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${pickerTab === 'emoji' ? 'text-[#5b5ef4] border-b-2 border-[#5b5ef4]' : 'text-gray-400'}`}
            >
              😊 Emojis
            </button>
            <button
              onClick={() => setPickerTab('sticker')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${pickerTab === 'sticker' ? 'text-[#5b5ef4] border-b-2 border-[#5b5ef4]' : 'text-gray-400'}`}
            >
              ✨ Figurinhas MSN
            </button>
          </div>
          {pickerTab === 'emoji' ? (
            <div className="p-3 grid grid-cols-10 gap-1.5 max-h-32 overflow-y-auto">
              {EMOJI_LIST.map(em => (
                <button key={em} onClick={() => setText(t => t + em)} className="text-xl hover:scale-125 transition-transform">
                  {em}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {STICKERS.map(s => (
                <button
                  key={s.id}
                  onClick={() => sendMessage(s.emoji, true)}
                  className="bg-gray-50 hover:bg-[#5b5ef4]/10 border border-gray-200 rounded-xl p-2 text-center transition-all hover:scale-105"
                >
                  <p className="text-xs font-mono text-gray-700 leading-tight">{s.emoji}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{s.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input bar — only geral */}
      {activeTab === 'geral' && <div className="shrink-0 bg-white border-t border-border p-3">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowPicker(v => !v)}
            className={`p-2 rounded-xl transition-colors shrink-0 ${showPicker ? 'bg-[#5b5ef4]/10 text-[#5b5ef4]' : 'text-gray-400 hover:text-[#5b5ef4] hover:bg-gray-100'}`}
          >
            <Smile size={20} />
          </button>
          <input
            ref={inputRef}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#5b5ef4]/50 focus:bg-white transition-all"
            placeholder="Digite uma mensagem... (Enter para enviar)"
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 bg-gradient-to-br from-[#5b5ef4] to-[#7c5ef4] text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-all shrink-0 shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[9px] text-gray-300 text-center mt-1.5 font-mono">★ WR-EDU Chat · inspirado no MSN Messenger ★</p>
      </div>}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}