import React, { useMemo, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { useDisplayNameResolver } from '@/hooks/useOvercomingWall';
import { Crown, Download, Calendar, RotateCcw, UserPlus, MessageCircle, BarChart3, Trash2, Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO } from '@/lib/brand';
import { saveBlobWithPicker, shareBlob } from '@/lib/fileExport';

const MONITOR_BONUSES = { 1: 0.5, 2: 0.3, 3: 0.2 };

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
  const { getDisplayName } = useDisplayNameResolver();

  // Current course for filtering based on route (/adm/sex => SEX- / sexologia)
  const { emails: courseEmails, course: routeCourse } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';

  const { data: scoreItems = [] } = useQuery({
    queryKey: ['score-items-monitores'],
    queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000),
  });

  const { data: accessCodes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });




  const { data: monitorHistory = [] } = useQuery({
    queryKey: ['monitor-history'],
    queryFn: () => base44.entities.MonitorHistory.list('-period_start', 100),
  });


  const { data: monitorChat = [] } = useQuery({
    queryKey: ['monitor-chat', activeCourse],
    queryFn: () => base44.entities.ChatMessage.filter({ session_id: `monitor-room-${activeCourse}` }, '-created_date', 200),
    refetchInterval: 5000,
  });

  const [chatMessage, setChatMessage] = useState('');

  // Monitores são definidos e reiniciados manualmente pelo administrador,
  // sem nenhum ciclo automático baseado em tempo. O "período atual" é sempre
  // o lote mais recente definido para esta turma.
  const courseHistory = monitorHistory.filter(
    m => m.course === activeCourse || (!m.course && activeCourse === 'tcc')
  );
  const latestPeriodStart = courseHistory.reduce(
    (max, m) => (!max || m.period_start > max ? m.period_start : max),
    null
  );
  const currentMonitors = latestPeriodStart
    ? courseHistory.filter(m => m.period_start === latestPeriodStart)
    : [];
  const periodStart = latestPeriodStart || format(new Date(), 'yyyy-MM-dd');
  const periodEnd = currentMonitors[0]?.period_end || periodStart;

  // Course students
  const courseStudents = accessCodes.filter(
    c => c.is_active !== false && c.course === activeCourse && c.student_email && (!courseEmails || courseEmails.has(c.student_email))
  );

  // Ranking instantâneo: usa exclusivamente o cache AccessCode.pontuacao_total.
  const ranking = courseStudents
    .map((code) => ({
      email: code.student_email,
      total: roundScore(code.pontuacao_total || 0),
      name: (getDisplayName(code.student_email) || code.profile_name || code.student_name || code.student_email || '').toLowerCase(),
      createdAt: code.created_date ? new Date(code.created_date).getTime() : Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  const topMonitors = ranking.slice(0, 3);

  const currentMonitorEmails = new Set(currentMonitors.map(m => m.student_email));
  const canUseMonitorChat = isTeacher || currentMonitorEmails.has(session?.email);

  const weeklyReport = useMemo(() => {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return currentMonitors.map(m => {
      const interactions = scoreItems.filter(s => s.student_email === m.student_email && new Date(s.created_date || 0).getTime() >= weekAgo).length;
      return { ...m, interactions };
    });
  }, [currentMonitors, scoreItems]);

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
      // Data em que o administrador definiu manualmente os monitores (sem ciclo automático)
      const newPeriodStart = format(new Date(), 'yyyy-MM-dd');
      const newPeriodEnd = format(addDays(new Date(), 6), 'yyyy-MM-dd');
      for (let i = 0; i < topMonitors.length; i++) {
        const r = topMonitors[i];
        const code = accessCodes.find(c => c.student_email === r.email);
        await base44.entities.MonitorHistory.create({
          student_email: r.email,
          student_name: getDisplayName(r.email) || code?.profile_name || code?.student_name || r.email,
          period_start: newPeriodStart,
          period_end: newPeriodEnd,
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
      name: getDisplayName(email) || code?.profile_name || code?.student_name || email,
      photo: code?.profile_photo_url || '',
      color: code?.profile_avatar_color || '#5b5ef4',
    };
  };

  const getCertificateCanvas = async () => {
    if (!certRef.current || !certStudent) return null;
    return html2canvas(certRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
  };

  const getCertificateFileBase = () => `certificado-monitor-${(getDisplayName(certStudent?.student_email) || certStudent?.student_name || 'aluno').replace(/\s/g, '-')}`;

  const handleDownloadPDF = async () => {
    const canvas = await getCertificateCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    const blob = pdf.output('blob');
    await saveBlobWithPicker(blob, `${getCertificateFileBase()}.pdf`, 'application/pdf');
    toast.success('Certificado salvo em PDF.');
  };

  const handleDownloadPNG = async () => {
    const canvas = await getCertificateCanvas();
    if (!canvas) return;
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!pngBlob) return;
    await saveBlobWithPicker(pngBlob, `${getCertificateFileBase()}.png`, 'image/png');
    toast.success('Certificado salvo em PNG.');
  };

  const handleShare = async () => {
    const canvas = await getCertificateCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    const blob = pdf.output('blob');
    const shared = await shareBlob(blob, `${getCertificateFileBase()}.pdf`, 'application/pdf', 'Certificado de Monitor');
    if (shared) toast.success('Compartilhamento aberto.');
    else toast.error('Compartilhamento não suportado neste dispositivo.');
  };

  const handleDeleteHistory = async (id) => {
    if (!isTeacher) return;
    await base44.entities.MonitorHistory.delete(id);
    await queryClient.invalidateQueries({ queryKey: ['monitor-history'] });
    toast.success('Entrada do histórico removida.');
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    try {
      await base44.entities.ChatMessage.create({
        session_id: `monitor-room-${activeCourse}`,
        author_name: session?.full_name || session?.name || session?.email || 'Monitor',
        author_email: session?.email || '',
        content: chatMessage.trim(),
      });
      setChatMessage('');
      await queryClient.invalidateQueries({ queryKey: ['monitor-chat', activeCourse] });
    } catch (e) {
      toast.error('Falha ao enviar mensagem no chat.');
    }
  };

  const courseLabel = { tcc: 'TC', psicanalise: 'Psicanálise', sexologia: 'Sexologia' }[activeCourse] || activeCourse;

  return (
    <div className="app-page app-page--narrow space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown size={22} className="text-yellow-500" /> Monitores do Período
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Turma {courseLabel} · {currentMonitors.length > 0
              ? `Definidos manualmente em ${format(new Date(periodStart + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}`
              : 'Nenhum monitor definido ainda'}
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
            <li>Ranking lido diretamente do cache pontuacao_total, sem recalcular a cada acesso</li>
            <li>1º Monitor: +0,500pts / 2º Monitor: +0,300pts / 3º Monitor: +0,200pts em entregas de atividades e trabalhos</li>
          </ol>
        </div>
      )}

      {/* Monitores atuais */}
      {currentMonitors.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <Crown size={40} className="mx-auto mb-3 text-yellow-400 opacity-40" />
          <p className="font-semibold text-muted-foreground">Nenhum monitor definido no momento</p>
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
                    Bônus: +{formatScore(MONITOR_BONUSES[m.rank_position] || 0.2)} por atividade
                  </p>
                </div>
                {(isMe || isTeacher) && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs w-full" onClick={() => setCertStudent(m)}>
                    <Download size={12} /> Certificado
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
                        <span className="font-semibold">{getDisplayName(m.student_email) || m.student_name}</span>
                        <span className="text-muted-foreground">#{m.rank_position}</span>
                        {isTeacher && (
                          <button onClick={() => handleDeleteHistory(m.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><BarChart3 size={14} className="text-primary" /> Relatório Semanal dos Monitores</h3>
          <div className="space-y-2">
            {weeklyReport.length === 0 && <p className="text-xs text-muted-foreground">Sem monitores ativos no momento.</p>}
            {weeklyReport.map(item => (
              <div key={item.student_email} className="rounded-xl border border-border p-3 bg-secondary/20">
                <p className="text-sm font-semibold">{getDisplayName(item.student_email) || item.student_name}</p>
                <p className="text-xs text-muted-foreground">Frequência de interações (7 dias): {item.interactions}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {canUseMonitorChat && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-3"><MessageCircle size={14} className="text-primary" /> Chat de Monitores (tempo real)</h3>
          <p className="text-xs text-muted-foreground mb-3">Canal privado para troca de boas práticas entre monitores.</p>
          <div className="max-h-56 overflow-y-auto space-y-2 border rounded-xl p-3 bg-secondary/10">
            {[...monitorChat].reverse().map(msg => (
              <div key={msg.id} className="text-xs">
                <span className="font-semibold text-foreground">{getDisplayName(msg.author_email) || msg.author_name || msg.author_email}: </span>
                <span className="text-muted-foreground">{msg.content}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Compartilhe uma dica ou dúvida..." />
            <Button onClick={handleSendChat} className="gap-2"><Send size={14} /> Enviar</Button>
          </div>
        </div>
      )}

      {/* Dialog Certificado */}
      <Dialog open={!!certStudent} onOpenChange={() => setCertStudent(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Certificado de Monitor</DialogTitle></DialogHeader>
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-2xl border border-border bg-secondary/20 p-3 scroll-smooth">
          <div ref={certRef} className="bg-white text-center mx-auto" style={{ fontFamily: 'Georgia, "Times New Roman", serif', width: 820, minHeight: 520, padding: '48px 56px', border: '2px solid #1e3a5f', boxShadow: 'inset 0 0 0 8px #f0f4f8, inset 0 0 0 10px #1e3a5f' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
              <img src={WR_CERTIFICATE_LOGO} alt="WR" style={{ width: 60, height: 60, objectFit: 'contain' }} crossOrigin="anonymous" />
              <p style={{ fontSize: 11, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>{BRAND_LEGAL_NAME}</p>
              <div style={{ width: 60 }} />
            </div>
            <p style={{ fontSize: 11, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 8px' }}>Certificado de Reconhecimento Acadêmico</p>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 28px', letterSpacing: 2, textTransform: 'uppercase' }}>Monitor de Excelência</h1>
            <p style={{ fontSize: 13, color: '#444', margin: '0 0 10px' }}>Certificamos que</p>
            <h2 style={{ fontSize: 30, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 20px', fontStyle: 'italic' }}>{getDisplayName(certStudent?.student_email) || certStudent?.student_name}</h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.9, maxWidth: 480, margin: '0 auto 24px', textAlign: 'justify' }}>
              foi reconhecido(a) como <strong>Monitor de Classe por Mérito Acadêmico</strong>, integrando o grupo de destaque da turma entre as melhores notas da semana, demonstrando excelência e dedicação, durante o período de{' '}
              <strong>{certStudent?.period_start ? format(new Date(certStudent.period_start + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>{' '}
              a <strong>{certStudent?.period_end ? format(new Date(certStudent.period_end + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>.
            </p>
            <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '0 auto 24px' }} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#1e3a5f', marginBottom: 2, letterSpacing: 1 }}>W.Ribeiro</div>
                <div style={{ width: 160, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
                  <p style={{ fontSize: 10, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1 }}>DIREÇÃO GERAL</p>
                  <p style={{ fontSize: 9, color: '#888', margin: 0 }}>{BRAND_LEGAL_NAME}</p>
                  <p style={{ fontSize: 9, color: '#888', margin: 0 }}>CNPJ: {BRAND_CNPJ}</p>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 24, paddingTop: 12 }}>
              <p style={{ fontSize: 9, color: '#aaa', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
                Documento emitido digitalmente pela WR-EDU Instituto de Desenvolvimento Humano · CNPJ 62.213.790/0001-40 · {format(new Date(), 'yyyy')}
              </p>
            </div>
          </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <Button onClick={handleDownloadPDF} className="gap-2 w-full">
              <Download size={15} /> Salvar PDF
            </Button>
            <Button variant="secondary" onClick={handleDownloadPNG} className="gap-2 w-full">
              <Download size={15} /> Salvar PNG
            </Button>
            <Button variant="outline" onClick={handleShare} className="gap-2 w-full">
              Compartilhar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
