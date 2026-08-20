import React, { useEffect, useState } from 'react';
import { Award, BookOpen, FileText, Heart, Bell, Download } from 'lucide-react';
import { useOutletContext, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const TOTAL_LESSONS = 45;
const TOTAL_TASKS = 45;
const TOTAL_PRACTICE_H = 10;
const REMINDER_KEY = 'cert_last_reminder';

const COURSE_NAMES = {
  tcc: 'Formação de Terapeuta em Terapia Comportamental',
  psicanalise: 'Formação de Terapeutas do Método Psicanalítico',
  sexologia: 'Formação de Terapeutas da Sexualidade Humana',
};

function ProgressBar({ label, icon: Icon, colorClass, current, total, unit, description }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  const done = current >= total;
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${done ? 'bg-accent' : 'bg-secondary'}`}>
          <Icon size={16} className={done ? 'text-primary' : colorClass} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black text-lg text-foreground">
            {current}<span className="text-xs text-muted-foreground font-normal">/{total}{unit}</span>
          </p>
          {done && <span className="text-[10px] font-bold text-primary bg-accent px-2 py-0.5 rounded-full">✓ Concluído</span>}
        </div>
      </div>
      <div className="relative w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${done ? 'bg-accent' : 'bg-gradient-to-r from-primary to-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{pct}% concluído</span>
        <span>Falta: {Math.max(0, total - current)}{unit}</span>
      </div>
    </div>
  );
}

export default function Certificadora() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (isTeacher) return;
    const last = localStorage.getItem(`${REMINDER_KEY}_${session?.email}`);
    if (!last || new Date(last).toDateString() !== new Date().toDateString()) {
      setShowReminder(true);
    }
  }, [session?.email, isTeacher]);

  const dismissReminder = () => {
    localStorage.setItem(`${REMINDER_KEY}_${session?.email}`, new Date().toISOString());
    setShowReminder(false);
  };

  const { data: lessonProgresses = [] } = useQuery({
    queryKey: ['lesson-progress', session?.email],
    queryFn: () => base44.entities.LessonProgress.filter({ student_email: session?.email || '' }, '-created_date', 200),
    enabled: !isTeacher && !!session?.email,
  });

  const { data: taskSubmissions = [] } = useQuery({
    queryKey: ['submissions-cert', session?.email],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: session?.email || '' }, '-created_date', 200),
    enabled: !isTeacher && !!session?.email,
  });

  const { data: therapistPairings = [] } = useQuery({
    queryKey: ['therapist-pairings-cert'],
    queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 200),
    enabled: !isTeacher && !!session?.email,
  });

  const lessonsWatched = lessonProgresses.filter(p => p.watched).length;
  const tasksSubmitted = taskSubmissions.length;
  const practiceCompleted = therapistPairings.filter(p =>
    (p.therapist_email === session?.email && p.therapist_submitted) ||
    (p.patient_email === session?.email && p.patient_submitted)
  ).length;

  const totalPct = isTeacher ? 0 : Math.round(
    ((Math.min(lessonsWatched, TOTAL_LESSONS) / TOTAL_LESSONS) +
      (Math.min(tasksSubmitted, TOTAL_TASKS) / TOTAL_TASKS) +
      (Math.min(practiceCompleted, TOTAL_PRACTICE_H) / TOTAL_PRACTICE_H)) / 3 * 100
  );

  const courseName = COURSE_NAMES[session?.course] || 'Seu Curso';
  const location = useLocation();
  const prefix = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'student' || parts[0] === 'adm') && parts[1]) return `/${parts[0]}/${parts[1]}`;
    return '';
  })();

  const { data: myCerts = [] } = useQuery({
    queryKey: ['my-certs-check', session?.email],
    queryFn: () => base44.entities.CertificateRecord.filter({ student_email: session?.email || '' }, '-created_date', 1),
    enabled: !isTeacher && !!session?.email,
  });
  const hasCertificate = myCerts.length > 0;

  if (isTeacher) {
    return (
      <div className="p-4 lg:p-7 max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg mb-5">
          <Award size={30} className="text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Certificação</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Esta página exibe o progresso de certificação de cada aluno. Os alunos acompanham aqui seus requisitos para obter o certificado do curso.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-3xl mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <Award size={20} className="text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Certificação</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{courseName}</p>
        </div>
      </div>

      {/* Certificate available banner */}
      {hasCertificate && (
        <div className="bg-gradient-to-r from-accent to-accent border border-primary rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Award size={20} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary">🎉 Seu certificado está disponível!</p>
            <p className="text-xs text-primary mt-0.5">O professor já emitiu seu certificado. Clique para visualizar e baixar.</p>
          </div>
          <Link
            to={`${prefix}/meu-certificado`}
            className="inline-flex items-center gap-2 bg-accent hover:bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0"
          >
            <Download size={14} /> Ver certificado
          </Link>
        </div>
      )}

      {/* Overall progress */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-sm text-foreground">Progresso Geral para o Certificado</p>
            <p className="text-xs text-muted-foreground">Conclua todos os requisitos abaixo para obter sua certificação</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-primary">{totalPct}%</p>
            <p className="text-[10px] text-muted-foreground">geral</p>
          </div>
        </div>
        <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-accent transition-all duration-700"
            style={{ width: `${totalPct}%` }}
          />
        </div>
        {totalPct >= 100 && (
          <p className="text-center text-primary font-bold text-sm mt-3">🎉 Parabéns! Você completou todos os requisitos!</p>
        )}
      </div>

      {/* Reminder */}
      {showReminder && (
        <div className="bg-accent border border-primary rounded-xl p-3 flex items-center gap-3">
          <Bell size={16} className="text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-primary">Lembrete diário! 📚</p>
            <p className="text-xs text-primary">Continue estudando e entregando atividades para avançar na certificação.</p>
          </div>
          <button onClick={dismissReminder} className="text-xs text-primary font-semibold border border-primary px-2.5 py-1 rounded-lg shrink-0">Ok!</button>
        </div>
      )}

      {/* 3 progress bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ProgressBar
          label="Aulas Assistidas"
          icon={BookOpen}
          colorClass="text-primary"
          current={lessonsWatched}
          total={TOTAL_LESSONS}
          unit=" aulas"
          description="Assista e marque cada aula como concluída"
        />
        <ProgressBar
          label="Trabalhos Entregues"
          icon={FileText}
          colorClass="text-primary"
          current={tasksSubmitted}
          total={TOTAL_TASKS}
          unit=" trabalhos"
          description="Envie todos os trabalhos e atividades do curso"
        />
        <ProgressBar
          label="Prática Terapêutica"
          icon={Heart}
          colorClass="text-primary"
          current={practiceCompleted}
          total={TOTAL_PRACTICE_H}
          unit="h"
          description="Sessões como terapeuta ou paciente concluídas"
        />
      </div>


      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-sm text-foreground">Emissão de certificado</p>
          <p className="text-xs text-muted-foreground">Disponível ao atingir 80% do progresso geral.</p>
        </div>
        <button
          disabled={totalPct < 80}
          onClick={() => alert('Solicitação enviada! O professor irá analisar e emitir seu certificado em breve.')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Solicitar emissão
        </button>
      </div>

      {/* Info box */}
      <div className="bg-accent border border-primary rounded-xl p-4 text-sm text-primary">
        <p className="font-bold mb-1">Como funciona a certificação?</p>
        <ol className="space-y-1 text-xs text-primary list-decimal list-inside">
          <li>Assista às 60 aulas e marque-as como concluídas (com resumo e comentário)</li>
          <li>Entregue os 60 trabalhos e atividades do curso</li>
          <li>Complete 10 horas de prática terapêutica (Terapeuta da Semana)</li>
          <li>Quando atingir 80% dos requisitos, solicite a emissão do certificado pelo botão abaixo</li>
        </ol>
      </div>
    </div>
  );
}