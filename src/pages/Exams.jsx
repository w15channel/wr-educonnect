import React, { useState, useMemo } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import {
  GraduationCap, CheckCircle, Star, Plus, Pencil, Trash2, Play,
  ChevronDown, ChevronUp, Trophy, Eye, Award, Sparkles, AlertCircle, Edit, HelpCircle, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatScore } from '@/lib/scoreUtils';
import AIExamGenerator from '../components/tasks/AIExamGenerator';
import ExamEditor from '../components/exams/ExamEditor';
import ExamSubmissionGrader from '../components/exams/ExamSubmissionGrader';

function useScopedPrefix() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'student' || parts[0] === 'adm') return `/${parts[0]}`;
  return '';
}

function SubmittedView({ submission }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl text-xs font-bold">
          <CheckCircle size={12} /> Enviada
        </span>
        {submission.grade != null ? (
          <span className="text-sm font-black text-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
            Nota: {formatScore(submission.grade)}
          </span>
        ) : (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            ⏳ Aguardando correção
          </span>
        )}
        {submission.feedback && (
          <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-xs text-primary border border-primary/20 px-2.5 py-1.5 rounded-xl hover:bg-primary/5 transition-colors">
            <Eye size={11} /> {open ? 'Ocultar' : 'Ver feedback'}
          </button>
        )}
      </div>
      {open && submission.feedback && (
        <div className="bg-secondary/40 border border-border rounded-xl p-3 text-xs">
          <p className="font-bold text-foreground mb-1 flex items-center gap-1"><Award size={11} className="text-yellow-500" /> Feedback:</p>
          <p className="text-muted-foreground">{submission.feedback}</p>
        </div>
      )}
    </div>
  );
}

