import React, { useEffect, useRef, useState } from 'react';
import useOperationsConversation from '@/components/luna/useOperationsConversation';
import OperationsStatus from '@/components/luna/OperationsStatus';
import { Send, Plus, Briefcase, Volume2, VolumeX, MessageCircle, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import OperationsMessage from '@/components/luna/OperationsMessage';
import useLunaVoice from '@/hooks/useLunaVoice';
import { LUNA_TOOL_PATHS } from '@/lib/lunaPersona';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { getDMSessionId, LUNA_DM_EMAIL, LUNA_DM_NAME } from '@/lib/lunaDM';

const QUICK = [
  'Vamos conversar sobre melhorias na plataforma',
  'Ajude a planejar ajustes, sem aplicar mudanças',
  'Que melhorias você sugere com base nesta conversa?',
  'Liste os chamados de suporte abertos',
];

const APP_BASE_URL = 'https://base44.app/apps/69f55577840a3c93cee191be';

// ── Modal de Mensagens no Chat Particular ────────────────────────────────────
// Permite ao admin enviar mensagens personalizadas com link de acesso direto
// e redirect para qualquer página do site, usando o código único de cada aluno.
// As mensagens são entregues no chat particular (DM) de cada aluno — não no
// feed público do mural de superação — garantindo privacidade da comunicação.
function QuickMessagesModal({ session, onClose }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [redirectKey, setRedirectKey] = useState('checklist');
  const [includeProfileReminder, setIncludeProfileReminder] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const codes = await base44.entities.AccessCode.filter(
          { is_active: true }, 'student_name', 500
        );
        const adminEmail = (session?.email || '').toLowerCase();
        const filtered = codes.filter(c =>
          c.student_email &&
          c.student_email.toLowerCase() !== adminEmail &&
          c.student_email !== 'suporteti@edu.com'
        );
        setStudents(filtered);
        setSelectedEmails(new Set(filtered.map(s => s.student_email)));
      } catch {
        toast.error('Não foi possível carregar a lista de alunos.');
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.email]);

  const toggleStudent = (email) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEmails.size === students.length) setSelectedEmails(new Set());
    else setSelectedEmails(new Set(students.map(s => s.student_email)));
  };

  const buildLink = (code) => {
    const redirect = LUNA_TOOL_PATHS[redirectKey] || '/checklist';
    return `${APP_BASE_URL}/?acesso=${encodeURIComponent(code)}&redirect=${redirect}`;
  };

  const profileIncomplete = (s) => !s.profile_bio && !s.profile_photo_url && !s.profile_name;

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Preencha o título e a mensagem.'); return; }
    if (selectedEmails.size === 0) { toast.error('Selecione pelo menos um aluno.'); return; }
    setSending(true);
    let success = 0, failed = 0;
    const adminEmail = session?.email || '';
    const distributionId = `luna-${Date.now()}`;
    for (const student of students) {
      if (!selectedEmails.has(student.student_email)) continue;
      try {
        const link = buildLink(student.code);
        let fullContent = `${title.trim()}\n\n${content}`;
        fullContent += `\n\n👉 Acesse agora:\n${link}`;
        if (includeProfileReminder && profileIncomplete(student)) {
          fullContent += '\n\n📋 Ah, e não esqueça: seu perfil ainda está incompleto! Quando entrar, passe na página "Perfil" no menu e adicione sua foto, bio e apelido.';
        }
        const sessionId = getDMSessionId(LUNA_DM_EMAIL, student.student_email);
        await base44.entities.ChatMessage.create({
          session_id: sessionId,
          author_name: LUNA_DM_NAME,
          author_email: LUNA_DM_EMAIL,
          content: fullContent,
          is_hand_raised: false,
          is_luna_distribution: true,
          distributed_by: adminEmail,
          distribution_id: distributionId,
        });
        await base44.entities.Notification.create({
          recipient_email: student.student_email,
          sender_email: LUNA_DM_EMAIL,
          sender_name: LUNA_DM_NAME,
          message: `Você recebeu uma mensagem particular da Luna: "${title.trim()}"`,
          type: 'wall_reply',
        });
        success++;
      } catch { failed++; }
    }
    setSending(false);
    if (success > 0) toast.success(`${success} mensagem(s) enviada(s) no chat particular!`);
    if (failed > 0) toast.error(`${failed} mensagem(s) falharam.`);
    if (failed === 0 && success > 0) onClose();
  };

  const redirectOptions = Object.entries(LUNA_TOOL_PATHS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-card border border-border shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-rose-500" />
            <h3 className="font-bold text-foreground">Mensagens no Chat Particular</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 dark:border-violet-800 dark:bg-violet-950/30">
            <MessageCircle size={14} className="shrink-0 text-violet-600" />
            <p className="text-[11px] text-violet-700 dark:text-violet-300">As mensagens são entregues no chat particular de cada aluno — não aparecem no mural de superação.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Título da mensagem</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Novidade da semana!" className="h-10" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mensagem</label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Escreva a mensagem que os alunos receberão no chat particular..." className="min-h-[120px]" />
            <p className="mt-1 text-[10px] text-muted-foreground">O link de acesso com redirect será adicionado automaticamente ao final de cada mensagem.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Página de destino do link</label>
            <select value={redirectKey} onChange={e => setRedirectKey(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-background text-foreground text-sm px-3">
              {redirectOptions.map(([key, path]) => (
                <option key={key} value={key}>{key} → {path}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeProfileReminder} onChange={e => setIncludeProfileReminder(e.target.checked)} className="h-4 w-4 rounded" />
            <span className="text-sm text-muted-foreground">Adicionar lembrete de perfil para alunos sem perfil completo</span>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground">Destinatários ({selectedEmails.size}/{students.length})</label>
              <button onClick={toggleAll} className="text-[11px] font-semibold text-rose-500 hover:underline">
                {selectedEmails.size === students.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={14} className="animate-spin" /> Carregando alunos...</div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {students.map(s => {
                  const incomplete = profileIncomplete(s);
                  return (
                    <label key={s.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50">
                      <input type="checkbox" checked={selectedEmails.has(s.student_email)} onChange={() => toggleStudent(s.student_email)} className="h-4 w-4 rounded shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{s.profile_name || s.student_name || s.student_email}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.student_email}</p>
                      </div>
                      {incomplete && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Sem perfil</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-[10px] text-muted-foreground">As mensagens vão para o chat particular de cada aluno com link de acesso + redirect automático.</p>
          <Button onClick={handleSend} disabled={sending || !title.trim() || !content.trim() || selectedEmails.size === 0} className="gap-2">
            {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
            {sending ? 'Enviando...' : `Enviar para ${selectedEmails.size} aluno(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Sala de comando da Luna — a gerente de operações executa ordens do admin. */
export default function OperationsChat({ session }) {
  const operations = useOperationsConversation(session);
  const { conversation, messages, phase, busy, canSend, newConversation } = operations;
  const voice = useLunaVoice();
  const [input, setInput] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const endRef = useRef(null);
  const dictationRef = useRef(null);
  const spokenRef = useRef({ conversationId: null, fingerprint: '' });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, phase]);
  useEffect(() => {
    const assistants = messages.filter((message) => message.role === 'assistant' && message.content?.trim());
    const latest = assistants[assistants.length - 1];
    const fingerprint = latest ? `${latest.id || ''}:${latest.content}` : '';
    if (spokenRef.current.conversationId !== conversation?.id) {
      spokenRef.current = { conversationId: conversation?.id || null, fingerprint };
      return;
    }
    if (phase === 'ready' && fingerprint && spokenRef.current.fingerprint !== fingerprint) {
      spokenRef.current.fingerprint = fingerprint;
      voice.speak(latest.content);
    }
  }, [conversation?.id, messages, phase, voice.speak]);
  const send = async (content = input) => {
    const text = String(content || '').trim();
    if (!text || !canSend) return;
    dictationRef.current?.stop();
    setInput('');
    voice.stop();
    if (!await operations.send(text)) setInput(value => value || text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background dark:bg-black">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-rose-100 bg-card dark:border-white/20 dark:bg-black px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"><Briefcase size={17} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-foreground dark:text-white">Luna · Gerente de Operações</p>
          <p className="truncate text-[11px] text-muted-foreground">IA Base44 · Edição do site e gestão de dados</p>
        </div>
        <button
          onClick={() => setShowQuickMessages(true)}
          title="Mensagens no chat particular"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-white/10"
        >
          <MessageCircle size={15} />
        </button>
        <button
          onClick={voice.toggle}
          title={voice.enabled ? 'Desligar voz da Luna' : 'Ligar voz da Luna'}
          className={`rounded-xl p-2 transition-colors ${voice.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'text-muted-foreground hover:bg-secondary'}`}
        >
          {voice.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
        <button onClick={() => { voice.stop(); newConversation(); }} disabled={busy} title="Nova sessão" className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 bg-gradient-to-b from-rose-50/40 to-secondary/20 dark:from-black dark:to-black">
        {conversation && messages.length === 0 && <p className="text-sm text-muted-foreground">Vamos conversar? Podemos debater ideias, escrever, planejar melhorias ou executar uma operação autorizada. Planejar não altera dados.</p>}
        {messages.map((message, index) => <OperationsMessage key={message.id || index} message={message} />)}
        <OperationsStatus {...operations} />
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-rose-100 bg-rose-50/20 dark:border-white/20 dark:bg-black px-3 py-2">
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-invisible">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={!canSend} className="shrink-0 whitespace-nowrap rounded-xl border border-rose-200 dark:border-white/20 bg-background dark:bg-black px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-rose-50 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white disabled:opacity-50">
              {q}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex shrink-0 gap-2 border-t border-rose-100 bg-card dark:border-white/20 dark:bg-black p-3">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Converse, peça um plano ou solicite uma ação..." className="h-11 flex-1 border-rose-200 dark:border-white/20" disabled={!canSend} />
        <VoiceDictationButton ref={dictationRef} value={input} onChange={setInput} className="h-11 w-11" />
        <Button type="submit" className="h-11 w-11 shrink-0 p-0 bg-rose-500 hover:bg-rose-600" disabled={!input.trim() || !canSend}><Send size={16} /></Button>
      </form>
      <p className="shrink-0 pb-2 text-center text-[10px] text-muted-foreground">
        IA Base44 com consumo de créditos de integração. Ações destrutivas exigem confirmação por segurança.
      </p>

      {showQuickMessages && <QuickMessagesModal session={session} onClose={() => setShowQuickMessages(false)} />}
    </div>
  );
}