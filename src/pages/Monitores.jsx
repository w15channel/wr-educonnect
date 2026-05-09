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

const MONITOR_BONUS = 0.2;
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

  // Build multi-criteria ranking
  const buildRanking = () => {
    // 1. Score totals
    const scoreMap = {};
    scoreItems.filter(s => s.verified).forEach(s => {
      if (!s.student_email) return;
      if (!scoreMap[s.student_email]) scoreMap[s.student_email] = 0;
      scoreMap[s.student_email] += (s.score || 0);
    });

    // 4. Task + forum activity count
    const activityMap = {};
    submissions.forEach(s => {
      if (!s.student_email) return;
      activityMap[s.student_email] = (activityMap[s.student_email] || 0) + 1;
    });
    forumPosts.forEach(p => {
      if (!p.author_email) return;
      activityMap[p.author_email] = (activityMap[p.author_email] || 0) + 1;
    });
    forumReplies.forEach(r => {
      if (!r.author_email) return;
      activityMap[r.author_email] = (activityMap[r.author_email] || 0) + 1;
    });

    return [...courseStudents].sort((a, b) => {
      // 1. Points (descending)
      const scoreA = scoreMap[a.student_email] || 0;
      const scoreB = scoreMap[b.student_email] || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      // 2. Ordem de matrícula (created_date ascending — quem matriculou primeiro tem prioridade)
      const dateA = new Date(a.created_date || '9999-01-01').getTime();
      const dateB = new Date(b.created_date || '9999-01-01').getTime();
      if (dateA !== dateB) return dateA - dateB;

      // 3. Alfabético
      const nameA = (a.profile_name || a.student_name || '').toLowerCase();
      const nameB = (b.profile_name || b.student_name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;

      // 4. Participação (tarefas + fórum)
      return (activityMap[b.student_email] || 0) - (activityMap[a.student_email] || 0);
    });
  };

  const ranking = buildRanking();
  const topMonitors = ranking.slice(0, 3);

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
        const code = topMonitors[i];
        await base44.entities.MonitorHistory.create({
          student_email: code.student_email,
          student_name: code.profile_name || code.student_name || code.student_email,
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
            <li>Ordem de matrícula (aluno mais antigo tem prioridade em caso de empate)</li>
            <li>Ordem alfabética do nome</li>
            <li>Maior participação (tarefas entregues + posts no fórum)</li>
          </ol>
        </div>
      )}

      {/* Ranking preview */}
      {isTeacher && ranking.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Ranking Atual da Turma {courseLabel}</p>
          <div className="space-y-2">
            {ranking.slice(0, 5).map((code, i) => (
              <div key={code.id} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30">
                <span className="text-sm w-6 text-center shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-muted-foreground font-bold">{i + 1}</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{code.profile_name || code.student_name || code.student_email}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold">{scoreItems.filter(s => s.verified && s.student_email === code.student_email).reduce((sum, s) => sum + (s.score || 0), 0)}</span>
                </div>
              </div>
            ))}
            {ranking.length > 5 && <p className="text-xs text-muted-foreground text-center">{ranking.length - 5} alunos adicionais no ranking</p>}
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
                    Bônus: +{MONITOR_BONUS} por atividade
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