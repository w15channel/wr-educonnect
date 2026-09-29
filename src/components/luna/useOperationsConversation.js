import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { invokePollinations } from '@/lib/pollinationsAI';

const STORAGE_PREFIX = 'luna-operations-pollinations:';
const SYSTEM_CONTEXT = `Você é Luna, Gerente de Operações do WR-EDU. Responda em português do Brasil com clareza, iniciativa, segurança e foco prático. Ajude a diagnosticar, planejar e redigir procedimentos para cursos de TC, psicanálise e sexologia. Durante esta contingência você não possui ferramentas para consultar nem alterar dados: nunca invente consultas ou confirme ações. Para pedidos de execução, entregue os passos exatos e informe objetivamente que a aplicação precisa ser feita pelos controles administrativos do portal. Não exponha dados pessoais nem solicite segredos.`;

function storageKey(session) {
  return `${STORAGE_PREFIX}${session?.email || 'admin'}:${session?.course || 'tcc'}`;
}

export default function useOperationsConversation(session) {
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('opening');
  const [error, setError] = useState('');
  const key = storageKey(session);

  const startConversation = useCallback(async () => {
    setPhase('opening'); setError('');
    try {
      if (!await base44.auth.isAuthenticated()) { setPhase('login'); return; }
      const user = await base44.auth.me();
      if (user.role !== 'admin') { setPhase('denied'); return; }
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      setMessages(Array.isArray(saved) ? saved : []);
      setPhase('ready');
    } catch (e) {
      setError(e?.message || 'Não foi possível conectar à Luna.');
      setPhase('error');
    }
  }, [key]);

  useEffect(() => { startConversation(); }, [startConversation]);
  useEffect(() => {
    if (phase !== 'opening') localStorage.setItem(key, JSON.stringify(messages.slice(-30)));
  }, [key, messages, phase]);

  const send = async (text) => {
    if (!text?.trim() || !['ready', 'error'].includes(phase)) return false;
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: text.trim() };
    const next = [...messages, userMessage];
    setMessages(next); setError(''); setPhase('sending');
    try {
      const history = next.slice(-12).map((message) => `${message.role === 'user' ? 'Administrador' : 'Luna'}: ${message.content}`).join('\n');
      const answer = await invokePollinations({ prompt: `${SYSTEM_CONTEXT}\n\nContexto: administrador ${session?.name || ''}; curso ${session?.course || 'tcc'}.\n\nConversa recente:\n${history}\n\nLuna:` });
      setMessages([...next, { id: `assistant-${Date.now()}`, role: 'assistant', content: answer }]);
      setPhase('ready');
      return true;
    } catch (e) {
      setError(e?.message || 'Não foi possível conectar à Luna.');
      setPhase('error');
      return false;
    }
  };

  const newConversation = () => {
    localStorage.removeItem(key);
    setMessages([]); setError(''); setPhase('ready');
  };

  return {
    conversation: { id: key, provider: 'pollinations' }, messages, phase, error, send,
    refresh: async () => {}, newConversation, retry: startConversation,
    busy: ['opening', 'sending'].includes(phase),
    canSend: ['ready', 'error'].includes(phase),
  };
}
