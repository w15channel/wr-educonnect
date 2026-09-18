import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Smile, Minus, Square, X, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import StudentProfileCard from '@/components/shared/StudentProfileCard';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { getDMSessionId, LUNA_DM_EMAIL, LUNA_DM_NAME } from '@/lib/lunaDM';

const DM_PREFIX = 'dm_';
const MSN_LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/10fc0b060_pngegg.png';

function MSNAvatar({ color = '#3b82f6', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="9" r="5" fill={color}/>
      <ellipse cx="16" cy="23" rx="8" ry="6" fill={color}/>
      <ellipse cx="10" cy="20" rx="3" ry="5" fill={color} transform="rotate(-20 10 20)"/>
      <ellipse cx="22" cy="20" rx="3" ry="5" fill={color} transform="rotate(20 22 20)"/>
      <circle cx="14" cy="8" r="1.2" fill="#fff" opacity="0.7" />
    </svg>
  );
}

export default function DirectMessage() {
  const { email: targetEmail } = useParams();
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef(null);
  const { emails: courseEmails, codePrefix } = useCourseFilteredEmails(session);
  const usesCodeSession = !!(session?.code || session?.codeId);

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes', session?.email],
    queryFn: async () => {
      if (!usesCodeSession) return base44.entities.AccessCode.list('-created_date', 200);
      const response = await base44.functions.invoke('manageOvercomingWall', {
        action: 'load', course: session?.course || 'tcc', actor_email: session?.email,
        access_code: session?.code, access_code_id: session?.codeId,
      });
      return response.data?.accessCodes || [];
    },
    refetchInterval: 15000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['student-profiles-dm'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 500),
    enabled: !usesCodeSession,
  });

  const sessionId = session?.email ? getDMSessionId(session.email, decodeURIComponent(targetEmail)) : null;

  const { data: messages = [] } = useQuery({
    queryKey: ['dm', sessionId],
    queryFn: async () => {
      const response = await base44.functions.invoke('saveStudentRecord', { action: 'listChatMessages', session_id: sessionId });
      return response.data?.records || [];
    },
    enabled: !!sessionId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!sessionId || usesCodeSession) return;
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === sessionId) {
        queryClient.invalidateQueries({ queryKey: ['dm', sessionId] });
      }
    });
    return unsub;
  }, [sessionId, queryClient, usesCodeSession]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTargetInfo = () => {
    const dec = decodeURIComponent(targetEmail);
    if (dec === LUNA_DM_EMAIL) return { email: dec, name: LUNA_DM_NAME, nickname: 'Sua assistente na WR-EDU', color: '#d97706', photo: null, online: true, lastSeen: new Date() };
    const code = codes.find(c => c.student_email === dec);
    const profile = profiles.find(p => p.student_email === dec || p.email === dec);
    const lastSeen = code?.last_seen_at ? new Date(code.last_seen_at) : null;
    const online = code?.is_online && lastSeen && Date.now() - lastSeen.getTime() < 90000;
    return {
      email: dec,
      name: profile?.nickname || code?.profile_name || profile?.full_name || code?.student_name || dec,
      nickname: profile?.nickname || '',
      color: code?.profile_avatar_color || profile?.avatar_color || '#3b82f6',
      photo: code?.profile_photo_url || profile?.photo_url,
      online,
      lastSeen,
    };
  };

  const target = getTargetInfo();
  const formatLastSeen = (date) => {
    if (!date) return 'visto por último indisponível';
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'visto agora mesmo';
    if (diff < 3600000) return `visto há ${Math.floor(diff / 60000)} min`;
    return `visto por último em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const statusText = target.online ? 'Online agora' : formatLastSeen(target.lastSeen);
  const myCode = codes.find(c => c.student_email === session?.email);
  const myColor = myCode?.profile_avatar_color || '#f97316';
  const CHAT_EMOJIS = ['😊','😂','😍','🥰','😭','😤','🤔','😅','🙏','❤️','🔥','✨','👏','🎉','💪','😎'];
  const targetCode = codes.find(c => c.student_email === decodeURIComponent(targetEmail));
  const canMessageTarget = target.email === LUNA_DM_EMAIL || (targetCode && (!codePrefix || (targetCode.code || '').startsWith(codePrefix)) && (!courseEmails || courseEmails.has(targetCode.student_email)));

  const shareMessageExternal = async (msg) => {
    const author = msg.author_name || 'Aluno';
    const shareText = `${author}:\n\n${msg.content}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'EDU Live Messenger', text: shareText });
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

  const sendMessage = async () => {
    if (!text.trim() || !sessionId) return;
    const msg = text.trim();
    setText('');
    await base44.functions.invoke('saveStudentRecord', {
      action: 'create',
      entity: 'ChatMessage',
      data: {
        session_id: sessionId,
        author_name: session?.name || 'Eu',
        author_email: session?.email || '',
        content: msg,
        is_hand_raised: false,
      },
    });
    queryClient.invalidateQueries({ queryKey: ['dm', sessionId] });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!canMessageTarget) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <button onClick={() => navigate('../chat')} className="text-primary text-sm hover:underline mb-4">← Voltar ao chat geral</button>
        <p>Este aluno não pertence à turma atual.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] p-3 bg-gradient-to-b from-rose-50/40 to-secondary/20">
      {showProfile && <StudentProfileCard email={target.email} onClose={() => setShowProfile(false)} />}
      <div className="h-full rounded-2xl border border-rose-100 bg-background/85 shadow-sm overflow-hidden dark:border-white/20 dark:bg-black">
        <div className="h-8 px-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center">
          <button onClick={() => navigate('../chat')} className="mr-2 text-white/80 hover:text-white" title="Voltar ao chat geral">
            <ArrowLeft size={15} />
          </button>
          <img src={MSN_LOGO_URL} alt="MSN" className="w-5 h-5 object-contain mr-2" />
          <span className="font-bold text-xs tracking-wide">EDU Live Messenger - {target.name}</span>
          <div className="ml-auto flex items-center gap-2"><Minus size={13}/><Square size={11}/><X size={13}/></div>
        </div>

        <div className="h-24 px-4 bg-gradient-to-b from-rose-50/40 to-secondary/20 border-b border-rose-100 dark:border-white/20 flex items-center gap-4">
          <button type="button" onClick={() => setShowProfile(true)} className={`relative rounded-md ${target.online ? 'shadow-[0_0_0_2px_#70c843,0_2px_8px_rgba(0,0,0,.18)]' : 'shadow-[0_0_0_2px_#ef4444,0_2px_8px_rgba(0,0,0,.18)]'}`} title="Ver mini perfil">
            {target.photo ? (
              <img src={target.photo} alt={target.name} className="w-16 h-16 rounded-md object-cover border-4 border-white" />
            ) : (
              <div className="w-16 h-16 rounded-md bg-white border-4 border-white flex items-center justify-center">
                <MSNAvatar color={target.color} size={48} />
              </div>
            )}
            <span className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white ${target.online ? 'bg-green-500' : 'bg-red-500'}`} />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl text-foreground dark:text-white leading-tight truncate">{target.name}</h2>
            {target.nickname && target.nickname !== target.name && <p className="text-sm text-primary truncate -mt-0.5">“{target.nickname}”</p>}
            <p className={`text-xs font-bold ${target.online ? 'text-green-700' : 'text-red-600'}`}>{target.online ? '🟢 Online' : '🔴 Ausente'} · Conversa particular</p>
            <p className="text-xs text-muted-foreground truncate">{statusText}</p>
            <p className="text-xs text-muted-foreground truncate">🔒 Mensagens privadas no EDU Live Messenger</p>
          </div>
        </div>

        <div className="h-[calc(100%-8rem)] flex flex-col bg-background dark:bg-black">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-background dark:bg-black">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center text-muted-foreground">
                <MSNAvatar color={target.color} size={58} />
                <p className="font-bold text-foreground dark:text-white">Inicie a conversa com {target.name}!</p>
                <p className="text-sm">Suas mensagens são privadas.</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.author_email === session?.email;
              const rawDate = msg.created_date ? new Date(new Date(msg.created_date).getTime() - 3 * 60 * 60 * 1000) : null;
              const time = rawDate ? rawDate.toISOString().slice(11, 16) : '';
              return (
                <div key={msg.id} className="text-[13px] leading-relaxed group">
                  <span className="text-[11px] text-muted-foreground">[{time}] </span>
                  <span className="font-bold text-foreground dark:text-white">
                    {isMe ? 'Você' : msg.author_name}
                  </span>
                  <span className="text-muted-foreground"> diz:</span>
                  <span className="ml-1 text-foreground dark:text-white">{msg.content}</span>
                  <button type="button" onClick={() => shareMessageExternal(msg)} className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-primary opacity-0 transition group-hover:opacity-100 hover:bg-rose-50" title="Compartilhar em aplicativos externos" aria-label="Compartilhar em aplicativos externos"><Share2 size={11}/></button>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-rose-100 bg-rose-50/20 dark:border-white/20 dark:bg-black">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Smile size={15} className="text-primary" />
              <div className="flex gap-1 overflow-x-auto">
                {CHAT_EMOJIS.slice(0, 10).map(e => (
                  <button key={e} type="button" onClick={() => setText(prev => `${prev}${e}`)} className="w-7 h-7 border border-rose-200 dark:border-white/20 bg-background dark:bg-black rounded hover:bg-rose-50 dark:hover:bg-white/10 text-sm">{e}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 h-9 px-3 text-sm border border-rose-200 dark:border-white/20 rounded bg-input text-foreground dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder={`Digite uma mensagem para ${target.name}...`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
              />
              <VoiceDictationButton value={text} onChange={setText} />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="h-9 px-4 rounded bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50"
              >
                <Send size={14} className="inline mr-1"/>Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
