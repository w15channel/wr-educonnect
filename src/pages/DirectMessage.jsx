import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft, Smile, Minus, Square, X } from 'lucide-react';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';

const DM_PREFIX = 'dm_';
const MSN_LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/10fc0b060_pngegg.png';

function getDMSessionId(emailA, emailB) {
  const sorted = [emailA, emailB].sort();
  return `${DM_PREFIX}${sorted[0]}_${sorted[1]}`;
}

function MSNAvatar({ color = '#3b82f6', size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="9" r="5" fill={color}/>
      <ellipse cx="16" cy="23" rx="8" ry="6" fill={color}/>
      <ellipse cx="10" cy="20" rx="3" ry="5" fill={color} transform="rotate(-20 10 20)"/>
      <ellipse cx="22" cy="20" rx="3" ry="5" fill={color} transform="rotate(20 22 20)"/>
      <circle cx="14" cy="8" r="1.2" fill="#fff" opacity="0.7"/>
    </svg>
  );
}

export default function DirectMessage() {
  const { email: targetEmail } = useParams();
  const { user: session } = useOutletContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const { emails: courseEmails, codePrefix } = useCourseFilteredEmails();

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['student-profiles-dm'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 500),
  });

  const sessionId = session?.email ? getDMSessionId(session.email, decodeURIComponent(targetEmail)) : null;

  const { data: messages = [] } = useQuery({
    queryKey: ['dm', sessionId],
    queryFn: () => base44.entities.ChatMessage.filter({ session_id: sessionId }, 'created_date', 200),
    enabled: !!sessionId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!sessionId) return;
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.session_id === sessionId) {
        queryClient.invalidateQueries({ queryKey: ['dm', sessionId] });
      }
    });
    return unsub;
  }, [sessionId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getTargetInfo = () => {
    const dec = decodeURIComponent(targetEmail);
    const code = codes.find(c => c.student_email === dec);
    const profile = profiles.find(p => p.student_email === dec || p.email === dec);
    return {
      name: code?.profile_name || profile?.full_name || code?.student_name || dec,
      nickname: profile?.nickname || '',
      color: code?.profile_avatar_color || profile?.avatar_color || '#3b82f6',
      photo: code?.profile_photo_url || profile?.photo_url,
    };
  };

  const target = getTargetInfo();
  const myCode = codes.find(c => c.student_email === session?.email);
  const myColor = myCode?.profile_avatar_color || '#f97316';
  const CHAT_EMOJIS = ['😊','😂','😍','🥰','😭','😤','🤔','😅','🙏','❤️','🔥','✨','👏','🎉','💪','😎'];
  const targetCode = codes.find(c => c.student_email === decodeURIComponent(targetEmail));
  const canMessageTarget = targetCode && (!codePrefix || (targetCode.code || '').startsWith(codePrefix)) && (!courseEmails || courseEmails.has(targetCode.student_email));

  const sendMessage = async () => {
    if (!text.trim() || !sessionId) return;
    const msg = text.trim();
    setText('');
    await base44.entities.ChatMessage.create({
      session_id: sessionId,
      author_name: session?.name || 'Eu',
      author_email: session?.email || '',
      content: msg,
      is_hand_raised: false,
    });
    queryClient.invalidateQueries({ queryKey: ['dm', sessionId] });
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!canMessageTarget) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline mb-4">← Voltar</button>
        <p>Este aluno não pertence à turma atual.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] p-3 bg-[#b9cdf3]">
      <div className="h-full rounded-md border border-[#3a5db6] shadow-[0_2px_0_#fff,inset_0_1px_0_rgba(255,255,255,.7)] bg-[#dfe9fb] overflow-hidden" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <div className="h-8 px-3 bg-gradient-to-r from-[#2f58b6] via-[#4e7de0] to-[#2f58b6] text-white flex items-center">
          <button onClick={() => navigate(-1)} className="mr-2 text-white/80 hover:text-white">
            <ArrowLeft size={15} />
          </button>
          <img src={MSN_LOGO_URL} alt="MSN" className="w-5 h-5 object-contain mr-2" />
          <span className="font-bold text-xs tracking-wide">EDU Live Messenger - {target.name}</span>
          <div className="ml-auto flex items-center gap-2"><Minus size={13}/><Square size={11}/><X size={13}/></div>
        </div>

        <div className="h-24 px-4 bg-gradient-to-b from-[#c9efff] to-[#edf7ff] border-b border-[#abc0ea] flex items-center gap-4">
          {target.photo ? (
            <img src={target.photo} alt={target.name} className="w-16 h-16 rounded-md object-cover border-4 border-white shadow-[0_0_0_2px_#70c843,0_2px_8px_rgba(0,0,0,.18)]" />
          ) : (
            <div className="w-16 h-16 rounded-md bg-white border-4 border-white shadow-[0_0_0_2px_#70c843,0_2px_8px_rgba(0,0,0,.18)] flex items-center justify-center">
              <MSNAvatar color={target.color} size={48} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-2xl text-[#24436b] leading-tight truncate">{target.name}</h2>
            {target.nickname && <p className="text-sm text-[#2e6da4] truncate -mt-0.5">“{target.nickname}”</p>}
            <p className="text-xs font-bold text-[#4f5f87]">(Online) · Conversa particular</p>
            <p className="text-xs text-[#5c7399] truncate">🔒 Mensagens privadas no EDU Live Messenger</p>
          </div>
        </div>

        <div className="h-[calc(100%-8rem)] flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-white">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center text-[#7182ac]">
                <MSNAvatar color={target.color} size={58} />
                <p className="font-bold text-[#25449c]">Inicie a conversa com {target.name}!</p>
                <p className="text-sm">Suas mensagens são privadas.</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.author_email === session?.email;
              const rawDate = msg.created_date ? new Date(new Date(msg.created_date).getTime() - 3 * 60 * 60 * 1000) : null;
              const time = rawDate ? rawDate.toISOString().slice(11, 16) : '';
              return (
                <div key={msg.id} className="text-[13px] leading-relaxed">
                  <span className="text-[11px] text-[#6f7ba8]">[{time}] </span>
                  <span className="font-bold" style={{ color: isMe ? '#0d5d9a' : target.color }}>
                    {isMe ? 'Você' : msg.author_name}
                  </span>
                  <span className="text-[#1f2937]"> diz:</span>
                  <span className="ml-1 text-[#0f172a]">{msg.content}</span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 border-t border-[#abc0ea] bg-[#edf3ff] p-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Smile size={15} className="text-[#3f62ba]" />
              <div className="flex gap-1 overflow-x-auto">
                {CHAT_EMOJIS.slice(0, 10).map(e => (
                  <button key={e} type="button" onClick={() => setText(prev => `${prev}${e}`)} className="w-7 h-7 border border-[#c8d7f5] bg-white rounded hover:bg-[#f2f7ff] text-sm">{e}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 h-9 px-3 text-sm border border-[#abc0ea] rounded bg-white focus:outline-none"
                placeholder={`Digite uma mensagem para ${target.name}...`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="h-9 px-4 rounded bg-[#4f7de0] text-white text-sm font-semibold disabled:opacity-50"
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