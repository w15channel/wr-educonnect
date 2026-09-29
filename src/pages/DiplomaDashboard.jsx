import React, { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, MessageCircle, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ServicosCard from '@/components/dashboard/ServicosCard';
import useOvercomingWall from '@/hooks/useOvercomingWall';

const DIPLOMA_PREFIX = '/degree/student';

function BrowserGreetingReader({ greeting }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechAvailable = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance !== 'undefined';

  const readGreeting = () => {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(greeting);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={readGreeting}
      disabled={!speechAvailable || isSpeaking}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-background/80 px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-200 dark:hover:bg-violet-950/30"
      aria-label={isSpeaking ? 'Lendo a saudação' : 'Ouvir saudação com o leitor do navegador'}
      title={speechAvailable ? 'Ouvir saudação' : 'Leitor de texto indisponível neste navegador'}
    >
      <Volume2 size={16} aria-hidden="true" />
      <span>{isSpeaking ? 'Lendo...' : 'Ouvir saudação'}</span>
    </button>
  );
}

function WallPreview({ course, session, onOpenWall }) {
  const wall = useOvercomingWall({ course: course || 'tcc', session, enabled: !!session?.email });
  const latestMessages = useMemo(() => wall.feed
    .filter((item) => item.feedType === 'encouragement')
    .slice(0, 5), [wall.feed]);

  return (
    <section className="overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-violet-50 shadow-sm dark:from-rose-950/20 dark:to-violet-950/20" aria-labelledby="wall-preview-title">
      <div className="flex items-center gap-3 border-b border-rose-200/70 p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20">
          <Heart size={20} fill="currentColor" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="wall-preview-title" className="font-bold text-foreground">Mural de Superação</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Deslize para acompanhar as mensagens mais recentes da turma.</p>
        </div>
        <button type="button" onClick={onOpenWall} className="hidden min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 sm:inline-flex dark:text-rose-200 dark:hover:bg-rose-950/40">
          Abrir mural <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-4 [scrollbar-width:thin]" aria-label="Últimas mensagens de superação">
        {latestMessages.length > 0 ? latestMessages.map((message) => (
          <button
            type="button"
            key={message.id}
            onClick={onOpenWall}
            className="min-h-36 w-[82%] shrink-0 snap-start rounded-2xl border border-white/80 bg-background/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:w-[46%] lg:w-[31%]"
            aria-label={`Abrir no Mural de Superação: ${message.content || 'mensagem'}`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-200">
              <MessageCircle size={14} aria-hidden="true" />
              <span className="truncate">{wall.getStudentName(message.author_email) || message.author_name || 'Turma'}</span>
            </div>
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-foreground">{message.content}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">Interagir no mural <ArrowRight size={11} aria-hidden="true" /></span>
          </button>
        )) : (
          <button type="button" onClick={onOpenWall} className="min-h-32 w-full snap-start rounded-2xl border border-dashed border-rose-300 bg-background/70 p-5 text-center text-sm text-muted-foreground hover:bg-background">
            Ainda não há mensagens recentes. Acesse o mural e seja a primeira pessoa a compartilhar uma palavra de superação.
          </button>
        )}
      </div>
      <button type="button" onClick={onOpenWall} className="mx-4 mb-4 flex min-h-11 w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 text-sm font-bold text-white transition-colors hover:bg-rose-600 sm:hidden">
        Abrir Mural de Superação <ArrowRight size={15} aria-hidden="true" />
      </button>
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
  const periodGreeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greeting = `${periodGreeting}, ${firstName}!`;

  return (
    <div className="app-page app-page--narrow space-y-5 animate-fade-in-up pb-20 md:pb-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <section className="rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-amber-500/10 p-4 sm:p-5" aria-labelledby="diploma-greeting">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 id="diploma-greeting" className="text-2xl font-bold text-foreground">{greeting}</h1>
          <BrowserGreetingReader greeting={greeting} />
        </div>
      </section>

      <WallPreview course={course} session={session} onOpenWall={() => navigate(`${DIPLOMA_PREFIX}/chat`)} />

      <ServicosCard />
    </div>
  );
}
