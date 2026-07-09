import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Star, BookOpen, Heart, Trophy, MessageSquare, CheckCircle, CircleHelp, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatScore, rankingScoreValue, sumRoundedScores, parseUtcDate } from '@/lib/scoreUtils';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, WR_SIGNATURE_IMAGE } from '@/lib/brand';
import { saveBlobWithPicker } from '@/lib/fileExport';

const CATEGORY_CONFIG = {
  lesson:          { label: 'Aula Gravada',              icon: BookOpen,      color: 'bg-purple-100 text-purple-700' },
  task:            { label: 'Atividade Complementar',    icon: Heart,         color: 'bg-pink-100 text-pink-700' },
  exam:            { label: 'Prova / Avaliação',          icon: Trophy,        color: 'bg-blue-100 text-blue-700' },
  forum:           { label: 'Fórum / Debates / Ofensiva', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  live_attendance: { label: 'Presença em Live',           icon: CheckCircle,   color: 'bg-sky-100 text-sky-700' },
  therapist:       { label: 'Atividade Complementar',    icon: Heart,         color: 'bg-pink-100 text-pink-700' },
  other:           { label: 'Outras Pontuações',          icon: CircleHelp,    color: 'bg-slate-100 text-slate-700' },
};

// Mostra o detalhamento por categoria das atividades de um aluno dentro da janela
// de um período já encerrado (entre o corte anterior e o corte deste período).
export default function PeriodStudentDetailModal({ email, name, points, periodStart, periodEnd, onClose }) {
  const [printing, setPrinting] = useState(false);
  const printRef = useRef(null);

  const { data: allScoreItems = [] } = useQuery({
    queryKey: ['period-detail-score-items', email],
    queryFn: () => base44.entities.ScoreItem.filter({ student_email: email }, '-created_date', 2000),
  });

  const byCategory = useMemo(() => {
    const seen = new Map();
    for (const s of allScoreItems) {
      if (!s.verified || !s.category || !s.ref_id) continue;
      const created = parseUtcDate(s.created_date);
      if (!created) continue;
      if (periodStart && created <= periodStart) continue;
      if (periodEnd && created > periodEnd) continue;
      const key = `${s.category}|${s.ref_id}`;
      const prev = seen.get(key);
      if (!prev || (Number(prev.score) || 0) < (Number(s.score) || 0)) seen.set(key, s);
    }
    const grouped = {};
    for (const item of seen.values()) {
      const normalized = item.category === 'quiz' ? 'exam' : item.category;
      const category = CATEGORY_CONFIG[normalized] ? normalized : 'other';
      grouped[category] = grouped[category] || [];
      grouped[category].push(item);
    }
    return grouped;
  }, [allScoreItems, periodStart, periodEnd]);

  const rangeLabel = periodStart && periodEnd
    ? `${format(periodStart, "dd/MM/yyyy")} a ${format(periodEnd, "dd/MM/yyyy")}`
    : 'Período encerrado';
  const emissionDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const emissionTime = format(new Date(), 'HH:mm:ss');

  const handlePrintPeriod = async () => {
    if (!printRef.current) return;
    setPrinting(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfW, imgH);
        heightLeft -= pageH;
      }
      const blob = pdf.output('blob');
      await saveBlobWithPicker(blob, `historico-periodo-${(name || 'aluno').replace(/\s+/g, '-')}.pdf`, 'application/pdf');
      toast.success('Histórico do período salvo em PDF.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0 bg-primary">
            {name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-foreground truncate">{name}</h3>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-base font-black text-yellow-600">{formatScore(points)} pts</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors shrink-0">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <button
            onClick={handlePrintPeriod}
            disabled={printing}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-primary text-primary-foreground px-3 py-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Printer size={13} /> {printing ? 'Gerando PDF...' : `Imprimir Histórico deste Período (${rangeLabel})`}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(CATEGORY_CONFIG).map((cat) => {
            const items = byCategory[cat] || [];
            if (items.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            const catTotal = sumRoundedScores(items.map(rankingScoreValue));
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${cfg.color}`}>
                    {React.createElement(cfg.icon, { size: 12 })}
                  </div>
                  <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                  <span className="ml-auto text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                    {formatScore(catTotal)} pts
                  </span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      <span className="text-xs text-foreground flex-1 truncate">{item.ref_title}</span>
                      <span className="text-xs font-bold text-foreground shrink-0">{formatScore(item.score)} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(byCategory).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada neste período.</p>
          )}
        </div>
      </div>

      {/* Printable document — rendered off-screen, captured via html2canvas */}
      <div style={{ position: 'fixed', left: -9999, top: 0 }}>
        <div
          ref={printRef}
          className="bg-white"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            width: 794,
            minHeight: 400,
            padding: '40px 48px',
            border: '2px solid #1e3a5f',
            boxShadow: 'inset 0 0 0 6px #f0f4f8, inset 0 0 0 8px #1e3a5f',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
            <img src={WR_CERTIFICATE_LOGO} alt="Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} crossOrigin="anonymous" />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <p style={{ fontSize: 10, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>{BRAND_LEGAL_NAME}</p>
              <p style={{ fontSize: 9, color: '#888', margin: '4px 0 0', letterSpacing: 2, textTransform: 'uppercase' }}>Terapia · Educação · Desenvolvimento Pessoal</p>
            </div>
            <div style={{ width: 70 }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 10, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 6px' }}>Documento Oficial</p>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', color: '#1e3a5f', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>Histórico do Período</h1>
            <p style={{ fontSize: 11, color: '#555', margin: '6px 0 0' }}>{rangeLabel}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', background: '#f8fafc', border: '1px solid #dde4ec', borderRadius: 8, padding: '14px 18px', marginBottom: 24, fontSize: 11 }}>
            <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Aluno(a)</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{name}</p></div>
            <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Pontuação no Período</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{formatScore(points)} pts</p></div>
            <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Data de Emissão</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{emissionDate}</p></div>
            <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Horário de Emissão</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{emissionTime}</p></div>
          </div>

          <p style={{ fontSize: 10, letterSpacing: 3, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 'bold' }}>Atividades do Período</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ background: '#1e3a5f' }}>
                <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Atividade</th>
                <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Categoria</th>
                <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(CATEGORY_CONFIG).flatMap((cat) => byCategory[cat] || []).length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '16px 8px', textAlign: 'center', color: '#aaa', fontSize: 10 }}>Nenhuma atividade registrada neste período.</td></tr>
              ) : Object.keys(CATEGORY_CONFIG).flatMap((cat) => (byCategory[cat] || []).map((item) => ({ item, cat }))).map(({ item, cat }, i) => (
                <tr key={item.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', color: '#1e3a5f', maxWidth: 220 }}>{item.ref_title}</td>
                  <td style={{ padding: '5px 8px', color: '#555' }}>{CATEGORY_CONFIG[cat].label}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1e3a5f' }}>{formatScore(item.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', fontSize: 11 }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#888', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Total do Período</span>
              <p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{formatScore(points)} pts</p>
            </div>
          </div>

          <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '24px auto 20px' }} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <img src={WR_SIGNATURE_IMAGE} alt="Assinatura" crossOrigin="anonymous" style={{ width: 200, height: 66, objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
              <div style={{ width: 180, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
                <p style={{ fontSize: 9, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>Direção Geral</p>
                <p style={{ fontSize: 8, color: '#888', margin: '2px 0 0' }}>{BRAND_LEGAL_NAME}</p>
                <p style={{ fontSize: 8, color: '#888', margin: '2px 0 0' }}>CNPJ: {BRAND_CNPJ}</p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 20, paddingTop: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 8, color: '#aaa', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
              Documento emitido digitalmente pela {BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ} · {emissionDate} às {emissionTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}