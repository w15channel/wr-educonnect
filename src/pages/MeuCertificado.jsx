import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, FileImage, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import CertificateFront from '@/components/certificates/CertificateFront';
import CertificateBack from '@/components/certificates/CertificateBack';
import { CERT_W, CERT_H, makeVerifUrl, normalizeCode } from '@/pages/AdminCertificateGenerator';

const POSITIONS_KEY = 'wr_cert_front_positions_v2';

const DEFAULT_POSITIONS = {
  gratification: { x: 526, y: 195 },
  name:          { x: 526, y: 285 },
  body:          { x: 526, y: 430 },
  qr:            { x: 890, y: 618 },
};

function loadPositions() {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) return { ...DEFAULT_POSITIONS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_POSITIONS };
}

/**
 * Maps a CertificateRecord (DB format) → cert object expected by CertificateFront/CertificateBack
 */
function recordToCert(r) {
  return {
    studentName:       r.student_name || '',
    studentDocument:   r.student_document || '',
    studentEmail:      r.student_email || '',
    studentAccessCode: r.student_access_code || '',
    courseName:        r.course_name || '',
    gratificationText: r.gratification_text || 'É com imensa satisfação que certificamos que',
    bodyText:          r.description || 'concluiu com êxito o curso de formação profissional, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
    totalHours:        r.total_hours || 120,
    averageGrade:      r.average_grade || '10,0',
    issueDate:         r.issue_date || '',
    verificationCode:  normalizeCode(r.verification_code || ''),
    honorTitle:        r.honor_title || '',
    honorDescription:  r.honor_description || '',
    classes:           Array.isArray(r.classes) ? r.classes : [],
  };
}

export default function MeuCertificado() {
  const { user: session } = useOutletContext();
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const positions = loadPositions();

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['my-certificates', session?.email],
    queryFn: () => base44.entities.CertificateRecord.filter(
      { student_email: session?.email || '' },
      '-created_date',
      10
    ),
    enabled: !!session?.email,
  });

  // Use access code as fallback if email not found
  const { data: certsByCode = [] } = useQuery({
    queryKey: ['my-certificates-code', session?.code],
    queryFn: () => base44.entities.CertificateRecord.filter(
      { student_access_code: session?.code || '' },
      '-created_date',
      10
    ),
    enabled: !certificates.length && !!session?.code,
  });

  const record = certificates[0] || certsByCode[0];
  const cert = record ? recordToCert(record) : null;

  const waitImages = async (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      });
    }));
  };

  const captureNode = async (node) => {
    await waitImages(node);
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: CERT_W,
      height: CERT_H,
      backgroundColor: null,
    });
    return canvas.toDataURL('image/png');
  };

  const downloadPdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    setIsGenerating(true);
    try {
      const [front, back] = await Promise.all([
        captureNode(frontRef.current),
        captureNode(backRef.current),
      ]);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(front, 'PNG', 0, 0, 297, 210);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(back, 'PNG', 0, 0, 297, 210);
      const safeName = (cert.studentName || 'aluno')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      pdf.save(`certificado-${safeName}.pdf`);
      toast.success('Certificado baixado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar PDF: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPng = async () => {
    if (!frontRef.current) return;
    setIsGenerating(true);
    try {
      const img = await captureNode(frontRef.current);
      const link = document.createElement('a');
      link.href = img;
      link.download = `certificado-${(cert.studentName || 'aluno').replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PNG baixado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar PNG: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="app-page space-y-6 animate-fade-in-up max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
          <Award size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Meu Certificado</h2>
          <p className="text-sm text-muted-foreground">Baixe seu certificado de conclusão</p>
        </div>
      </div>

      {!cert ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <AlertCircle size={40} className="mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="font-bold text-foreground">Nenhum certificado disponível ainda</p>
          <p className="text-sm text-muted-foreground mt-2">
            Seu certificado aparecerá aqui assim que o professor emitir. Continue completando os requisitos na aba Certificação.
          </p>
        </div>
      ) : (
        <>
          {/* Action bar */}
          <div className="flex flex-wrap gap-3 items-center p-4 bg-card border border-border rounded-2xl">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{cert.courseName}</p>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span className="text-xs text-muted-foreground font-mono">{cert.verificationCode}</span>
              </div>
            </div>
            <button
              onClick={downloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition"
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Baixar PDF (frente + verso)
            </button>
            <button
              onClick={downloadPng}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 border border-border bg-background text-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-secondary disabled:opacity-50 transition"
            >
              <FileImage size={16} /> PNG
            </button>
          </div>

          {/* Preview */}
          <div className="space-y-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Frente</p>
            <CertificateFront
              cert={cert}
              certRef={frontRef}
              editMode={false}
              positions={positions}
              onPositionsChange={() => {}}
            />

            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-4 mb-2">Verso</p>
            <CertificateBack cert={cert} certRef={backRef} />
          </div>

          {/* Verify link */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Certificado com autenticidade verificável</p>
              <p className="text-xs mt-0.5">
                Código: <span className="font-mono font-bold">{cert.verificationCode}</span> ·{' '}
                <a
                  href={`/validar-certificado?codigo=${cert.verificationCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-emerald-700"
                >
                  Verificar autenticidade
                </a>
              </p>
            </div>
          </div>
        </>
      )}


    </div>
  );
}