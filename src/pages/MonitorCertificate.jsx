import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, formatDocumentIssuer } from '@/lib/brand';

export default function MonitorCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const certRef = useRef(null);

  const { data: monitorHistory = [], isLoading } = useQuery({
    queryKey: ['monitor-certificate-history', id],
    queryFn: () => base44.entities.MonitorHistory.list('-period_start', 200),
  });

  const certStudent = monitorHistory.find((item) => item.id === id);

  const getCertificateCanvas = async () => {
    if (!certRef.current || !certStudent) return;
    return html2canvas(certRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
  };

  const handleDownloadPDF = async () => {
    const canvas = await getCertificateCanvas();
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`certificado-monitor-${certStudent.student_name?.replace(/\s/g, '-') || 'aluno'}.pdf`);
    toast.success('Certificado em PDF baixado com sucesso.');
  };

  const handleDownloadPNG = async () => {
    const canvas = await getCertificateCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `certificado-monitor-${certStudent.student_name?.replace(/\s/g, '-') || 'aluno'}.png`;
    link.click();
    toast.success('Certificado em PNG baixado com sucesso.');
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando certificado...</div>;
  }

  if (!certStudent) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center space-y-4">
        <Crown size={42} className="mx-auto text-yellow-500 opacity-60" />
        <h2 className="text-xl font-bold">Certificado não encontrado</h2>
        <p className="text-sm text-muted-foreground">Verifique se o link recebido no aviso está correto.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2"><ArrowLeft size={14} /> Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2"><Crown size={22} className="text-yellow-500" /> Certificado de Monitor</h2>
          <p className="text-sm text-muted-foreground">Baixe em PDF ou PNG e escolha onde salvar no seu dispositivo.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2"><ArrowLeft size={14} /> Voltar</Button>
          <Button onClick={handleDownloadPDF} className="gap-2"><Download size={15} /> Baixar PDF</Button>
          <Button variant="secondary" onClick={handleDownloadPNG} className="gap-2"><Download size={15} /> Baixar PNG</Button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-2xl border border-border bg-secondary/20 p-3">
        <div ref={certRef} className="bg-white text-center mx-auto" style={{ fontFamily: 'Georgia, "Times New Roman", serif', width: 980, minHeight: 680, padding: '64px 72px', border: '2px solid #1e3a5f', boxShadow: 'inset 0 0 0 8px #f0f4f8, inset 0 0 0 10px #1e3a5f' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 28 }}>
            <img src={WR_CERTIFICATE_LOGO} alt="WR" style={{ width: 68, height: 68, objectFit: 'contain' }} crossOrigin="anonymous" />
            <p style={{ fontSize: 12, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>{BRAND_LEGAL_NAME}</p>
            <div style={{ width: 68 }} />
          </div>
          <p style={{ fontSize: 12, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 10px' }}>Certificado de Reconhecimento Acadêmico</p>
          <h1 style={{ fontSize: 34, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 34px', letterSpacing: 2, textTransform: 'uppercase' }}>Monitor de Excelência</h1>
          <p style={{ fontSize: 15, color: '#444', margin: '0 0 12px' }}>Certificamos que</p>
          <h2 style={{ fontSize: 38, fontWeight: 'bold', color: '#1e3a5f', margin: '0 0 24px', fontStyle: 'italic' }}>{certStudent.student_name}</h2>
          <p style={{ fontSize: 15, color: '#444', lineHeight: 1.9, maxWidth: 620, margin: '0 auto 30px', textAlign: 'justify' }}>
            foi reconhecido(a) como <strong>Monitor de Classe por Mérito Acadêmico</strong>, integrando o grupo de destaque da turma e demonstrando excelência e dedicação, durante o período de{' '}
            <strong>{certStudent.period_start ? format(new Date(certStudent.period_start + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>{' '}
            a <strong>{certStudent.period_end ? format(new Date(certStudent.period_end + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}</strong>.
          </p>
          <div style={{ width: 96, height: 2, background: '#c9a84c', margin: '0 auto 30px' }} />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontStyle: 'italic', color: '#1e3a5f', marginBottom: 2, letterSpacing: 1 }}>W.Ribeiro</div>
              <div style={{ width: 180, borderTop: '1px solid #1e3a5f', paddingTop: 8 }}>
                <p style={{ fontSize: 11, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1 }}>DIREÇÃO GERAL</p>
                <p style={{ fontSize: 10, color: '#888', margin: 0 }}>{BRAND_LEGAL_NAME}</p>
                <p style={{ fontSize: 10, color: '#888', margin: 0 }}>CNPJ: {BRAND_CNPJ}</p>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 34, paddingTop: 14 }}>
            <p style={{ fontSize: 10, color: '#aaa', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
              {formatDocumentIssuer(format(new Date(), 'yyyy'))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
