import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ArrowLeft } from 'lucide-react';

const DM_PREFIX = 'dm_';

function getDMSessionId(emailA, emailB) {
  const sorted = [emailA, emailB].sort();
  return `${DM_PREFIX}${sorted[0]}_${sorted[1]}`;
}

function MSNAvatar({ isMe, size = 28 }) {
  const color = isMe ? '#f97316' : '#3b82f6';
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

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
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
    return {
      name: code?.profile_name || code?.student_name || dec,
      color: code?.profile_avatar_color || '#3b82f6',
      photo: code?.profile_photo_url,
    };
  };

  const target = getTargetInfo();

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

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-gradient-to-r from-[#1e3a8a] via-[#3b5ef4] to-[#5b5ef4] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white p-1 rounded-lg transition-colors">
          <ArrowLeft size={18} />
        </button>
        <MSNAvatar isMe={false} size={36} />
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{target.name}</p>
          <p className="text-white/50 text-[10px]">Mensagem Privada · WR-EDU</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#f0f4fb] space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MSNAvatar isMe={false} size={48} />
            <p className="text-[#5b5ef4] font-bold">Inicie a conversa com {target.name}!</p>
            <p className="text-gray-400 text-sm">Suas mensagens são privadas.</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.author_email === session?.email;
          const rawDate = msg.created_date ? new Date(new Date(msg.created_date).getTime() - 3 * 60 * 60 * 1000) : null;
          const time = rawDate ? rawDate.toISOString().slice(11, 16) : '';
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <MSNAvatar isMe={isMe} size={28} />
              <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && <span className="text-[10px] font-bold mb-0.5 ml-1 text-[#3b82f6]">{msg.author_name}</span>}
                <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${isMe ? 'rounded-br-sm bg-gradient-to-br from-[#5b5ef4] to-[#7c5ef4] text-white' : 'rounded-bl-sm bg-white border border-gray-200 text-gray-800'}`}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5 mx-1">{time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-border p-3">
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#5b5ef4]/50 focus:bg-white transition-all"
            placeholder={`Mensagem para ${target.name}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="p-2.5 bg-gradient-to-br from-[#5b5ef4] to-[#7c5ef4] text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-all shrink-0 shadow-sm"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[9px] text-gray-300 text-center mt-1.5 font-mono">🔒 Mensagem privada · WR-EDU</p>
      </div>
    </div>
  );
}