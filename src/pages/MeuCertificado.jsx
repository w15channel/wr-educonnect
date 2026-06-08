import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, Download, FileImage, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, WR_SIGNATURE_IMAGE, ABED_LOGO } from '@/lib/brand';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

const CERTIFICATE_WIDTH_PX = 1123;
const CERTIFICATE_HEIGHT_PX = 794;

const CERTIFICATE_TEMPLATES = [
  { id: 'classic-gold',  accent: '#b99744', soft: '#d9bf75', background: '#ffffff', text: '#000000', flourish: 'circles' },
  { id: 'royal-blue',   accent: '#1d4f91', soft: '#93b4df', background: '#f8fbff', text: '#0f172a', flourish: 'ribbon' },
  { id: 'emerald',      accent: '#047857', soft: '#86efac', background: '#f7fef9', text: '#052e16', flourish: 'corner' },
  { id: 'burgundy',     accent: '#8a1538', soft: '#e4a0b7', background: '#fff8fb', text: '#1f1117', flourish: 'circles' },
  { id: 'graphite',     accent: '#334155', soft: '#cbd5e1', background: '#ffffff', text: '#0f172a', flourish: 'ribbon' },
  { id: 'purple',       accent: '#6d28d9', soft: '#c4b5fd', background: '#fbf8ff', text: '#1e1b4b', flourish: 'corner' },
  { id: 'rose',         accent: '#be6f5d', soft: '#f2c6bd', background: '#fffaf8', text: '#2b1713', flourish: 'circles' },
  { id: 'teal',         accent: '#0f766e', soft: '#99f6e4', background: '#f7fffd', text: '#042f2e', flourish: 'ribbon' },
  { id: 'navy',         accent: '#172554', soft: '#93c5fd', background: '#f8fbff', text: '#020617', flourish: 'corner' },
  { id: 'minimal',      accent: '#111827', soft: '#d1d5db', background: '#ffffff', text: '#111827', flourish: 'none' },
];

function getTemplate(id) {
  return CERTIFICATE_TEMPLATES.find(t => t.id === id) || CERTIFICATE_TEMPLATES[0];
}

function createQrCodeUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(value)}`;
}

function CertFront({ cert, tmpl, frontRef }) {
  const t = tmpl;
  const totalHours = cert.total_hours || 0;
  const averageGrade = cert.average_grade || '10.0';
  const verificationUrl = cert.verification_url || `${window.location.origin}/validar-certificado?codigo=${cert.verification_code}`;

  return (
    <article
      ref={frontRef}
      className="relative mx-auto flex flex-col overflow-hidden px-16 py-12"
      style={{ backgroundColor: t.background, color: t.text, width: CERTIFICATE_WIDTH_PX, height: CERTIFICATE_HEIGHT_PX }}
    >
      <div className="absolute inset-5 border-[3px]" style={{ borderColor: t.accent }} />
      <div className="absolute inset-8 border" style={{ borderColor: t.soft }} />

      {t.flourish === 'circles' && (
        <>
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-10" style={{ backgroundColor: t.accent }} />
          <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-black/5" />
        </>
      )}
      {t.flourish === 'ribbon' && (
        <>
          <div className="absolute left-0 top-0 h-3 w-full" style={{ backgroundColor: t.accent }} />
          <div className="absolute bottom-0 right-0 h-3 w-full" style={{ backgroundColor: t.soft }} />
        </>
      )}
      {t.flourish === 'corner' && (
        <>
          <div className="absolute right-10 top-10 h-24 w-24 border-r-8 border-t-8 opacity-70" style={{ borderColor: t.accent }} />
          <div className="absolute bottom-10 left-10 h-24 w-24 border-b-8 border-l-8 opacity-70" style={{ borderColor: t.soft }} />
        </>
      )}

      <header className="relative z-10 flex items-start justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border bg-white p-2 shadow-lg ring-2" style={{ borderColor: t.accent, '--tw-ring-color': t.soft }}>
            <img src={WR_CERTIFICATE_LOGO} alt="Logo WR" className="h-20 w-20 object-contain" crossOrigin="anonymous" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.32em]" style={{ color: t.accent }}>Certificado de conclusão</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-black">{cert.course_name}</h1>
          </div>
        </div>
        <div className="rounded-2xl border bg-white px-5 py-4 text-right shadow-lg ring-2" style={{ borderColor: t.accent }}>
          <img src={ABED_LOGO} alt="ABED" className="ml-auto h-12 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(78%) saturate(1037%) hue-rotate(183deg) brightness(91%) contrast(93%)' }} crossOrigin="anonymous" />
          <p className="mt-2 text-[10px] uppercase tracking-[0.25em]" style={{ color: t.accent }}>Associada ABED</p>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center py-8 text-center">
        <p className="text-lg leading-8 text-black">Certificamos que</p>
        <h2 className="mx-auto mt-3 max-w-4xl border-b-2 pb-2 text-5xl font-black uppercase tracking-wide" style={{ borderColor: t.soft, color: t.text }}>
          {cert.student_name}
        </h2>
        <p className="mx-auto mt-5 max-w-4xl text-lg leading-9 text-black">
          concluiu o curso <strong>{cert.course_name}</strong>, realizado pela {BRAND_LEGAL_NAME}, com carga horária total de <strong>{totalHours} horas</strong>, média final <strong>{averageGrade}</strong> e aproveitamento considerado satisfatório.
        </p>
        {cert.description && (
          <p className="mx-auto mt-3 max-w-4xl text-base leading-7 text-black">{cert.description}</p>
        )}
        {cert.honor_title && (
          <section className="mx-auto mt-7 max-w-3xl rounded-2xl border bg-white px-6 py-4 shadow-sm" style={{ borderColor: t.accent }}>
            <p className="text-[11px] font-black uppercase tracking-[0.32em]" style={{ color: t.accent }}>Destaque de honra</p>
            <h3 className="mt-1 text-2xl font-black text-black">{cert.honor_title}</h3>
            {cert.honor_description && <p className="mt-2 text-sm leading-6 text-black">{cert.honor_description}</p>}
          </section>
        )}
      </main>

      <footer className="relative z-10 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-8 pt-5 text-center text-black">
        <div className="text-left text-xs leading-5">
          <p className="font-bold uppercase tracking-wide" style={{ color: t.accent }}>Autenticação</p>
          <div className="mt-2 inline-flex items-center gap-3 rounded-xl border bg-white p-2 shadow-sm" style={{ borderColor: t.soft }}>
            <img src={createQrCodeUrl(verificationUrl)} alt="QR Code" className="h-20 w-20 rounded bg-white p-1" crossOrigin="anonymous" />
            <p className="max-w-[150px] text-[10px] leading-4 text-black">Escaneie para conferir a autenticidade pública deste certificado.</p>
          </div>
        </div>
        <div>
          <img src={WR_SIGNATURE_IMAGE} alt="Assinatura" className="mx-auto h-20 object-contain" crossOrigin="anonymous" />
          <div className="mx-auto -mt-2 h-px w-64 bg-black" />
          <p className="mt-2 text-sm font-bold text-black">{cert.coordinator_name || 'William Ribeiro'}</p>
          <p className="text-xs uppercase tracking-wide text-black">Coordenação pedagógica</p>
        </div>
        <div className="text-right text-xs leading-5 text-black">
          <p>Emitido em: {cert.issue_date}</p>
          <p>{BRAND_LEGAL_NAME}</p>
          <p>CNPJ {BRAND_CNPJ}</p>
        </div>
      </footer>
    </article>
  );
}

function CertBack({ cert, tmpl, backRef }) {
  const t = tmpl;
  const totalHours = cert.total_hours || 0;
  const averageGrade = cert.average_grade || '10.0';
  const verificationUrl = cert.verification_url || `${window.location.origin}/validar-certificado?codigo=${cert.verification_code}`;
  const classes = Array.isArray(cert.classes) ? cert.classes.filter(c => c.selected !== false) : [];

  return (
    <article
      ref={backRef}
      className="relative mx-auto flex flex-col overflow-hidden px-16 py-12"
      style={{ backgroundColor: t.background, color: t.text, width: CERTIFICATE_WIDTH_PX, height: CERTIFICATE_HEIGHT_PX }}
    >
      <div className="absolute inset-5 border-[3px]" style={{ borderColor: t.accent }} />
      <div className="absolute inset-8 border" style={{ borderColor: t.soft }} />

      <header className="relative z-10 flex items-center justify-between border-b pb-5" style={{ borderColor: t.soft }}>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.32em]" style={{ color: t.accent }}>Verso do certificado</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-black">Registro acadêmico e validação</h2>
        </div>
        <div className="rounded-2xl border bg-white p-2 shadow-lg" style={{ borderColor: t.accent }}>
          <img src={WR_CERTIFICATE_LOGO} alt="Logo WR" className="h-16 w-16 object-contain" crossOrigin="anonymous" />
        </div>
      </header>

      <main className="relative z-10 grid flex-1 grid-cols-[1.7fr_1fr] gap-8 py-8">
        <section className="rounded-2xl border bg-white p-5 text-left" style={{ borderColor: t.soft }}>
          <h3 className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: t.accent }}>Grade, cargas e notas</h3>
          <div className="mt-4 grid grid-cols-[1.2fr_2fr_80px_80px] gap-2 border-b pb-2 text-[11px] font-black uppercase tracking-wide text-black" style={{ borderColor: t.soft }}>
            <span>Aula</span><span>Descrição</span><span className="text-center">Horas</span><span className="text-center">Nota</span>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {classes.map((item, i) => (
              <div key={i} className="grid grid-cols-[1.2fr_2fr_80px_80px] gap-2 py-2 text-xs text-black">
                <span className="font-bold">{item.title}</span>
                <span>{item.description}</span>
                <span className="text-center font-bold">{Number(item.hours) || 0}h</span>
                <span className="text-center font-bold">{Number(item.grade || 0).toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border bg-white p-3 text-center text-sm" style={{ borderColor: t.soft }}>
            <div><p className="text-[11px] uppercase tracking-wide text-black">Carga total</p><p className="text-xl font-black text-black">{totalHours}h</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-black">Média final</p><p className="text-xl font-black text-black">{averageGrade}</p></div>
          </div>
        </section>

        <aside className="space-y-4 text-left">
          <section className="rounded-2xl border bg-white p-5" style={{ borderColor: t.soft }}>
            <h3 className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: t.accent }}>Dados do aluno</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-black">
              <p><strong>Aluno:</strong> {cert.student_name}</p>
              <p><strong>Curso:</strong> {cert.course_name}</p>
              <p><strong>Emissão:</strong> {cert.issue_date}</p>
            </div>
          </section>
          <section className="rounded-2xl border bg-white p-5 text-center" style={{ borderColor: t.soft }}>
            <h3 className="text-sm font-black uppercase tracking-[0.24em]" style={{ color: t.accent }}>Conferência externa</h3>
            <img src={createQrCodeUrl(verificationUrl)} alt="QR Code" className="mx-auto mt-4 h-36 w-36 rounded-lg bg-white p-2" crossOrigin="anonymous" />
            <p className="mt-3 text-xs leading-5 text-black">Escaneie ou informe o código no validador público.</p>
            <p className="mx-auto mt-2 inline-flex rounded-md bg-black px-2.5 py-1.5 text-[11px] font-black tracking-[0.18em] text-white">{cert.verification_code}</p>
          </section>
        </aside>
      </main>
    </article>
  );
}

export default function MeuCertificado() {
  const { user: session } = useOutletContext();
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['my-certificates', session?.email],
    queryFn: () => base44.entities.CertificateRecord.filter(
      { student_email: session?.email || '' },
      '-created_date',
      10
    ),
    enabled: !!session?.email,
  });

  const cert = certificates[0];
  const tmpl = cert ? getTemplate(cert.template_id) : getTemplate('classic-gold');

  const waitImages = async (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); });
    }));
  };

  const exportNode = async (node, bg) => {
    await waitImages(node);
    const bounds = node.getBoundingClientRect();
    const canvas = await html2canvas(node, {
      scale: 2, backgroundColor: bg, useCORS: true, allowTaint: false,
      width: Math.round(bounds.width), height: Math.round(bounds.height),
      scrollX: -window.scrollX, scrollY: -window.scrollY,
      onclone: (_, el) => {
        el.style.width = `${CERTIFICATE_WIDTH_PX}px`;
        el.style.height = `${CERTIFICATE_HEIGHT_PX}px`;
        el.style.minHeight = `${CERTIFICATE_HEIGHT_PX}px`;
        el.style.transform = 'none';
      },
    });
    return canvas.toDataURL('image/png');
  };

  const downloadPdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    setIsGenerating(true);
    try {
      const [front, back] = await Promise.all([
        exportNode(frontRef.current, tmpl.background),
        exportNode(backRef.current, tmpl.background),
      ]);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(front, 'PNG', 0, 0, 297, 210);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(back, 'PNG', 0, 0, 297, 210);
      const name = (cert.student_name || 'aluno').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      pdf.save(`certificado-${name}.pdf`);
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
      const img = await exportNode(frontRef.current, tmpl.background);
      const link = document.createElement('a');
      link.href = img;
      link.download = `certificado-${(cert.student_name || 'aluno').replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PNG baixado com sucesso!');
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
    <div className="p-4 lg:p-7 space-y-6 animate-fade-in-up max-w-7xl mx-auto">
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
          <p className="text-sm text-muted-foreground mt-2">Seu certificado aparecerá aqui assim que o professor emitir. Continue completando os requisitos na aba Certificação.</p>
        </div>
      ) : (
        <>
          {/* Action bar */}
          <div className="flex flex-wrap gap-3 items-center p-4 bg-card border border-border rounded-2xl">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">{cert.course_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span className="text-xs text-muted-foreground font-mono">{cert.verification_code}</span>
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

          {/* Preview — scrollable */}
          <div className="space-y-4 overflow-x-auto rounded-2xl border border-border bg-secondary/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Frente</p>
            <CertFront cert={cert} tmpl={tmpl} frontRef={frontRef} />
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-4 mb-2">Verso</p>
            <CertBack cert={cert} tmpl={tmpl} backRef={backRef} />
          </div>

          {/* Verify link */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex items-center gap-3">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Certificado com autenticidade verificável</p>
              <p className="text-xs mt-0.5">
                Código: <span className="font-mono font-bold">{cert.verification_code}</span> ·{' '}
                <a href={`/validar-certificado?codigo=${cert.verification_code}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700">
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