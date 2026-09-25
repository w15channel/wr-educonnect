import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowRight, CheckCircle2, Flame, GraduationCap, History, ScrollText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PREFIX = '/degree/student';

export default function DiplomaDashboard() {
  const { user: session, course } = useOutletContext();
  const navigate = useNavigate();
  const userCourse = course || session?.course || 'tcc';
  const firstName = (session?.name || 'Estudante').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams-diploma', userCourse],
    queryFn: () => base44.entities.Exam.filter(
      { course: userCourse, is_published: true },
      '-created_date',
      300,
    ),
  });

  const identities = [session?.email, session?.code]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const { data: submissions = [] } = useQuery({
    queryKey: ['exam-submissions-diploma', userCourse, identities.join('|')],
    queryFn: async () => {
      const records = await base44.entities.ExamSubmission.filter(
        { course: userCourse },
        '-submitted_at',
        1000,
      );
      return records.filter((record) =>
        identities.includes(String(record.student_email || '').trim().toLowerCase()),
      );
    },
    enabled: identities.length > 0 && exams.length > 0,
  });

  const visibleExams = exams.filter((exam) => !exam.is_hidden);
  const submittedIds = new Set(submissions.map((submission) => submission.exam_id));
  const completed = visibleExams.filter((exam) => submittedIds.has(exam.id)).length;
  const pending = Math.max(visibleExams.length - completed, 0);
  const progress = visibleExams.length ? Math.round((completed / visibleExams.length) * 100) : 0;

  return (
    <div className="app-page app-page--narrow space-y-5 animate-fade-in-up pb-24 md:pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
          Modo simplificado
        </p>
        <h1 className="text-2xl font-bold text-foreground">{greeting}, {firstName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })} · Sua jornada até o diploma
        </p>
      </header>

      <button
        onClick={() => navigate(`${PREFIX}/exams`)}
        className="w-full text-left bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <GraduationCap size={22} className="text-violet-500" />
            </span>
            <div>
              <h2 className="font-bold text-foreground">Progresso nas provas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? 'Carregando…' : `${completed} de ${visibleExams.length} concluídas`}
              </p>
            </div>
          </div>
          <span className="text-2xl font-black text-primary">{progress}%</span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate(`${PREFIX}/exams`)} className="bg-card rounded-2xl border border-border p-4 text-left hover:border-violet-400/40 transition-colors">
          <GraduationCap size={20} className="text-violet-500 mb-4" />
          <p className="text-2xl font-black text-foreground">{pending}</p>
          <p className="text-xs text-muted-foreground">Provas pendentes</p>
        </button>
        <button onClick={() => navigate(`${PREFIX}/ofensivas`)} className="bg-card rounded-2xl border border-border p-4 text-left hover:border-orange-400/40 transition-colors">
          <Flame size={20} className="text-orange-500 mb-4" />
          <p className="font-bold text-foreground">Ofensiva diária</p>
          <p className="text-xs text-muted-foreground mt-1">Mantenha sua sequência</p>
        </button>
      </div>

      {pending > 0 ? (
        <button onClick={() => navigate(`${PREFIX}/exams`)} className="w-full flex items-center gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 text-left hover:bg-violet-100/70 transition-colors">
          <span className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <GraduationCap size={17} className="text-violet-600" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-violet-800">Continuar pelas provas</p>
            <p className="text-xs text-violet-600">{pending} {pending === 1 ? 'avaliação disponível' : 'avaliações disponíveis'}</p>
          </div>
          <ArrowRight size={16} className="text-violet-500" />
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <CheckCircle2 size={22} className="text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Provas em dia</p>
            <p className="text-xs text-emerald-600">Novas avaliações aparecerão aqui quando forem liberadas.</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate(`${PREFIX}/apostila`)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors">
            <ScrollText size={18} className="text-emerald-500" />
            <span className="text-sm font-semibold">Apostila</span>
          </button>
          <button onClick={() => navigate(`${PREFIX}/historico`)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors">
            <History size={18} className="text-cyan-500" />
            <span className="text-sm font-semibold">Histórico</span>
          </button>
        </div>
      </section>
    </div>
  );
}
