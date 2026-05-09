import React, { useEffect, useState } from 'react';
import { Award, BookOpen, FileText, Heart, Video, Bell, Info, ExternalLink } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CERT_URL = 'https://www.venes.com.br/cursos/informacoes/434?_c_=434';
const TOTAL_LESSONS = 60;
const TOTAL_TASKS = 60;
const TOTAL_PRACTICE_H = 10;
const TOTAL_LIVES_H = 5;
const REMINDER_KEY = 'cert_last_reminder';

function ProgressBar({ label, icon: Icon, colorClass, current, total, unit, description }) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  const done = current >= total;
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${done ? 'bg-green-100' : 'bg-secondary'}`}>
          <Icon size={16} className={done ? 'text-green-600' : colorClass} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black text-lg text-foreground">
            {current}<span className="text-xs text-muted-foreground font-normal">/{total}{unit}</span>
          </p>
          {done && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Concluído</span>}
        </div>
      </div>
      <div className="relative w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${done ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-accent'}`}
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
  const [showGuide, setShowGuide] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const last = localStorage.getItem(`${REMINDER_KEY}_${session?.email}`);
    if (!last || new Date(last).toDateString() !== new Date().toDateString()) {
      setShowReminder(true);
    }
  }, []);

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

  const { data: liveAttendances = [] } = useQuery({
    queryKey: ['my-attendances-cert', session?.email],
    queryFn: () => base44.entities.LiveAttendance.filter({ student_email: session?.email || '' }, '-created_date', 100),
    enabled: !isTeacher && !!session?.email,
  });

  const lessonsWatched = lessonProgresses.filter(p => p.watched).length;
  const tasksSubmitted = taskSubmissions.length;
  const practiceCompleted = therapistPairings.filter(p =>
    (p.therapist_email === session?.email && p.therapist_submitted) ||
    (p.patient_email === session?.email && p.patient_submitted)
  ).length;
  const livesConfirmed = liveAttendances.length;

  const totalPct = Math.round(
    ((Math.min(lessonsWatched, TOTAL_LESSONS) / TOTAL_LESSONS) +
      (Math.min(tasksSubmitted, TOTAL_TASKS) / TOTAL_TASKS) +
      (Math.min(practiceCompleted, TOTAL_PRACTICE_H) / TOTAL_PRACTICE_H) +
      (Math.min(livesConfirmed, TOTAL_LIVES_H) / TOTAL_LIVES_H)) / 4 * 100
  );

  return (
    <div className="flex flex-col bg-background" style={{ height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3 shrink-0 flex-wrap gap-y-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
          <Award size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm text-foreground">Certificação</h2>
          <p className="text-xs text-muted-foreground">Portal VENES — Certificação oficial do curso</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-xl hover:bg-primary/10 transition-colors font-semibold"
          >
            <Info size={13} /> Como usar
          </button>
          <a href={CERT_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors">
            <ExternalLink size={13} /> Nova aba
          </a>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {/* Progress — students only */}
        {!isTeacher && (
          <div className="p-4 space-y-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">Progresso para Certificação</p>
                <p className="text-xs text-muted-foreground">Conclua todos os requisitos para obter o certificado</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-primary">{totalPct}%</p>
                <p className="text-[10px] text-muted-foreground">geral</p>
              </div>
            </div>
            <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-green-500 transition-all duration-700"
                style={{ width: `${totalPct}%` }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <ProgressBar
                label="Aulas Assistidas"
                icon={BookOpen}
                colorClass="text-purple-500"
                current={lessonsWatched}
                total={TOTAL_LESSONS}
                unit=" aulas"
                description="Assista e marque cada aula como concluída"
              />
              <ProgressBar
                label="Trabalhos Entregues"
                icon={FileText}
                colorClass="text-orange-500"
                current={tasksSubmitted}
                total={TOTAL_TASKS}
                unit=" trabalhos"
                description="Envie todos os trabalhos e atividades do curso"
              />
              <ProgressBar
                label="Prática Terapêutica"
                icon={Heart}
                colorClass="text-pink-500"
                current={practiceCompleted}
                total={TOTAL_PRACTICE_H}
                unit="h"
                description="Sessões como terapeuta ou paciente concluídas"
              />
              <ProgressBar
                label="Horas em Lives"
                icon={Video}
                colorClass="text-red-500"
                current={livesConfirmed}
                total={TOTAL_LIVES_H}
                unit="h"
                description="Confirme presença nas aulas ao vivo"
              />
            </div>
            {showReminder && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Bell size={16} className="text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-800">Lembrete diário! 📚</p>
                  <p className="text-xs text-amber-700">Não esqueça de estudar na Unidade Certificadora hoje.</p>
                </div>
                <button onClick={dismissReminder} className="text-xs text-amber-600 font-semibold border border-amber-300 px-2.5 py-1 rounded-lg shrink-0">Ok!</button>
              </div>
            )}
          </div>
        )}

        {/* How-to guide */}
        {showGuide && (
          <div className="mx-4 mt-3 bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-primary" />
              <h3 className="font-bold text-sm text-foreground">Como estudar na plataforma certificadora</h3>
            </div>
            <ol className="space-y-2">
              {[
                'Faça o login na plataforma VENES com seu e-mail e senha.',
                'No menu superior esquerdo, clique em "Meus Cursos".',
                'Abra o curso: Psicoterapia E Terapia Cognitivo Comportamental.',
                'Clique em "Acessar Sala de Aula" → "Materiais de Estudo" para estudar livremente.',
                'Quando preparado(a), solicite a avaliação em "Avaliação Diagnóstica".',
                'Após a avaliação, comunique ao professor — ele te auxiliará nos próximos passos.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed text-muted-foreground">{text}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => setShowGuide(false)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">Fechar guia</button>
          </div>
        )}

        <div className="mx-4 mt-3 mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
          <ExternalLink size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            ⚠️ Se o login falhar aqui dentro, clique em <strong>"Nova aba"</strong> no cabeçalho e faça login diretamente pelo seu navegador.
          </p>
        </div>

        {/* Iframe */}
        <div style={{ height: 520 }}>
          <iframe
            src={CERT_URL}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title="Unidade Certificadora VENES"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}