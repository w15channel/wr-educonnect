import React, { useEffect, useState } from 'react';
import { Award, BookOpen, FileText, Heart, Bell, Download, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useOutletContext, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import MeuCertificado from './MeuCertificado';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useStudentRecords from '@/hooks/useStudentRecords';
import { ACTIVITY_MINUTES } from '@/lib/durationUtils';

const TOTAL_LESSONS = 50;
const TOTAL_TASKS = 50;
const TOTAL_PRACTICE = 15;
const REMINDER_KEY = 'cert_last_reminder';
const SOLICITUD_KEY = 'cert_solicitud_enviada';

const COURSE_NAMES = {
  tcc: 'Formação de Terapeuta em Terapia Comportamental',
  psicanalise: 'Formação de Terapeutas do Método Psicanalítico',
  sexologia: 'Formação de Terapeutas da Sexualidade Humana',
};

function ProgressBar({ label, icon: Icon, colorClass, current, total, unit, description }) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.min(100, Math.round((current / safeTotal) * 100));
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
  const [showReminder, setShowReminder] = useState(false);
  const [activeTab, setActiveTab] = useState('progresso');
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

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

  // ── Queries de progresso do aluno ──────────────────────────────────
  const { data: lessonProgresses = [] } = useStudentRecords('LessonProgress', session, !isTeacher);
  const { data: taskSubmissions = [] } = useStudentRecords('TaskSubmission', session, !isTeacher);

  const { data: complementary = {} } = useQuery({
    queryKey: ['cert-complementary-hours', session?.course],
    queryFn: async () => {
      const course = session?.course || 'tcc';
      const posts = await base44.entities.ForumPost.filter({ course }, '-created_date', 1000);
      const replies = await base44.entities.ForumReply.filter({ course }, '-created_date', 2000);
      const pairings = await base44.entities.TherapistPairing.list('-pairing_date', 1000);
      const mentorships = await base44.entities.Mentorship.filter({ course }, '-date', 500);
      const challenges = await base44.entities.DailyChallengeResponse.filter({ course }, '-created_date', 2000);
      return { posts, replies, pairings, mentorships, challenges };
    },
    enabled: !isTeacher && !!session,
  });

  // ── Verifica se já solicitou emissão ───────────────────────────────
  useEffect(() => {
    if (isTeacher || !session?.email) return;
    const local = localStorage.getItem(`${SOLICITUD_KEY}_${session.email}`);
    setHasRequested(Boolean(local));
  }, [session?.email, isTeacher]);

  const identifiers = new Set([session?.email, session?.code].filter(Boolean).map((value) => String(value).trim().toLowerCase()));
  const belongsToStudent = (value) => identifiers.has(String(value || '').trim().toLowerCase());
  const lessonsWatched = new Set(lessonProgresses.filter((p) => p.watched && String(p.lesson_id || '').startsWith('apostila:')).map((p) => p.lesson_id)).size;
  const tasksSubmitted = new Set(taskSubmissions.map((submission) => submission.task_id).filter(Boolean)).size;
  const posts = complementary.posts || [];
  const ownPosts = posts.filter((post) => belongsToStudent(post.author_email));
  const postById = new Map(posts.map((post) => [post.id, post]));
  const ownReplies = (complementary.replies || []).filter((reply) => belongsToStudent(reply.author_email) && !belongsToStudent(postById.get(reply.post_id)?.author_email));
  const pairingHours = (complementary.pairings || []).reduce((total, pairing) => total + (belongsToStudent(pairing.therapist_email) && pairing.therapist_submitted ? ACTIVITY_MINUTES.therapist : 0) + (belongsToStudent(pairing.patient_email) && pairing.patient_submitted ? ACTIVITY_MINUTES.therapist : 0), 0);
  const mentorshipMinutes = (complementary.mentorships || []).filter((item) => item.status !== 'cancelada' && (item.participant_emails || []).some(belongsToStudent)).reduce((total, item) => total + (Number(item.duration_minutes) || ACTIVITY_MINUTES.mentorship), 0);
  const challengeMinutes = (complementary.challenges || []).filter((item) => belongsToStudent(item.student_email) && Number(item.points_earned) > 0).length * ACTIVITY_MINUTES.ofensiva;
  const complementaryMinutes = (ownPosts.length + ownReplies.length) * ACTIVITY_MINUTES.forum + pairingHours + mentorshipMinutes + challengeMinutes;
  const practiceCompleted = Math.round((complementaryMinutes / 60) * 10) / 10;

  const totalPct = isTeacher ? 0 : Math.round(
    ((Math.min(lessonsWatched, TOTAL_LESSONS) / TOTAL_LESSONS) +
      (Math.min(tasksSubmitted, TOTAL_TASKS) / TOTAL_TASKS) +
      (Math.min(practiceCompleted, TOTAL_PRACTICE) / TOTAL_PRACTICE)) / 3 * 100
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

  // ── Solicitação real de emissão ────────────────────────────────────
  const requestEmission = async () => {
    if (hasRequested) {
      toast.info('Você já solicitou a emissão do seu certificado. Aguarde a análise da coordenação.');
      return;
    }

    setIsRequesting(true);
    try {
      const studentName = session?.name || 'Aluno';
      const studentEmail = session?.email || '';
      const course = session?.course || 'tcc';

      await base44.entities.Announcement.create({
        title: `Solicitação de Certificado - ${studentName}`,
        content: `📋 Nova solicitação de emissão de certificado\n\nAluno: ${studentName}\nE-mail: ${studentEmail}\nCurso: ${courseName}\n\nProgresso atual:\n• Aulas completas: ${lessonsWatched}/${TOTAL_LESSONS}\n• Tarefas entregues: ${tasksSubmitted}/${TOTAL_TASKS}\n• Prática terapêutica: ${practiceCompleted}/${TOTAL_PRACTICE} horas\n• Progresso geral: ${totalPct}%\n\nO aluno solicitou a emissão do certificado. Acesse o Gerador de Certificados para revisar e emitir.`,
        type: 'info',
        course,
      });

      localStorage.setItem(`${SOLICITUD_KEY}_${studentEmail}`, new Date().toISOString());
      setHasRequested(true);
      toast.success('Solicitação enviada! A coordenação irá analisar e emitir seu certificado em breve.');
    } catch (error) {
      toast.error('Erro ao enviar solicitação: ' + (error.message || ''));
    } finally {
      setIsRequesting(false);
    }
  };

  if (isTeacher) {
    return (
      <div className="app-page max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg mb-5">
          <Award size={30} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Certificação</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          Esta página exibe o progresso de certificação de cada aluno. Os alunos acompanham aqui seus requisitos para obter o certificado do curso.
        </p>
      </div>
    );
  }

  return (
    <div className="app-page max-w-3xl mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
          <Award size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Certificação</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{courseName}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="progresso"><BookOpen size={13} className="mr-1.5" /> Progresso</TabsTrigger>
          <TabsTrigger value="diploma"><Award size={13} className="mr-1.5" /> Meu Diploma</TabsTrigger>
        </TabsList>

        <TabsContent value="progresso" className="space-y-5">
          {/* Certificate available banner */}
          {hasCertificate && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                <Award size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-yellow-900">🎉 Seu certificado está disponível!</p>
                <p className="text-xs text-yellow-700 mt-0.5">A coordenação já emitiu seu certificado. Clique para visualizar e baixar.</p>
              </div>
              <button
                onClick={() => setActiveTab('diploma')}
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shrink-0"
              >
                <Download size={14} /> Ver certificado
              </button>
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
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-green-500 transition-all duration-700"
                style={{ width: `${totalPct}%` }}
              />
            </div>
            {totalPct >= 100 && (
              <p className="text-center text-green-600 font-bold text-sm mt-3">🎉 Parabéns! Você completou todos os requisitos!</p>
            )}
          </div>

          {/* Reminder */}
          {showReminder && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <Bell size={16} className="text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-800">Lembrete diário! 📚</p>
                <p className="text-xs text-amber-700">Continue estudando e entregando atividades para avançar na certificação.</p>
              </div>
              <button onClick={dismissReminder} className="text-xs text-amber-600 font-semibold border border-amber-300 px-2.5 py-1 rounded-lg shrink-0">Ok!</button>
            </div>
          )}

          {/* 3 progress bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ProgressBar
              label="Aulas Completas"
              icon={BookOpen}
              colorClass="text-purple-500"
              current={lessonsWatched}
              total={TOTAL_LESSONS}
              unit=" aulas"
              description="Aulas da apostila marcadas como lidas"
            />
            <ProgressBar
              label="Tarefas Entregues"
              icon={FileText}
              colorClass="text-orange-500"
              current={tasksSubmitted}
              total={TOTAL_TASKS}
              unit=" tarefas"
              description="Entregue as 50 tarefas previstas no curso"
            />
            <ProgressBar
              label="Prática Terapêutica"
              icon={Heart}
              colorClass="text-pink-500"
              current={practiceCompleted}
              total={TOTAL_PRACTICE}
              unit="h"
              description="Somatória de horas das atividades complementares"
            />
          </div>

          {/* Emissão de certificado */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-foreground">Emissão de certificado</p>
              <p className="text-xs text-muted-foreground">
                {hasCertificate
                  ? 'Seu certificado já foi emitido.'
                  : hasRequested
                    ? 'Solicitação enviada. Aguarde a análise da coordenação.'
                    : 'Disponível ao atingir 80% do progresso geral.'}
              </p>
            </div>
            {hasCertificate ? (
              <button
                onClick={() => setActiveTab('diploma')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500 text-white hover:bg-yellow-600 transition"
              >
                <Download size={14} className="inline mr-1" /> Ver diploma
              </button>
            ) : hasRequested ? (
              <span className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 flex items-center gap-1.5">
                <Clock size={14} /> Aguardando análise
              </span>
            ) : (
              <button
                disabled={totalPct < 80}
                onClick={requestEmission}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isRequesting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {isRequesting ? 'Enviando...' : 'Solicitar emissão'}
              </button>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-1">Como funciona a certificação?</p>
            <ol className="space-y-1 text-xs text-blue-700 list-decimal list-inside">
              <li>Marque como lidas as {TOTAL_LESSONS} aulas da apostila</li>
              <li>Entregue as {TOTAL_TASKS} tarefas previstas no curso</li>
              <li>Acumule {TOTAL_PRACTICE} horas em atividades complementares para a prática terapêutica</li>
              <li>Quando atingir 80% dos requisitos, solicite a emissão do certificado pelo botão acima</li>
              <li>A coordenação analisará seu pedido e emitirá seu certificado oficial</li>
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="diploma">
          {hasCertificate ? (
            <MeuCertificado />
          ) : (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Award size={28} className="text-muted-foreground" />
              </div>
              <p className="font-bold text-lg text-foreground">Seu diploma aparecerá aqui</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Quando a coordenação emitir seu certificado, ele ficará disponível nesta aba para visualização e download.
              </p>
              <button
                onClick={() => setActiveTab('progresso')}
                className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                <BookOpen size={14} /> Ver meu progresso
              </button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}