export default function Exams() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const prefix = useScopedPrefix();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userCourse = session?.course || 'tcc';

  const [expandedId, setExpandedId] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('all');

  // Load all exams for this course
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams', userCourse],
    queryFn: () => {
      if (isTeacher) return base44.entities.Exam.list('-created_date', 300);
      return base44.entities.Exam.filter({ course: userCourse, is_published: true }, '-created_date', 300);
    },
  });
  const visibleExams = isTeacher ? exams : exams.filter((exam) => !exam.is_hidden);

  const normalizeEmail = (v = '') => String(v || '').trim().toLowerCase();
  const studentEmails = [session?.email, session?.code].filter(Boolean).map(normalizeEmail);

  // Load exam submissions from new dedicated entity
  const { data: submissions = [] } = useQuery({
    queryKey: ['exam-submissions', userCourse],
    queryFn: async () => {
      const records = await base44.entities.ExamSubmission.filter({ course: userCourse }, '-submitted_at', 3000);
      return isTeacher ? records : records.filter(s => studentEmails.includes(normalizeEmail(s.student_email)));
    },
    enabled: exams.length > 0,
  });

  // Get unique students for filter
  const uniqueStudents = useMemo(() => {
    if (!isTeacher) return [];
    const map = new Map();
    submissions.forEach(s => {
      if (!map.has(s.student_email)) {
        map.set(s.student_email, { email: s.student_email, name: s.student_name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [submissions, isTeacher]);

  // Filter submissions by selected student
  const filteredSubmissions = selectedStudent === 'all' 
    ? submissions 
    : submissions.filter(s => normalizeEmail(s.student_email) === normalizeEmail(selectedStudent));

  const submissionByExamId = {};
  filteredSubmissions.forEach(s => { if (!submissionByExamId[s.exam_id]) submissionByExamId[s.exam_id] = s; });

  const deleteMutation = useMutation({
    mutationFn: id => adminApi.delete('Exam', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Prova removida.');
    },
  });
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isHidden }) => adminApi.update('Exam', id, { is_hidden: isHidden }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Visibilidade da prova atualizada.');
    },
  });

  const totalDone = visibleExams.filter(e => submissionByExamId[e.id]).length;

  if (showAIGenerator) {
    return <AIExamGenerator onBack={() => setShowAIGenerator(false)} course={userCourse} />;
  }

  if (showEditor || editingExam) {
    return <ExamEditor exam={editingExam} onBack={() => { setShowEditor(false); setEditingExam(null); }} course={userCourse} />;
  }

  if (gradingSubmission && gradingSubmission.exam_id) {
    const exam = exams.find(e => e.id === gradingSubmission.exam_id);
    if (exam) {
      return <ExamSubmissionGrader submission={gradingSubmission} exam={exam} onBack={() => setGradingSubmission(null)} />;
    }
  }

  return (
    <div className="p-3 md:p-5 max-w-[900px] mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap size={22} className="text-primary" />
            Provas
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isTeacher
              ? `${exams.length} prova${exams.length !== 1 ? 's' : ''} cadastrada${exams.length !== 1 ? 's' : ''}`
              : `${totalDone}/${visibleExams.length} realizada${totalDone !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {isTeacher && (
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="h-9 text-sm shrink-0 border border-border rounded-lg bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">Todos os alunos</option>
              {uniqueStudents.map(student => (
                <option key={student.email} value={student.email}>{student.name}</option>
              ))}
            </select>
            <Button
              onClick={() => { setEditingExam(null); setShowEditor(true); }}
              className="gap-2 h-9 text-sm shrink-0 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-bold"
            >
              <Pencil size={14} /> Criar Manual
            </Button>
            <Button
              onClick={() => setShowAIGenerator(true)}
              className="gap-2 h-9 text-sm shrink-0 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold"
            >
              <Sparkles size={14} /> Gerar com IA
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar — students */}
      {!isTeacher && visibleExams.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold flex items-center gap-1.5"><GraduationCap size={14} /> Progresso Geral</span>
            <span className="font-mono font-bold text-primary text-sm">{totalDone}/{visibleExams.length}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${visibleExams.length > 0 ? (totalDone / visibleExams.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visibleExams.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhuma prova encontrada</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Gerar com IA" para criar uma prova automaticamente</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleExams.map((exam, idx) => {
            const submission = submissionByExamId[exam.id];
            const isDone = !!submission;
            const isExpanded = expandedId === exam.id;
            const isPastDeadline = exam.deadline && new Date(exam.deadline) < new Date();

            return (
              <div key={exam.id} className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${isDone ? 'border-green-200/50' : 'border-border hover:shadow-md'} ${isTeacher && exam.is_hidden ? 'opacity-60' : ''}`}>
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : exam.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 ${
                    isDone 
                      ? submission?.status === 'graded' 
                        ? 'bg-green-500 border-green-400 text-white' 
                        : 'bg-amber-500 border-amber-400 text-white'
                      : 'bg-secondary border-border text-foreground'
                  }`}>
                    {isDone ? (submission?.status === 'graded' ? <CheckCircle size={18} /> : <HelpCircle size={16} />) : <GraduationCap size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground">{exam.title}</h3>
                      {exam.generated_by_ai && (
                        <span className="text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Sparkles size={8} /> IA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {isDone && submission?.status === 'graded' && (
                        <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 py-0 px-1.5">✓ Corrigida</Badge>
                      )}
                      {isDone && submission?.status === 'submitted' && (
                        <Badge className="text-[9px] bg-amber-100 text-amber-700 border-amber-200 py-0 px-1.5">⏳ Pendente</Badge>
                      )}
                      {isDone && submission?.grade != null && (
                        <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-0.5">
                          <Star size={9} className="fill-yellow-500" /> {formatScore(submission.grade)}
                        </span>
                      )}
                      {exam.quiz_questions?.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{exam.quiz_questions.length} questões · {exam.max_grade} pts</span>
                      )}
                      {!isDone && exam.deadline && (
                        <span className={`text-[10px] font-semibold ${isPastDeadline ? 'text-red-500' : 'text-muted-foreground'}`}>
                          Prazo: {format(new Date(exam.deadline), 'dd/MM HH:mm')}{isPastDeadline ? ' · Expirou' : ''}
                        </span>
                      )}
                      {!isDone && !exam.deadline && <span className="text-[10px] text-muted-foreground">Sem prazo definido</span>}
                      {isTeacher && exam.is_hidden && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">Oculta para alunos</span>
                      )}
                    </div>
                  </div>

                  {!isTeacher && <div className="shrink-0 text-muted-foreground">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>}

                  {isTeacher && (
                    <div className="flex gap-1 shrink-0 items-center">
                      <span className="text-xs text-muted-foreground px-2 py-1 border border-border rounded-lg shrink-0">
                        {submissions.filter(s => s.exam_id === exam.id).length} entregas
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingExam(exam); setShowEditor(true); }}
                        className="p-2 text-muted-foreground hover:text-primary rounded-lg"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); toggleVisibilityMutation.mutate({ id: exam.id, isHidden: !exam.is_hidden }); }}
                        className={`p-2 rounded-lg ${exam.is_hidden ? 'text-amber-600 hover:text-amber-700' : 'text-muted-foreground hover:text-foreground'}`}
                        title={exam.is_hidden ? 'Mostrar para alunos' : 'Ocultar para alunos'}
                      >
                        {exam.is_hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteMutation.mutate(exam.id); }}
                        className="p-2 text-muted-foreground hover:text-destructive rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 bg-secondary/10">
                {exam.description && <p className="text-sm text-muted-foreground leading-relaxed">{exam.description}</p>}

                {isPastDeadline && !isDone ? (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <AlertCircle size={15} /> Prazo encerrado para esta prova.
                  </div>
                ) : isDone ? (
                  isTeacher ? (
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
                        onClick={() => setGradingSubmission(submission)}
                      >
                        <Award size={13} /> Corrigir Prova
                      </Button>
                      <SubmittedView submission={submission} />
                    </div>
                  ) : (
                    <SubmittedView submission={submission} />
                  )
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold"
                    onClick={() => navigate(`${prefix}/exams/quiz/${exam.id}`)}
                  >
                    <Play size={13} /> Iniciar Prova
                  </Button>
                )}
                </div>
                )}
              </div>
            );
          })}

          {!isTeacher && totalDone >= visibleExams.length && visibleExams.length > 0 && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 text-center">
              <Trophy size={30} className="mx-auto mb-2 text-green-500" />
              <p className="font-black text-base text-foreground">Todas as provas realizadas! 🎉</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}