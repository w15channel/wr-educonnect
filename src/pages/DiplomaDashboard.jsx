import React, { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Heart, Send, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import ServicosCard from '@/components/dashboard/ServicosCard';
import LunaDashboardGreetingVoice from '@/components/dashboard/LunaDashboardGreetingVoice';
import useOvercomingWall from '@/hooks/useOvercomingWall';

const DIPLOMA_PREFIX = '/degree/student';

function DiplomaWall({ course, session, onOpenWall }) {
  const wall = useOvercomingWall({ course: course || 'tcc', session, enabled: !!session?.email });
  const [message, setMessage] = useState('');
  const feed = useMemo(() => wall.feed.slice(0, 20), [wall.feed]);
  const onlineClassmates = useMemo(() => wall.accessCodes
    .filter((student) => student.student_email && student.student_email !== session?.email && student.is_active !== false)
    .filter((student) => student.is_online && student.last_seen_at && Date.now() - new Date(student.last_seen_at).getTime() < 90000)
    .slice(0, 8), [wall.accessCodes, session?.email]);

  const publish = async (event) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || wall.sendMessageMutation.isPending) return;
    try {
      await wall.sendMessageMutation.mutateAsync(content);
      setMessage('');
      toast.success('Sua palavra de superação foi publicada!');
    } catch (error) {
      toast.error(error?.message || 'Não foi possível publicar agora.');
    }
  };

  return (
    <section className="bg-card rounded-2xl border border-border p-5 text-left flex flex-col" aria-labelledby="diploma-wall-title">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-rose-500 fill-rose-100" aria-hidden="true" />
            <h2 id="diploma-wall-title" className="text-xs font-bold text-foreground">Mural de superação</h2>
          </div>
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-full">Inspire a turma</span>
        </div>
        <p className="text-[11px] text-muted-foreground">Compartilhe palavras de ânimo. As conquistas recentes da turma aparecem aqui para celebrar cada passo da jornada.</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">Online agora:</span>
          {onlineClassmates.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">sem colegas online no momento</span>
          ) : onlineClassmates.map((student) => (
            <span key={student.id || student.student_email} className="text-[11px] px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700">
              {wall.getStudentName(student.student_email)}
            </span>
          ))}
        </div>
        <button type="button" onClick={onOpenWall} className="block h-48 w-full space-y-2 overflow-y-auto rounded-xl border border-rose-100 bg-gradient-to-b from-rose-50/40 to-secondary/20 p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" aria-label="Abrir o Mural de Superação completo">
          {feed.length === 0 ? (
            <span className="block py-8 text-center text-xs text-muted-foreground">Seja a primeira pessoa a deixar uma palavra de força para a turma.</span>
          ) : feed.map((item) => {
            const content = item.content || item.message;
            const isAchievement = item.feedType === 'achievement';
            return (
              <span key={item.id} className={`block rounded-lg border p-2 text-[11px] leading-relaxed ${isAchievement ? 'border-amber-200 bg-amber-50/80' : item.feedType === 'personal' || item.feedType === 'notification' ? 'border-violet-200 bg-violet-50 text-violet-950' : 'border-border/70 bg-background/85 text-foreground'}`}>
                <span className="flex gap-2">
                  {isAchievement ? <Sparkles size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" /> : item.feedType === 'personal' || item.feedType === 'notification' ? <Bell size={14} className="mt-0.5 shrink-0 text-violet-600" aria-hidden="true" /> : <Heart size={14} className="mt-0.5 shrink-0 text-rose-500" aria-hidden="true" />}
                  <span><strong>{isAchievement ? item.studentName || 'Conquista desbloqueada!' : item.title || wall.getStudentName(item.author_email)}</strong>{' '}{content}</span>
                </span>
              </span>
            );
          })}
        </button>
        <form onSubmit={publish} className="flex items-center gap-2">
          <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Deixe uma palavra de ânimo..." aria-label="Mensagem para o Mural de Superação" className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button type="submit" disabled={!message.trim() || wall.sendMessageMutation.isPending} className="flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            <Send size={12} aria-hidden="true" /> {wall.sendMessageMutation.isPending ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default function DiplomaDashboard() {
  const context = /** @type {any} */ (useOutletContext());
  const session = context?.user;
  const course = context?.course || session?.course;
  const navigate = useNavigate();
  const firstName = (session?.name || 'Estudante').trim().split(/\s+/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const voiceText = `${greeting}, ${firstName}! Eu sou a Luna. Que bom ter você aqui! Antes de começar, confira as notificações no Mural de Superação logo abaixo. Depois, acesse o seu Checklist para dar sequência aos estudos do módulo.`;

  return (
    <div className="app-page max-w-7xl mx-auto space-y-5 animate-fade-in-up pb-20 md:pb-6">
      <header>
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{greeting}, {firstName} 👋</p>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Meu Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
      </header>

      <LunaDashboardGreetingVoice text={voiceText} />
      <section className="luna-welcome-enter bg-gradient-to-br from-violet-500/8 via-fuchsia-500/5 to-amber-500/8 rounded-2xl border border-violet-200/40 p-4 sm:p-5" aria-label="Boas-vindas da Luna">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 luna-bounce-soft shadow-lg shadow-violet-500/20"><span className="text-xl">🦉</span></div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-sm font-bold text-foreground">{greeting}, {firstName}! Eu sou a Luna 🦉</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Que bom ter você aqui! Antes de começar, confira as notificações no <strong>Mural de Superação</strong> logo abaixo — pode haver recados importantes para você. Depois, acesse o seu <strong>Checklist</strong> para dar sequência aos estudos do módulo.</p>
            </div>
            <button type="button" onClick={() => navigate(`${DIPLOMA_PREFIX}/checklist`)} className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"><BookOpen size={12} /> Abrir Checklist</button>
          </div>
        </div>
      </section>

      <DiplomaWall course={course} session={session} onOpenWall={() => navigate(`${DIPLOMA_PREFIX}/chat`)} />
      <ServicosCard expandable />
    </div>
  );
}
