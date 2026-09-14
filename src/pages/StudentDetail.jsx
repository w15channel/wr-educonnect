import React from 'react';
import { useParams, useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { ChevronLeft, CalendarDays, Phone, CheckCircle, XCircle, MessageCircle, Mail, BookOpen, Award, Star } from 'lucide-react';
import { format } from 'date-fns';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { Button } from '@/components/ui/button';
import { getAvatarPrefixedName, getInitials, resolveAvatarEmoji } from '@/lib/avatarUtils';

const tuitionConfig = {
  paid:    { label: 'Em dia',       class: 'text-green-700 bg-green-100 border-green-200',   icon: CheckCircle },
  pending: { label: 'Pendente',     class: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: CheckCircle },
  overdue: { label: 'Inadimplente', class: 'text-red-700 bg-red-100 border-red-200',          icon: XCircle },
};

const COURSE_LABELS = {
  tcc: 'Terapia TC',
  psicanalise: 'Psicanalista Freudiano',
  sexologia: 'Sexólogo(a)',
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: session } = useOutletContext() || {};
  const { emails: courseEmails, codePrefix } = useCourseFilteredEmails();

  // Derive role prefix (/adm or /student) without slug
  const rolePrefix = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'student' || parts[0] === 'adm') return `/${parts[0]}`;
    return '';
  })();

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000),
  });

  // Derive code early so student-specific queries can use the email
  const code = codes.find(c => c.id === id);
  const studentEmail = code?.student_email || null;

  // ── Student-specific query (was loading 500 global submissions and filtering client-side) ──
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['task-submissions', studentEmail],
    queryFn: () => base44.entities.TaskSubmission.filter({ student_email: studentEmail }, '-created_date', 200),
    enabled: !!studentEmail,
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-created_date', 10000),
  });

  const { data: tuitions = [] } = useQuery({
    queryKey: ['tuitions'],
    queryFn: () => base44.entities.Tuition.list('-month_ref', 500),
  });

  // Admin: always allow; student: restrict to own course
  const isAdmin = session?.role === 'admin';
  const canViewCode = code && (isAdmin || !codePrefix || ((code.code || '').startsWith(codePrefix) && (!courseEmails || courseEmails.has(code.student_email || ''))));

  if (!code || !canViewCode) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-muted-foreground">Aluno não encontrado.</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">Voltar</button>
      </div>
    );
  }

  const profile = studentProfiles.find(p => p.student_email === code.student_email);
  const subs = allSubmissions; // already filtered by student_email in the query
  const graded = subs.filter(s => s.grade !== undefined && s.grade !== null);
  const total = graded.reduce((sum, item) => roundScore(sum + roundScore(item.grade)), 0);
  const avg = graded.length > 0 ? formatScore(total / graded.length) : '—';
  const studentTuitions = tuitions.filter(t => t.student_email === code.student_email);

  const displayName = code.profile_name || code.student_name || 'Sem nome';
  const avatarColor = code.profile_avatar_color || profile?.avatar_color || '#5b5ef4';
  const photoUrl = code.profile_photo_url || profile?.photo_url;
  const avatarEmoji = resolveAvatarEmoji(code.profile_avatar_emoji || profile?.avatar_emoji);
  const bio = code.profile_bio || profile?.bio;
  const initials = getInitials(displayName);
  const publicName = getAvatarPrefixedName(displayName, code.profile_avatar_emoji || profile?.avatar_emoji);

  return (
    <div className="app-page max-w-xl mx-auto animate-fade-in-up">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ChevronLeft size={16} /> Voltar
      </button>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Header — foto/avatar + nome */}
        <div className="relative">
          {/* Faixa de cor do avatar como banner */}
          <div className="h-20 w-full" style={{ background: `linear-gradient(135deg, ${avatarColor}44 0%, ${avatarColor}22 100%)` }} />
          <div className="px-6 pb-5">
            <div className="flex items-end gap-4 -mt-10">
              {/* Avatar */}
              <div className="relative shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-card shadow-md"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white border-4 border-card shadow-md"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {avatarEmoji || initials}
                  </div>
                )}
                {/* Emoji badge se tiver foto */}
                {photoUrl && avatarEmoji && (
                  <span className="absolute -bottom-1 -right-1 text-xl">{avatarEmoji}</span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-11">
                <h2 className="text-lg font-bold text-foreground truncate">{publicName}</h2>
                <p className="text-xs text-muted-foreground truncate">{code.student_email || '—'}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {code.code}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                <BookOpen size={11} /> {COURSE_LABELS[code.course] || code.course || '—'}
              </span>
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                {code.is_active ? '● Ativo' : '○ Inativo'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
          {/* Bio */}
          {bio && (
            <div className="bg-secondary/40 rounded-xl p-3.5">
              <p className="text-xs font-bold text-muted-foreground mb-1.5">Apresentação</p>
              <p className="text-sm leading-relaxed">{bio}</p>
            </div>
          )}

          {/* Dados pessoais */}
          {(profile?.birth_date || profile?.whatsapp || profile?.email || code.student_email) && (
            <div className="grid grid-cols-1 gap-2">
              {code.student_email && (
                <div className="flex items-center gap-2.5 text-sm bg-secondary/40 rounded-xl p-3">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">E-mail</p>
                    <p className="font-semibold text-xs">{code.student_email}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {profile?.email && profile.email !== code.student_email && (
                  <div className="flex items-center gap-2 text-sm bg-secondary/40 rounded-xl p-3">
                    <Mail size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">E-mail pessoal</p>
                      <p className="font-semibold text-xs break-all">{profile.email}</p>
                    </div>
                  </div>
                )}
                {profile?.birth_date && (
                  <div className="flex items-center gap-2 text-sm bg-secondary/40 rounded-xl p-3">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Nascimento</p>
                      <p className="font-semibold text-xs">{format(new Date(profile.birth_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                )}
                {profile?.whatsapp && (
                  <div className="flex items-center gap-2 text-sm bg-secondary/40 rounded-xl p-3">
                    <Phone size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">WhatsApp</p>
                      <p className="font-semibold text-xs">{profile.whatsapp}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cores do avatar */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground font-semibold">Cor do avatar:</p>
            <div className="w-6 h-6 rounded-full border border-border shadow-sm" style={{ backgroundColor: avatarColor }} />
            <span className="text-xs font-mono text-muted-foreground">{avatarColor}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
              <p className="text-2xl font-black text-primary">{subs.length}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Entregas</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
              <p className="text-2xl font-black text-primary">{avg}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Nota Total</p>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-3 text-center border border-yellow-500/20">
              <p className="text-2xl font-black text-yellow-500">{formatScore(total)}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Pontos</p>
            </div>
          </div>

          {/* Mensalidades */}
          <div>
            <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Award size={14} /> Mensalidades
            </p>
            {studentTuitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma mensalidade lançada.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {studentTuitions.map(t => {
                  const cfg = tuitionConfig[t.status] || tuitionConfig.pending;
                  return (
                    <div key={t.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${cfg.class}`}>
                      <span className="font-bold">{t.month_ref}</span>
                      <span>{t.amount ? `R$ ${Number(t.amount).toFixed(2)}` : ''}</span>
                      <span className="font-black">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botão de chat */}
          {session?.email && code.student_email && session.email !== code.student_email && (
            <Button
              className="w-full gap-2"
              onClick={() => navigate(`${rolePrefix}/dm/${encodeURIComponent(code.student_email)}`)}
            >
              <MessageCircle size={16} /> Enviar Mensagem Particular
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}