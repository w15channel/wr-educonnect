import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, Crown, Download, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MONITOR_BONUS = 0.2;

function MonitorBadge({ rank }) {
  const colors = {
    1: 'bg-yellow-400 text-yellow-900',
    2: 'bg-slate-300 text-slate-800',
    3: 'bg-amber-600 text-amber-100',
  };
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
    queryFn: () => base44.entities.MonitorHistory.list('-period_start', 50),
  });

  // Calcula ranking filtrado por curso para alunos
  const courseEmailsSet = isTeacher ? null : new Set(
    accessCodes.filter(c => c.course === session?.course && c.student_email).map(c => c.student_email)
  );
  const rankMap = {};
  scoreItems.filter(s => s.verified).forEach(s => {
    if (!s.student_email) return;
    if (courseEmailsSet && !courseEmailsSet.has(s.student_email)) return;
    if (!rankMap[s.student_email]) rankMap[s.student_email] = { email: s.student_email, total: 0 };
    rankMap[s.student_email].total += (s.score || 0);
  });
  const ranking = Object.values(rankMap).sort((a, b) => b.total - a.total);
  const topMonitors = ranking.slice(0, 3);

  // Período atual (semana)
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Monitores atuais: os definidos na semana vigente OU os mais recentes
  const latestPeriod = monitorHistory.length > 0
    ? [...monitorHistory].sort((a, b) => b.period_start.localeCompare(a.period_start))[0]?.period_start
    : null;
  const currentMonitors = monitorHistory.filter(m => m.period_start === weekStart);

  const handleDefineMonitors = async () => {
    if (currentMonitors.length > 0) {
      toast.info('Monitores desta semana já foram definidos.');
      return;
    }
    if (topMonitors.length === 0) {
      toast.error('Nenhum aluno pontuado encontrado no ranking. Verifique se há ScoreItems verificados.');
      return;
    }
    setDefining(true);
    try {
      for (let i = 0; i < topMonitors.length; i++) {
        const m = topMonitors[i];
        const code = accessCodes.find(c => c.student_email === m.email);
        const name = code?.profile_name || code?.student_name || m.email;
        await base44.entities.MonitorHistory.create({
          student_email: m.email,
          student_name: name,
          period_start: weekStart,
          period_end: weekEnd,
          rank_position: i + 1,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['monitor-history'] });
      toast.success('✅ Monitores da semana definidos com sucesso!');
    } catch (e) {
      console.error('Erro ao definir monitores:', e);
      toast.error('Erro ao definir monitores: ' + (e?.message || 'tente novamente'));
    } finally {
      setDefining(false);
    }
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

  const myMonitor = currentMonitors.find(m => m.student_email === session?.email);

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown size={22} className="text-yellow-500" /> Monitores da Semana
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(today, "'Semana de' dd/MM", { locale: ptBR })} — Top 3 alunos por pontuação
          </p>
        </div>
        {isTeacher && (
          <Button onClick={handleDefineMonitors} className="gap-2" disabled={defining}>
            <RefreshCw size={15} className={defining ? 'animate-spin' : ''} /> 
            {defining ? 'Definindo...' : 'Definir Monitores da Semana'}
          </Button>
        )}
      </div>

      {/* Monitores atuais */}
      {currentMonitors.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <Crown size={40} className="mx-auto mb-3 text-yellow-400 opacity-40" />
          <p className="font-semibold text-muted-foreground">Nenhum monitor definido esta semana</p>
          {isTeacher && <p className="text-xs text-muted-foreground mt-1">Clique em "Definir Monitores" para selecionar automaticamente os 3 primeiros do ranking.</p>}
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
                {isMe && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs w-full"
                    onClick={() => setCertStudent(m)}
                  >
                    <Download size={12} /> Certificado PDF
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico */}
      {monitorHistory.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-sm text-foreground mb-4 flex items-center gap-2">
            <Calendar size={15} className="text-primary" /> Histórico de Monitores
          </h3>
          <div className="space-y-2">
            {[...new Set(monitorHistory.map(m => m.period_start))].sort((a, b) => b.localeCompare(a)).map(period => {
              const group = monitorHistory.filter(m => m.period_start === period).sort((a, b) => a.rank_position - b.rank_position);
              return (
                <div key={period} className="bg-secondary/40 rounded-xl p-3">
                  <p className="text-xs font-bold text-muted-foreground mb-2">
                    Semana de {format(new Date(period + 'T00:00:00'), 'dd/MM/yyyy')}
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
          <DialogHeader>
            <DialogTitle>Certificado de Monitor</DialogTitle>
          </DialogHeader>
          <div
            ref={certRef}
            className="bg-white text-center"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              minHeight: 480,
              padding: '48px 56px',
              border: '2px solid #1e3a5f',
              boxShadow: 'inset 0 0 0 8px #f0f4f8, inset 0 0 0 10px #1e3a5f',
            }}
          >
            {/* Header institution */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
              <img src="https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png" alt="WR" style={{ width: 60, height: 60, objectFit: 'contain' }} crossOrigin="anonymous" />
              <p style={{ fontSize: 11, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
                WR — Instituto de Desenvolvimento Humano
              </p>
              <div style={{ width: 60 }} />
            </div>

            {/* Title */}
            <p style={{ fontSize: 11, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Certificado de Reconhecimento Acadêmico
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 28px', letterSpacing: 2, textTransform: 'uppercase' }}>
              Monitor de Excelência
            </h1>

            {/* Body */}
            <p style={{ fontSize: 13, color: '#444', margin: '0 0 10px' }}>Certificamos que</p>
            <h2 style={{ fontSize: 30, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 20px', fontStyle: 'italic' }}>
              {certStudent?.student_name}
            </h2>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.9, maxWidth: 480, margin: '0 auto 24px', textAlign: 'justify' }}>
              foi reconhecido(a) como <strong>Monitor de Classe por Mérito Acadêmico</strong>, alcançando a{' '}
              <strong>{certStudent?.rank_position === 1 ? '1ª' : certStudent?.rank_position === 2 ? '2ª' : '3ª'} posição</strong>{' '}
              no Ranking Geral de Desempenho, demonstrando excelência, dedicação e comprometimento com o aprendizado,
              durante o período de{' '}
              <strong>{certStudent?.period_start ? format(new Date(certStudent.period_start + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>{' '}
              a{' '}
              <strong>{certStudent?.period_end ? format(new Date(certStudent.period_end + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>.
            </p>

            {/* Divider */}
            <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '0 auto 24px' }} />

            {/* Signature area */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontStyle: 'italic', color: '#1e3a5f', marginBottom: 2, letterSpacing: 1 }}>W.Ribeiro</div>
                <div style={{ width: 160, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
                  <p style={{ fontSize: 10, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1 }}>DIREÇÃO GERAL</p>
                  <p style={{ fontSize: 9, color: '#888', margin: 0 }}>WR — Instituto de Desenvolvimento Humano</p>
                </div>
              </div>
            </div>

            {/* Footer */}
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