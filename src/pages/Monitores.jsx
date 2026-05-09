import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, Crown, Download, RefreshCw, Calendar, RotateCcw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MONITOR_BONUSES = { 1: 0.5, 2: 0.3, 3: 0.2 };
const CYCLE_DAYS = 5;
const EPOCH = new Date('2024-01-01T00:00:00Z');

function getCycleStart() {
  const today = new Date();
  const daysSince = Math.floor((today - EPOCH) / (1000 * 60 * 60 * 24));
  const cycleNum = Math.floor(daysSince / CYCLE_DAYS);
  const cycleDate = new Date(EPOCH.getTime() + cycleNum * CYCLE_DAYS * 24 * 60 * 60 * 1000);
  return format(cycleDate, 'yyyy-MM-dd');
}

function getCycleEnd(start) {
  const d = new Date(start + 'T00:00:00');
  return format(addDays(d, CYCLE_DAYS - 1), 'yyyy-MM-dd');
}

function MonitorBadge({ rank }) {
  const colors = { 1: 'bg-yellow-400 text-yellow-900', 2: 'bg-slate-300 text-slate-800', 3: 'bg-amber-600 text-amber-100' };
  const labels = { 1: '🥇 1º Monitor', 2: '🥈 2º Monitor', 3: '🥉 3º Monitor' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${colors[rank] || 'bg-primary/10 text-primary'}`}>
      <Crown size={11} /> {labels[rank] || 'Monitor'}
    </span>
  );
}

export default function Monitores() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [certStudent, setCertStudent] = useState(null);
  const [defining, setDefining] = useState(false);
  const certRef = useRef(null);

  // Current course for filtering
  const activeCourse = session?.course || 'tcc';

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-monitores'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['submissions-monitores'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 2000),
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forum-posts-monitores'],
    queryFn: () => base44.entities.ForumPost.list('-created_date', 1000),
  });

  const { data: forumReplies = [] } = useQuery({
    queryKey: ['forum-replies-monitores'],
    queryFn: () => base44.entities.ForumReply.list('-created_date', 1000),
  });

  const { data: monitorHistory = [] } = useQuery({
    queryKey: ['monitor-history'],
    queryFn: () => base44.entities.MonitorHistory.list('-period_start', 100),
  });

  const periodStart = getCycleStart();
  const periodEnd = getCycleEnd(periodStart);

  // Current monitors for this course and this cycle
  const currentMonitors = monitorHistory.filter(
    m => m.period_start === periodStart && (m.course === activeCourse || !m.course)
  );

  // Course students
  const courseStudents = accessCodes.filter(
    c => c.is_active !== false && c.course === activeCourse && c.student_email
  );

  // Build ranking igual ao Dashboard — baseado em ScoreItems verificados
  const buildRanking = () => {
    const courseEmails = new Set(courseStudents.map(c => c.student_email).filter(Boolean));
    const rankMap = {};
    scoreItems.filter(s => s.verified && s.student_email && courseEmails.has(s.student_email)).forEach(s => {
      if (!rankMap[s.student_email]) rankMap[s.student_email] = { email: s.student_email, total: 0 };
      rankMap[s.student_email].total += (s.score || 0);
    });
    return Object.values(rankMap).sort((a, b) => b.total - a.total);
  };

  const ranking = buildRanking();
  const topMonitors = ranking.slice(0, 3);

  const getCodeByEmail = (email) => accessCodes.find(c => c.student_email === email);

  const handleDefineMonitors = async (forceReset = false) => {
    if (currentMonitors.length > 0 && !forceReset) {
      toast.info('Monitores deste período já foram definidos. Use "Resetar" para redefinir.');
      return;
    }
    if (topMonitors.length === 0) {
      toast.error('Nenhum aluno encontrado nesta turma.');
      return;
    }
    setDefining(true);
    try {
      // Delete existing if resetting
      if (forceReset && currentMonitors.length > 0) {
        for (const m of currentMonitors) {
          await base44.entities.MonitorHistory.delete(m.id);
        }
      }
      for (let i = 0; i < topMonitors.length; i++) {
        const r = topMonitors[i];
        const code = accessCodes.find(c => c.student_email === r.email);
        await base44.entities.MonitorHistory.create({
          student_email: r.email,
          student_name: code?.profile_name || code?.student_name || r.email,
          period_start: periodStart,
          period_end: periodEnd,
          rank_position: i + 1,
          course: activeCourse,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['monitor-history'] });
      toast.success(`✅ Monitores da turma ${activeCourse.toUpperCase()} definidos!`);
    } catch (e) {
      toast.error('Erro: ' + (e?.message || 'tente novamente'));
    } finally {
      setDefining(false);
    }
  };

  const handleReset = async () => {
    if (currentMonitors.length === 0) {
      await handleDefineMonitors(false);
      return;
    }
    await handleDefineMonitors(true);
  };

  const getStudentInfo = (email) => {
    const code = accessCodes.find(c => c.student_email === email);
    return {
      name: code?.profile_name || code?.student_name || email,
      photo: code?.profile_photo_url || '',
      color: code?.profile_avatar_color || '#5b5ef4',
    };
  };

  const handlePrintCert = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`certificado-monitor-${certStudent?.student_name?.replace(/\s/g, '-')}.pdf`);
    toast.success('Certificado gerado!');
  };

  const courseLabel = { tcc: 'TCC', psicanalise: 'Psicanálise', sexologia: 'Sexologia' }[activeCourse] || activeCourse;

  // Course-filtered history
  const courseHistory = monitorHistory.filter(
    m => m.course === activeCourse || (!m.course && activeCourse === 'tcc')
  );

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown size={22} className="text-yellow-500" /> Monitores do Período
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Turma {courseLabel} · Ciclo de {CYCLE_DAYS} dias · {format(new Date(periodStart + 'T00:00:00'), 'dd/MM', { locale: ptBR })} a {format(new Date(periodEnd + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        {isTeacher && (
          <div className="flex gap-2 flex-wrap">
            {currentMonitors.length > 0 && (
              <Button variant="outline" onClick={handleReset} disabled={defining} className="gap-2">
                <RotateCcw size={14} className={defining ? 'animate-spin' : ''} />
                Resetar e Redefinir
              </Button>
            )}
            <Button onClick={() => handleDefineMonitors(false)} disabled={defining} className="gap-2">
              <UserPlus size={15} className={defining ? 'animate-pulse' : ''} />
              {defining ? 'Definindo...' : currentMonitors.length > 0 ? 'Já Definido' : 'Definir Monitores'}
            </Button>
          </div>
        )}
      </div>

      {/* Critérios */}
      {isTeacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <p className="font-bold mb-1">Critérios de seleção dos Monitores:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Maior pontuação total (ScoreItems verificados)</li>
            <li>1º Monitor: +0.5pts / 2º Monitor: +0.3pts / 3º Monitor: +0.2pts por atividade</li>
          </ol>
        </div>
      )}

      {/* Ranking de Desempenho */}
      {ranking.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Trophy size={16} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Ranking de Desempenho</h3>
              <p className="text-xs text-muted-foreground">Turma {courseLabel} · Os 3 primeiros são os Monitores do Período</p>
            </div>
          </div>
          <div className="space-y-2">
            {ranking.map((r, i) => {
              const code = getCodeByEmail(r.email);
              const displayName = code?.profile_name || code?.student_name || r.email;
              const avatarColor = code?.profile_avatar_color || '#5b5ef4';
              const photoUrl = code?.profile_photo_url || '';
              const isMonitor = i < 3;
              const isMe = r.email === session?.email;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div key={r.email} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isMe ? 'bg-primary/8 border-primary/20' :
                  isMonitor ? 'bg-yellow-50 border-yellow-200' :
                  'bg-secondary/20 border-transparent'
                }`}>
                  <span className="w-6 text-center shrink-0">
                    {medal || <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                  </span>
                  {photoUrl ? (
                    <img src={photoUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: avatarColor }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {displayName}{isMe && <span className="ml-1 text-primary/60">(você)</span>}
                    </p>
                    {isMonitor && <MonitorBadge rank={i + 1} />}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-foreground">{r.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monitores atuais */}
      {currentMonitors.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <Crown size={40} className="mx-auto mb-3 text-yellow-400 opacity-40" />
          <p className="font-semibold text-muted-foreground">Nenhum monitor definido para este período</p>
          {isTeacher && (
            <p className="text-xs text-muted-foreground mt-1">Clique em "Definir Monitores" para selecionar automaticamente os 3 primeiros do ranking.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {currentMonitors.sort((a, b) => a.rank_position - b.rank_position).map(m => {
            const info = getStudentInfo(m.student_email);
            const isMe = m.student_email === session?.email;
            return (
              <div key={m.id} className={`bg-card rounded-2xl border p-5 flex flex-col items-center gap-3 text-center shadow-sm transition-all ${isMe ? 'border-yellow-300 shadow-yellow-100' : 'border-border'}`}>
                {info.photo ? (
                  <img src={info.photo} alt={info.name} className="w-16 h-16 rounded-full object-cover border-4 border-yellow-200" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-yellow-200" style={{ backgroundColor: info.color }}>
                    {info.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-foreground">{info.name}</p>
                  <MonitorBadge rank={m.rank_position} />
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    Bônus: +{MONITOR_BONUSES[m.rank_position] || 0.2} por atividade
                  </p>
                </div>
                {(isMe || isTeacher) && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full" onClick={() => setCertStudent(m)}>
                    <Download size={12} /> Certificado PDF
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico por curso */}
      {courseHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-primary" /> Histórico de Monitores — Turma {courseLabel}
          </h3>
          <div className="space-y-2">
            {[...new Set(courseHistory.map(m => m.period_start))].sort((a, b) => b.localeCompare(a)).map(period => {
              const group = courseHistory.filter(m => m.period_start === period).sort((a, b) => a.rank_position - b.rank_position);
              const isCurrent = period === periodStart;
              return (
                <div key={period} className={`rounded-xl p-3 ${isCurrent ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/40'}`}>
                  <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                    Período: {format(new Date(period + 'T00:00:00'), 'dd/MM/yyyy')}
                    {isCurrent && <span className="text-green-600 font-bold">· Atual</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.map(m => (
                      <div key={m.id} className="flex items-center gap-1.5 bg-card px-2.5 py-1.5 rounded-lg border border-border text-xs">
                        <Crown size={10} className="text-yellow-500" />
                        <span className="font-semibold">{m.student_name}</span>
                        <span className="text-muted-foreground">#{m.rank_position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialog Certificado */}
      <Dialog open={!!certStudent} onOpenChange={() => setCertStudent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Certificado de Monitor</DialogTitle></DialogHeader>
          <div ref={certRef} className="bg-white text-center" style={{ fontFamily: 'Georgia, "Times New Roman", serif', minHeight: 480, padding: '48px 56px', border: '2px solid #1e3a5f', boxShadow: 'inset 0 0 0 8px #f0f4f8, inset 0 0 0 10px #1e3a5f' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
              <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png" alt="WR" style={{ width: 60, height: 60, objectFit: 'contain' }} crossOrigin="anonymous" />
              <p style={{ fontSize: 11, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>WR — Instituto de Desenvolvimento Humano</p>
              <div style={{ width: 60 }} />
            </div>
            <p style={{ fontSize: 11, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 8px' }}>Certificado de Reconhecimento Acadêmico</p>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 28px', letterSpacing: 2, textTransform: 'uppercase' }}>Monitor de Excelência</h1>
            <p style={{ fontSize: 13, color: '#444', margin: '0 0 10px' }}>Certificamos que</p>
            <h2 style={{ fontSize: 30, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 20px', fontStyle: 'italic' }}>{certStudent?.student_name}</h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.9, maxWidth: 480, margin: '0 auto 24px', textAlign: 'justify' }}>
              foi reconhecido(a) como <strong>Monitor de Classe por Mérito Acadêmico</strong>, alcançando a{' '}
              <strong>{certStudent?.rank_position === 1 ? '1ª' : certStudent?.rank_position === 2 ? '2ª' : '3ª'} posição</strong>{' '}
              no Ranking Geral de Desempenho, demonstrando excelência e dedicação, durante o período de{' '}
              <strong>{certStudent?.period_start ? format(new Date(certStudent.period_start + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>{' '}
              a <strong>{certStudent?.period_end ? format(new Date(certStudent.period_end + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>.
            </p>
            <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '0 auto 24px' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#1e3a5f', marginBottom: 2, letterSpacing: 1 }}>W.Ribeiro</div>
                <div style={{ width: 160, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
                  <p style={{ fontSize: 10, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1 }}>DIREÇÃO GERAL</p>
                  <p style={{ fontSize: 9, color: '#888', margin: 0 }}>WR — Instituto de Desenvolvimento Humano</p>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 24, paddingTop: 12 }}>
              <p style={{ fontSize: 9, color: '#aaa', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
                Documento emitido digitalmente pela plataforma WR-EDU · {format(new Date(), 'yyyy')}
              </p>
            </div>
          </div>
          <Button onClick={handlePrintCert} className="gap-2 w-full mt-2">
            <Download size={15} /> Baixar Certificado em PDF
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}