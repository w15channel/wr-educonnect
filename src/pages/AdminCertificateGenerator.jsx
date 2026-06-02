import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, FilePlus2, Plus, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, WR_SIGNATURE_IMAGE } from '@/lib/brand';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const ABED_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png';

const COURSE_LABELS = {
  tcc: 'Formação de Terapeuta em Terapia Comportamental',
  psicanalise: 'Formação de Terapeutas do Método Psicanalítico',
  sexologia: 'Formação de Terapeutas da Sexualidade Humana',
};

function createClassId() {
  return globalThis.crypto?.randomUUID?.() || `manual-class-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const INITIAL_CLASSES = [
  { id: createClassId(), selected: true, title: 'Fundamentos teóricos do curso', description: 'Introdução, ética profissional e diretrizes de estudo.', hours: 8, grade: 10 },
  { id: createClassId(), selected: true, title: 'Prática supervisionada', description: 'Atividades práticas, estudos de caso e acompanhamento docente.', hours: 12, grade: 10 },
  { id: createClassId(), selected: true, title: 'Avaliação final e integração', description: 'Síntese dos módulos e avaliação de aproveitamento.', hours: 4, grade: 10 },
];

function todayPtBr() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
}

function sanitizeFileName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function FormField({ label, children, hint = null }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

function CertificatePreview({ certificate, selectedClasses, totalHours, averageGrade, previewRef }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-secondary/40 p-4">
      <article
        ref={previewRef}
        className="relative mx-auto flex min-h-[794px] w-[1123px] flex-col overflow-hidden bg-[#fbf8ef] px-16 py-12 text-[#1b1a16] shadow-2xl"
      >
        <div className="absolute inset-5 border-[3px] border-[#b99744]" />
        <div className="absolute inset-8 border border-[#d9bf75]" />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#b99744]/10" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#24190b]/10" />

        <header className="relative z-10 flex items-start justify-between gap-8">
          <div className="flex items-center gap-4">
            <img src={WR_CERTIFICATE_LOGO} alt="Logo WR Terapia" className="h-24 w-24 object-contain" crossOrigin="anonymous" />
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#9a7528]">Certificado de conclusão</p>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-[#24190b]">{certificate.courseName}</h1>
            </div>
          </div>
          <div className="rounded-2xl bg-[#17120b] px-5 py-4 text-right text-white shadow-lg">
            <img src={ABED_LOGO} alt="Logo ABED" className="ml-auto h-12 object-contain" crossOrigin="anonymous" />
            <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-white/60">Associada ABED</p>
          </div>
        </header>

        <main className="relative z-10 flex flex-1 flex-col justify-center py-8 text-center">
          <p className="text-lg leading-8 text-[#403626]">Certificamos que</p>
          <h2 className="mx-auto mt-3 max-w-4xl border-b-2 border-[#d9bf75] pb-2 text-5xl font-black uppercase tracking-wide text-[#24190b]">
            {certificate.studentName || 'Nome completo do aluno'}
          </h2>
          <p className="mx-auto mt-5 max-w-4xl text-lg leading-9 text-[#403626]">
            concluiu o curso <strong>{certificate.courseName}</strong>, realizado pela {BRAND_LEGAL_NAME}, com carga horária total de <strong>{totalHours} horas</strong>, média final <strong>{averageGrade}</strong> e aproveitamento considerado satisfatório.
          </p>
          <p className="mx-auto mt-3 max-w-4xl text-base leading-7 text-[#5d5140]">{certificate.description}</p>

          <section className="mt-7 rounded-2xl border border-[#d9bf75] bg-white/55 p-4 text-left">
            <div className="grid grid-cols-[1fr_4fr_90px_90px] gap-2 border-b border-[#d9bf75] pb-2 text-[11px] font-black uppercase tracking-wide text-[#9a7528]">
              <span>Aula</span><span>Descrição</span><span className="text-center">Horas</span><span className="text-center">Nota</span>
            </div>
            <div className="divide-y divide-[#e7d6a5]">
              {selectedClasses.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_4fr_90px_90px] gap-2 py-2 text-xs text-[#403626]">
                  <span className="font-bold">{item.title}</span>
                  <span>{item.description}</span>
                  <span className="text-center font-bold">{Number(item.hours) || 0}h</span>
                  <span className="text-center font-bold">{Number(item.grade || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="relative z-10 grid grid-cols-3 items-end gap-8 pt-5 text-center text-[#403626]">
          <div className="text-left text-xs leading-5">
            <p className="font-bold uppercase tracking-wide text-[#9a7528]">Dados do aluno</p>
            <p>CPF/RG: {certificate.studentDocument || 'não informado'}</p>
            <p>E-mail: {certificate.studentEmail || 'não informado'}</p>
            <p>Emitido em: {certificate.issueDate}</p>
          </div>
          <div>
            <img src={WR_SIGNATURE_IMAGE} alt="Assinatura do professor" className="mx-auto h-20 object-contain" crossOrigin="anonymous" />
            <div className="mx-auto -mt-2 h-px w-64 bg-[#9a7528]" />
            <p className="mt-2 text-sm font-bold">{certificate.teacherName}</p>
            <p className="text-xs uppercase tracking-wide text-[#6f6049]">Professor responsável</p>
          </div>
          <div>
            <div className="mx-auto h-px w-64 bg-[#9a7528]" />
            <p className="mt-2 text-sm font-bold">{certificate.coordinatorName}</p>
            <p className="text-xs uppercase tracking-wide text-[#6f6049]">Coordenação pedagógica</p>
            <p className="mt-3 text-[10px] text-[#6f6049]">{BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}

export default function AdminCertificateGenerator() {
  const { session } = useCustomAuth();
  const previewRef = useRef(null);
  const [certificate, setCertificate] = useState({
    studentName: '',
    studentDocument: '',
    studentEmail: '',
    courseName: COURSE_LABELS[session?.course] || 'Curso de Formação Livre',
    description: 'Certificado emitido manualmente pelo administrador para antecipação ou regularização da conclusão, conforme cargas horárias, aulas e notas selecionadas abaixo.',
    teacherName: 'William R. Terapeuta',
    coordinatorName: 'Coordenação WR Terapia',
    issueDate: todayPtBr(),
  });
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedClasses = useMemo(() => classes.filter((item) => item.selected), [classes]);
  const totalHours = useMemo(() => selectedClasses.reduce((sum, item) => sum + (Number(item.hours) || 0), 0), [selectedClasses]);
  const averageGrade = useMemo(() => {
    if (!selectedClasses.length) return '0.0';
    const total = selectedClasses.reduce((sum, item) => sum + (Number(item.grade) || 0), 0);
    return (total / selectedClasses.length).toFixed(1);
  }, [selectedClasses]);

  const updateCertificate = (field, value) => setCertificate((prev) => ({ ...prev, [field]: value }));
  const updateClass = (id, field, value) => {
    setClasses((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };
  const addClass = () => {
    setClasses((prev) => [...prev, { id: createClassId(), selected: true, title: 'Nova aula', description: 'Descrição manual da aula ou módulo.', hours: 1, grade: 10 }]);
  };
  const removeClass = (id) => setClasses((prev) => prev.filter((item) => item.id !== id));

  const generatePdf = async () => {
    if (!previewRef.current) return;
    if (!selectedClasses.length) {
      toast.error('Selecione pelo menos uma aula/carga para emitir o certificado.');
      return;
    }

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#fbf8ef', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      const name = sanitizeFileName(certificate.studentName || 'aluno');
      pdf.save(`certificado-conclusao-${name}.pdf`);
      toast.success('Certificado gerado com sucesso.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 lg:p-7 space-y-6 animate-fade-in-up">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
            <Award size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Gerador manual de certificados</h2>
            <p className="text-sm text-muted-foreground">Atalho exclusivo do administrador para antecipar certificados de conclusão com dados, aulas, cargas e notas manuais.</p>
          </div>
        </div>
        <button type="button" onClick={generatePdf} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
          <Download size={16} />
          {isGenerating ? 'Gerando PDF...' : 'Baixar certificado'}
        </button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck size={18} className="text-primary" />
              <h3 className="font-black text-foreground">Dados editáveis</h3>
            </div>
            <div className="space-y-4">
              <FormField label="Nome do aluno">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.studentName} onChange={(event) => updateCertificate('studentName', event.target.value)} placeholder="Nome completo" />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <FormField label="CPF/RG">
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.studentDocument} onChange={(event) => updateCertificate('studentDocument', event.target.value)} placeholder="Documento" />
                </FormField>
                <FormField label="E-mail">
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.studentEmail} onChange={(event) => updateCertificate('studentEmail', event.target.value)} placeholder="aluno@email.com" />
                </FormField>
              </div>
              <FormField label="Curso">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.courseName} onChange={(event) => updateCertificate('courseName', event.target.value)} />
              </FormField>
              <FormField label="Descrição do certificado">
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.description} onChange={(event) => updateCertificate('description', event.target.value)} rows={4} />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <FormField label="Professor">
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.teacherName} onChange={(event) => updateCertificate('teacherName', event.target.value)} />
                </FormField>
                <FormField label="Coordenação">
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.coordinatorName} onChange={(event) => updateCertificate('coordinatorName', event.target.value)} />
                </FormField>
              </div>
              <FormField label="Data de emissão">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.issueDate} onChange={(event) => updateCertificate('issueDate', event.target.value)} />
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FilePlus2 size={18} className="text-primary" />
                <h3 className="font-black text-foreground">Aulas, cargas e notas</h3>
              </div>
              <button type="button" onClick={addClass} className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary">
                <Plus size={14} /> Aula
              </button>
            </div>
            <div className="space-y-3">
              {classes.map((item, index) => (
                <div key={item.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <input type="checkbox" checked={item.selected} onChange={(event) => updateClass(item.id, 'selected', event.target.checked)} className="h-4 w-4 accent-primary" />
                      Incluir carga {index + 1}
                    </label>
                    <button type="button" onClick={() => removeClass(item.id)} className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600" aria-label="Remover aula">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={item.title} onChange={(event) => updateClass(item.id, 'title', event.target.value)} placeholder="Nome da aula/módulo" />
                    <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={item.description} onChange={(event) => updateClass(item.id, 'description', event.target.value)} rows={2} placeholder="Descrição da aula" />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" type="number" min="0" step="0.5" value={item.hours} onChange={(event) => updateClass(item.id, 'hours', event.target.value)} placeholder="Horas" />
                      <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" type="number" min="0" max="10" step="0.1" value={item.grade} onChange={(event) => updateClass(item.id, 'grade', event.target.value)} placeholder="Nota" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary p-3 text-center text-sm">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Carga total</p>
                <p className="text-xl font-black text-foreground">{totalHours}h</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Média</p>
                <p className="text-xl font-black text-foreground">{averageGrade}</p>
              </div>
            </div>
          </section>
        </aside>

        <main className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Prévia em tempo real:</strong> todos os campos são manuais. Selecione somente as cargas que devem aparecer no certificado antes de baixar o PDF.
          </div>
          <CertificatePreview certificate={certificate} selectedClasses={selectedClasses} totalHours={totalHours} averageGrade={averageGrade} previewRef={previewRef} />
        </main>
      </div>
    </div>
  );
}
