import React, { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Instagram, Star, MessageSquare, TrendingUp, Copy, CheckCircle, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { BRAND_LEGAL_NAME, BRAND_SHORT_NAME } from '@/lib/brand';

const COURSE_LABELS = { tcc: 'TCC', psicanalise: 'Psicanálise', sexologia: 'Sexologia' };

function getStudentName(code, fallbackEmail) {
  return code?.profile_name || code?.student_name || fallbackEmail || `Aluno ${BRAND_SHORT_NAME}`;
}

function buildCaption(item, courseLabel) {
  const intro = item.type === 'ranking'
    ? `Resultado de destaque no ranking da turma ${courseLabel}: ${item.studentName} alcançou ${formatScore(item.points)} pontos na plataforma ${BRAND_LEGAL_NAME}.`
    : item.type === 'lesson'
    ? `${item.studentName} registrou um progresso positivo nas aulas da turma ${courseLabel}.`
    : `${item.studentName} compartilhou uma participação positiva na comunidade da turma ${courseLabel}.`;

  return `${intro}\n\n“${item.quote}”\n\nSeguimos celebrando dedicação, presença e evolução real dos nossos alunos.\n\n#WREdu #DesenvolvimentoHumano #${courseLabel.replace(/\s/g, '')} #Educação #EvoluçãoAcadêmica`;
}

function SuggestionCard({ item, selected, onSelect }) {
  const Icon = item.type === 'ranking' ? Award : item.type === 'lesson' ? BookOpen : MessageSquare;
  return (
    <button
      onClick={() => onSelect(item)}
      className={`w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md ${selected ? 'border-pink-400 bg-pink-50' : 'border-border bg-card hover:border-primary/30'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'ranking' ? 'bg-yellow-100 text-yellow-700' : item.type === 'lesson' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm text-foreground truncate">{item.studentName}</p>
            <Badge variant="secondary" className="text-[10px]">{item.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">“{item.quote}”</p>
          {item.points !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-yellow-700">
              <Star size={12} className="fill-yellow-500 text-yellow-500" /> {formatScore(item.points)} pontos
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function PostPreview({ item, courseLabel }) {
  return (
    <div className="bg-gradient-to-br from-[#151128] via-[#6328a8] to-[#f04f88] rounded-[2rem] p-5 text-white shadow-xl aspect-square flex flex-col justify-between overflow-hidden relative">
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-white/10 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.12em] text-white/70 font-bold leading-tight max-w-[75%]">{BRAND_LEGAL_NAME}</p>
          <p className="text-xs text-white/70">Turma {courseLabel}</p>
        </div>
        <Instagram size={24} className="text-white/80" />
      </div>

      <div className="relative space-y-4">
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold">
          {item.type === 'ranking' ? <Award size={13} /> : item.type === 'lesson' ? <TrendingUp size={13} /> : <MessageSquare size={13} />}
          {item.label}
        </div>
        <div>
          <h3 className="text-2xl font-black leading-tight">{item.studentName}</h3>
          <p className="text-sm text-white/75 mt-1">Resultado positivo na jornada acadêmica</p>
        </div>
        <div className="bg-white/12 border border-white/15 rounded-2xl p-4">
          <p className="text-sm leading-relaxed">“{item.quote}”</p>
        </div>
      </div>

      <div className="relative flex items-center justify-between text-xs text-white/80">
        <span>Instituto WR</span>
        {item.points !== undefined && <span className="font-black">{formatScore(item.points)} pts</span>}
      </div>
    </div>
  );
}

export default function InstagramStudio() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const { emails: courseEmails, course: routeCourse } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const courseLabel = COURSE_LABELS[activeCourse] || activeCourse;
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes-instagram'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 500),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['student-profiles-instagram'],
    queryFn: () => base44.entities.StudentProfile.list('-updated_date', 1000),
  });

  const { data: progresses = [] } = useQuery({
    queryKey: ['lesson-progress-instagram'],
    queryFn: () => base44.entities.LessonProgress.list('-created_date', 1000),
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forum-posts-instagram', activeCourse],
    queryFn: () => base44.entities.ForumPost.filter({ course: activeCourse }, '-created_date', 500),
  });

  const courseCodes = useMemo(() => accessCodes.filter((code) => {
    if (!code.student_email) return false;
    if (code.course !== activeCourse && !(activeCourse === 'tcc' && !code.course)) return false;
    if (courseEmails && !courseEmails.has(code.student_email)) return false;
    return true;
  }), [accessCodes, activeCourse, courseEmails]);

  const codeByEmail = useMemo(() => new Map(courseCodes.map((code) => [code.student_email, code])), [courseCodes]);

  const suggestions = useMemo(() => {
    const rankingItems = profiles
      .filter((profile) => profile.dashboard_course === activeCourse && roundScore(codeByEmail.get(profile.student_email)?.pontuacao_total ?? profile.pontuacao_total ?? profile.points ?? 0) > 0)
      .sort((a, b) => (a.dashboard_rank || 9999) - (b.dashboard_rank || 9999))
      .slice(0, 6)
      .map((profile) => ({
        id: `ranking-${profile.student_email}`,
        type: 'ranking',
        label: `Ranking #${profile.dashboard_rank || '—'}`,
        studentName: profile.full_name || getStudentName(codeByEmail.get(profile.student_email), profile.student_email),
        quote: `Com dedicação constante, alcançou ${formatScore(codeByEmail.get(profile.student_email)?.pontuacao_total ?? profile.pontuacao_total ?? profile.points ?? 0)} pontos no ranking acadêmico.`,
        points: roundScore(codeByEmail.get(profile.student_email)?.pontuacao_total ?? profile.pontuacao_total ?? profile.points ?? 0),
      }));

    const progressItems = progresses
      .filter((progress) => codeByEmail.has(progress.student_email) && (progress.comment || progress.summary))
      .slice(0, 8)
      .map((progress) => ({
        id: `progress-${progress.id}`,
        type: 'lesson',
        label: 'Progresso',
        studentName: getStudentName(codeByEmail.get(progress.student_email), progress.student_email),
        quote: (progress.summary || progress.comment || '').slice(0, 180),
      }));

    const forumItems = forumPosts
      .filter((post) => codeByEmail.has(post.author_email) && post.content && post.content.length > 20)
      .slice(0, 8)
      .map((post) => ({
        id: `forum-${post.id}`,
        type: 'forum',
        label: 'Bom comentário',
        studentName: getStudentName(codeByEmail.get(post.author_email), post.author_email),
        quote: post.content.slice(0, 180),
      }));

    return [...rankingItems, ...progressItems, ...forumItems];
  }, [profiles, progresses, forumPosts, activeCourse, codeByEmail]);

  const activeItem = selectedItem || suggestions[0];
  const caption = activeItem ? buildCaption(activeItem, courseLabel) : '';

  const copyCaption = async () => {
    await navigator.clipboard.writeText(caption);
    toast.success('Legenda copiada!');
  };

  if (!isTeacher) {
    return (
      <div className="app-page max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Instagram size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="font-bold text-foreground">Área disponível apenas para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page max-w-6xl mx-auto space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 flex items-center justify-center shadow-lg">
          <Instagram size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Instagram Institucional</h2>
          <p className="text-sm text-muted-foreground">Prepare posts com bons comentários, evolução e resultados positivos dos alunos.</p>
        </div>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 text-sm text-pink-900 flex items-start gap-2">
        <CheckCircle size={16} className="mt-0.5 shrink-0" />
        <p>Esta tela apenas prepara o conteúdo. A publicação no feed será ativada depois que a conta Instagram Business institucional for conectada.</p>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <Instagram size={44} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Ainda não há resultados positivos suficientes para sugerir posts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">Sugestões encontradas</h3>
              <Badge variant="secondary">{suggestions.length} opções</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestions.map((item) => (
                <SuggestionCard key={item.id} item={item} selected={activeItem?.id === item.id} onSelect={setSelectedItem} />
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-5 space-y-4">
            {activeItem && <PostPreview item={activeItem} courseLabel={courseLabel} />}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Legenda pronta</h3>
                <Button size="sm" variant="outline" className="gap-2" onClick={copyCaption}>
                  <Copy size={13} /> Copiar
                </Button>
              </div>
              <textarea
                value={caption}
                readOnly
                className="w-full min-h-48 rounded-xl border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-foreground resize-none"
              />
              <p className="text-[11px] text-muted-foreground">Próximo passo: conectar Instagram Business para publicar diretamente no feed institucional.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
