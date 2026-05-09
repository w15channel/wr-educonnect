import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { ChevronLeft, CalendarDays, Phone, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const tuitionConfig = {
  paid:    { label: 'Em dia',       class: 'text-green-700 bg-green-100 border-green-200',   icon: CheckCircle },
  pending: { label: 'Pendente',     class: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: CheckCircle },
  overdue: { label: 'Inadimplente', class: 'text-red-700 bg-red-100 border-red-200',          icon: XCircle },
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: session } = useOutletContext() || {};
  const { emails: courseEmails, codePrefix } = useCourseFilteredEmails();

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 500),
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-created_date', 200),
  });

  const { data: tuitions = [] } = useQuery({
    queryKey: ['tuitions'],
    queryFn: () => base44.entities.Tuition.list('-month_ref', 500),
  });

  const code = codes.find(c => c.id === id);
  const canViewCode = code && (!codePrefix || ((code.code || '').startsWith(codePrefix) && (!courseEmails || courseEmails.has(code.student_email || ''))));

  if (!code || !canViewCode) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-muted-foreground">Aluno não encontrado.</p>
        <button onClick={() => navigate('/students')} className="text-primary text-sm hover:underline">
          Voltar para Alunos
        </button>
      </div>
    );
  }

  const profile = studentProfiles.find(p => p.student_email === code.student_email);
  const subs = allSubmissions.filter(s => s.student_email === code.student_email);
  const graded = subs.filter(s => s.grade !== undefined && s.grade !== null);
  const avg = graded.length > 0 ? (graded.reduce((sum, s) => sum + s.grade, 0) / graded.length).toFixed(1) : '—';
  const total = graded.reduce((sum, s) => sum + s.grade, 0);
  const studentTuitions = tuitions.filter(t => t.student_email === code.student_email);

  const displayName = code.profile_name || code.student_name || 'Sem nome';

  return (
    <div className="p-4 lg:p-7 max-w-lg mx-auto animate-fade-in-up">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ChevronLeft size={16} /> Voltar
      </button>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 border-b border-border flex items-center gap-4">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="Foto" className="w-16 h-16 rounded-2xl object-cover border-2 border-border" />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white"
              style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <p className="text-lg font-bold text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{code.student_email}</p>
            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg mt-1 inline-block">
              {code.code}
            </code>
          </div>
          {session?.email && code.student_email && session.email !== code.student_email && (
            <Button
              size="sm"
              className="gap-1.5 text-xs shrink-0"
              onClick={() => navigate(`../dm/${encodeURIComponent(code.student_email)}`)}
            >
              <MessageCircle size={13} /> Mensagem
            </Button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {(profile?.birth_date || profile?.whatsapp) && (
            <div className="grid grid-cols-2 gap-3">
              {profile?.birth_date && (
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-xl p-3">
                  <CalendarDays size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Nascimento</p>
                    <p className="font-semibold text-xs">{format(new Date(profile.birth_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              )}
              {profile?.whatsapp && (
                <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-xl p-3">
                  <Phone size={14} className="text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">WhatsApp</p>
                    <p className="font-semibold text-xs">{profile.whatsapp}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {profile?.bio && (
            <div className="bg-secondary/50 rounded-xl p-3">
              <p className="text-xs font-bold text-muted-foreground mb-1">Apresentação</p>
              <p className="text-sm">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
              <p className="text-2xl font-black text-primary">{subs.length}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Entregas</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
              <p className="text-2xl font-black text-primary">{avg}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Média</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
              <p className="text-2xl font-black text-yellow-600">{total}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">Pontos</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-foreground mb-2">Mensalidades</p>
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
        </div>
      </div>
    </div>
  );
}