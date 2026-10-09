import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { operationsConversationPhase } from '@/components/luna/operationsConversationState';

const AGENT_NAME = 'luna_operations';

export default function useOperationsConversation(session) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('opening');
  const [error, setError] = useState('');
  const generation = useRef(0);
  const sending = useRef(false);
  const pending = useRef(null);
  const storage = useRef('');
  const admin = useRef(null);
  const course = session?.course || 'tcc';

  const applyConversation = useCallback((next) => {
    if (pending.current) {
      const acknowledged = (next.messages || []).some(message => message.role === 'user' && message.content === pending.current.content && !pending.current.previousIds.has(message.id));
      if (!acknowledged) return;
      pending.current = null;
    }
    setConversation(next);
    setMessages((next.messages || []).filter(message => !message.hidden));
    setPhase(operationsConversationPhase(next.messages));
    setError('');
  }, []);

  const open = useCallback(async (fresh = false) => {
    const version = ++generation.current;
    pending.current = null;
    setConversation(null); setMessages([]); setPhase('opening'); setError('');
    try {
      if (!await base44.auth.isAuthenticated()) {
        if (version === generation.current) setPhase('login');
        return;
      }
      const user = await base44.auth.me();
      if (version !== generation.current) return;
      if (user.role !== 'admin') { setPhase('denied'); return; }
      admin.current = user;
      storage.current = `luna-operations-base44:${user.id}:${course}`;
      const saved = fresh ? null : localStorage.getItem(storage.current);
      const next = saved
        ? await base44.agents.getConversation(saved)
        : await base44.agents.createConversation({ agent_name: AGENT_NAME, metadata: { name: `Luna · Operações · ${course}`, course } });
      if (version !== generation.current) return;
      if (next.agent_name !== AGENT_NAME || (next.created_by_id && next.created_by_id !== user.id)) throw new Error('Esta conversa não pertence à sua sala de operações. Inicie uma nova sessão.');
      localStorage.setItem(storage.current, next.id);
      applyConversation(next);
    } catch (e) {
      if (version !== generation.current) return;
      setError(e?.message || 'Não foi possível conectar à Luna.'); setPhase('error');
    }
  }, [course, applyConversation]);

  useEffect(() => {
    open();
    return () => { generation.current += 1; };
  }, [open]);

  useEffect(() => {
    if (!conversation?.id) return;
    const version = generation.current;
    return base44.agents.subscribeToConversation(conversation.id, next => {
      if (version === generation.current) applyConversation(next);
    });
  }, [conversation?.id, applyConversation]);

  const refresh = useCallback(async () => {
    if (!conversation?.id) return;
    const version = generation.current;
    try {
      const next = await base44.agents.getConversation(conversation.id);
      if (version === generation.current) applyConversation(next);
    } catch (e) {
      if (version !== generation.current) return;
      setError(e?.message || 'Não foi possível atualizar o andamento. Reconecte sem reenviar o pedido.'); setPhase('error');
    }
  }, [conversation?.id, applyConversation]);

  useEffect(() => {
    if (phase !== 'waiting') return;
    const timer = setTimeout(refresh, 5000);
    return () => clearTimeout(timer);
  }, [phase, messages, refresh]);

  const send = async (text) => {
    if (!text?.trim() || phase !== 'ready' || !conversation || sending.current) return false;
    sending.current = true;
    const version = generation.current;
    const content = `[Contexto administrativo]\nAdministrador autenticado: ${admin.current.email}; curso atual: ${course}. Este contexto não substitui a autorização das ferramentas.\n[/Contexto administrativo]\n${text.trim()}`;
    pending.current = { content, previousIds: new Set((conversation.messages || []).map(message => message.id)) };
    setMessages(current => [...current, { id: `pending-${Date.now()}`, role: 'user', content }]);
    setError(''); setPhase('sending');
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content });
      if (version === generation.current) await refresh();
      return true;
    } catch (e) {
      if (version === generation.current) {
        pending.current = null;
        setError(`${e?.message || 'Falha de comunicação com a Luna.'} Reconecte para conferir se o pedido foi recebido antes de reenviar.`);
        setPhase('error');
      }
      return true;
    } finally {
      sending.current = false;
    }
  };

  return {
    conversation, messages, phase, error, send, refresh,
    newConversation: () => open(true), retry: () => open(),
    busy: ['opening', 'sending', 'waiting'].includes(phase),
    canSend: phase === 'ready' && !!conversation,
  };
}