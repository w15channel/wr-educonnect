import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { saveLunaMemory, loadLunaMemory, clearLunaMemory } from '@/lib/lunaPersona';

const running = (t) => ['pending', 'running', 'in_progress'].includes(t.status);
const errorText = (e) => e?.data?.message || e?.message || 'Não foi possível conectar à Luna.';
export default function useOperationsConversation(session) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState('opening');
  const [error, setError] = useState('');
  const client = useQueryClient();
  const ref = useRef({ mounted: true, opening: null, pending: null, conversation: null, key: null, fingerprint: '' });
  const apply = useCallback((data) => {
    const state = ref.current;
    if (!state.mounted || data?.id && data.id !== state.conversation?.id || !Array.isArray(data?.messages)) return;
    const rows = data.messages;
    const fingerprint = JSON.stringify(rows);
    if (state.fingerprint !== fingerprint) {
      state.fingerprint = fingerprint;
      if (state.pending) state.pending.updatedAt = Date.now();
    }
    state.conversation = { ...state.conversation, ...data, messages: rows };
    const pending = state.pending;
    const received = !pending || rows.filter(m => m.role === 'user').length > pending.userCount;
    setMessages(received ? rows : [...rows, pending.optimistic]);
    const lastUser = rows.reduce((index, row, i) => row.role === 'user' ? i : index, -1);
    const replies = rows.slice(lastUser + 1).filter(m => m.role === 'assistant');
    const tools = replies.flatMap(m => m.tool_calls || []);
    const last = replies[replies.length - 1];
    if (received && last?.content?.trim() && !tools.some(running)) {
      state.pending = null;
      setPhase('ready');
      setError('');
      if (pending && tools.length) client.invalidateQueries({ refetchType: 'none' });
    } else if (received && lastUser >= 0) {
      if (!state.pending) state.pending = { userCount: rows.filter(m => m.role === 'user').length - 1, updatedAt: Date.now(), optimistic: rows[lastUser] };
      if (Date.now() - state.pending.updatedAt < 90000) setPhase('waiting');
    }
  }, [client]);

  const refresh = useCallback(async () => {
    const state = ref.current;
    if (!state.conversation) return;
    const id = state.conversation.id;
    try {
      const data = await base44.agents.getConversation(id);
      if (state.conversation?.id !== id) return;
      apply(data);
    } catch {
      if (!state.mounted || state.conversation?.id !== id || !state.pending) return;
      // Uma oscilação na consulta não interrompe o trabalho: o próximo ciclo
      // continua acompanhando a mesma execução, sem duplicar o pedido.
      setPhase('waiting');
    }
  }, [apply]);

  const startConversation = useCallback(() => {
    const state = ref.current;
    if (state.opening || state.pending) return state.opening;
    setPhase('opening'); setError('');
    state.opening = (async () => {
      try {
        if (!await base44.auth.isAuthenticated()) { setPhase('login'); return; }
        const user = await base44.auth.me();
        if (user.role !== 'admin') { setPhase('denied'); return; }
        state.key = `luna-operations:${user.id}:${session?.course || 'tcc'}`;
        const saved = loadLunaMemory(state.key);
        const conv = saved ? await base44.agents.getConversation(saved) : await base44.agents.createConversation({
          agent_name: 'luna_operations',
          metadata: { name: `Operações · ${new Date().toLocaleString('pt-BR')}`, description: 'Pedidos administrativos do WR-EDU' },
        });
        if (!state.mounted) return;
        state.conversation = conv; state.fingerprint = '';
        saveLunaMemory(state.key, conv.id);
        setConversation(conv); setPhase('ready'); apply(conv);
      } catch (e) { if (state.mounted) { setError(errorText(e)); setPhase('error'); } }
      finally { state.opening = null; }
    })();
    return state.opening;
  }, [session?.course, apply]);

  useEffect(() => { ref.current.mounted = true; startConversation(); return () => { ref.current.mounted = false; }; }, [startConversation]);
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, apply);
    refresh();
    let checking = false;
    const timer = setInterval(async () => {
      if (checking || !ref.current.pending) return;
      checking = true;
      try { await refresh(); } finally { checking = false; }
    }, 5000);
    return () => { unsubscribe(); clearInterval(timer); };
  }, [conversation?.id, apply, refresh]);

  const send = async (text) => {
    const state = ref.current;
    if (!text?.trim() || !state.conversation || state.pending) return false;
    const current = state.conversation;
    const rows = current.messages || [];
    const content = rows.length ? text.trim() : `[Contexto administrativo]\nAdministrador: ${session?.name || ''}; e-mail: ${session?.email || ''}; turma: ${session?.course || 'tcc'}. Use o e-mail para admin_email e reviewed_by.\n[/Contexto administrativo]\n\n${text.trim()}`;
    const optimistic = { id: `local-${Date.now()}`, role: 'user', content };
    state.pending = { userCount: rows.filter(m => m.role === 'user').length, updatedAt: Date.now(), optimistic };
    setMessages([...rows, optimistic]); setError(''); setPhase('sending');
    try {
      await base44.agents.addMessage(current, { role: 'user', content });
      if (!state.mounted || state.conversation?.id !== current.id) return true;
      if (state.pending) setPhase('waiting');
      await refresh();
    } catch (e) {
      if (!state.mounted || state.conversation?.id !== current.id) return false;
      const status = e?.status || e?.response?.status;
      if ([400, 401, 403, 404, 422, 429].includes(status)) {
        state.pending = null; setMessages(rows); setPhase('error');
        setError(`Pedido recusado: ${errorText(e)}`);
      } else {
        // O servidor pode ter aceitado o pedido antes da queda da resposta.
        // Mantemos a execução pendente e consultamos o mesmo processo até concluir.
        setPhase('waiting');
        window.setTimeout(() => refresh(), 1500);
        return true;
      }
      return false;
    }
    return true;
  };
  const newConversation = () => {
    if (ref.current.pending) return;
    if (ref.current.key) clearLunaMemory(ref.current.key);
    ref.current.conversation = null; setConversation(null); setMessages([]); startConversation();
  };
  return { conversation, messages, phase, error, send, refresh, newConversation, retry: startConversation,
    busy: ['opening', 'sending', 'waiting'].includes(phase),
    canSend: !!conversation && ['ready', 'error'].includes(phase) };
}