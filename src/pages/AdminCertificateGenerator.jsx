import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, FileImage, FilePlus2, Plus, RefreshCw, Save, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, WR_SIGNATURE_IMAGE } from '@/lib/brand';
import { useCustomAuth } from '@/lib/CustomAuthContext';

const ABED_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/fb3aaf448_LogotipoSOMOSASSOCIADOSABED-Branco.png';
const ABED_BLUE_FILTER = 'brightness(0) saturate(100%) invert(25%) sepia(78%) saturate(1037%) hue-rotate(183deg) brightness(91%) contrast(93%)';
const VERIFICATION_PATH = '/validar-certificado';
const CERTIFICATE_BACKGROUND = '#ffffff';
const CERTIFICATE_TEXT = '#000000';
const CERTIFICATE_WIDTH_PX = 1123;
const CERTIFICATE_HEIGHT_PX = 794;

const COURSE_LABELS = {
  tcc: 'Formação de Terapeuta em Terapia Comportamental',
  psicanalise: 'Formação de Terapeutas do Método Psicanalítico',
  sexologia: 'Formação de Terapeutas da Sexualidade Humana',
};

function createClassId() {
  return globalThis.crypto?.randomUUID?.() || `manual-class-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createVerificationCode() {
  const randomPart = globalThis.crypto?.randomUUID?.().replace(/-/g, '').slice(0, 4) || Math.random().toString(36).slice(2, 6);
  return `WR-${String(new Date().getFullYear()).slice(-2)}-${randomPart.toUpperCase()}`;
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

function getPublicBaseUrl() {
  if (typeof window === 'undefined') return 'https://wr-educonnect.com';
  return window.location.origin;
}

function normalizeVerificationCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

function createVerificationUrl(certificate) {
  const params = new URLSearchParams({ codigo: normalizeVerificationCode(certificate.verificationCode) });
  return `${getPublicBaseUrl()}${VERIFICATION_PATH}?${params.toString()}`;
}

function createQrCodeUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=12&color=000000&bgcolor=FFFFFF&data=${encodeURIComponent(value)}`;
}

async function invokeCertificateAction(payload) {
  const response = await base44.functions.invoke('saveStudentRecord', payload);
  const data = response?.data || response;
  if (data?.error) throw new Error(data.error);
  return data;
}

function normalizeClassRecord(item) {
  return {
    id: item.id || createClassId(),
    selected: item.selected !== false,
    title: item.title || 'Aula sem título',
    description: item.description || '',
    hours: Number(item.hours) || 0,
    grade: Number(item.grade) || 0,
  };
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

function FrontCertificate({ certificate, totalHours, averageGrade, verificationUrl, previewRef }) {
  return (
    <article
      ref={previewRef}
      className="relative mx-auto flex h-[794px] w-[1123px] flex-col overflow-hidden px-16 py-12 shadow-2xl"
      style={{ backgroundColor: CERTIFICATE_BACKGROUND, color: CERTIFICATE_TEXT }}
    >
      <div className="absolute inset-5 border-[3px] border-[#b99744]" />
      <div className="absolute inset-8 border border-[#d9bf75]" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#b99744]/10" />
      <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-black/5" />

      <header className="relative z-10 flex items-start justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-[#b99744]/70 bg-white p-2 shadow-lg ring-2 ring-[#d9bf75]/45">
            <img src={WR_CERTIFICATE_LOGO} alt="Logo WR Terapia" className="h-20 w-20 object-contain" crossOrigin="anonymous" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#9a7528]">Certificado de conclusão</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.08em] text-black">{certificate.courseName}</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-[#1d4f91]/70 bg-white px-5 py-4 text-right shadow-lg ring-2 ring-[#d9bf75]/45">
          <img src={ABED_LOGO} alt="Logo ABED" className="ml-auto h-12 object-contain" style={{ filter: ABED_BLUE_FILTER }} crossOrigin="anonymous" />
          <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-[#1d4f91]">Associada ABED</p>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center py-8 text-center">
        <p className="text-lg leading-8 text-black">Certificamos que</p>
        <h2 className="mx-auto mt-3 max-w-4xl border-b-2 border-[#d9bf75] pb-2 text-5xl font-black uppercase tracking-wide text-black">
          {certificate.studentName || 'Nome completo do aluno'}
        </h2>
        <p className="mx-auto mt-5 max-w-4xl text-lg leading-9 text-black">
          concluiu o curso <strong>{certificate.courseName}</strong>, realizado pela {BRAND_LEGAL_NAME}, com carga horária total de <strong>{totalHours} horas</strong>, média final <strong>{averageGrade}</strong> e aproveitamento considerado satisfatório.
        </p>
        <p className="mx-auto mt-3 max-w-4xl text-base leading-7 text-black">{certificate.description}</p>

        {certificate.honorTitle && (
          <section className="mx-auto mt-7 max-w-3xl rounded-2xl border border-[#c9a84c] bg-white px-6 py-4 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#9a7528]">Destaque de honra</p>
            <h3 className="mt-1 text-2xl font-black text-black">{certificate.honorTitle}</h3>
            {certificate.honorDescription && <p className="mt-2 text-sm leading-6 text-black">{certificate.honorDescription}</p>}
          </section>
        )}
      </main>

      <footer className="relative z-10 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-8 pt-5 text-center text-black">
        <div className="text-left text-xs leading-5">
          <p className="font-bold uppercase tracking-wide text-[#9a7528]">Autenticação</p>
          <div className="mt-2 inline-flex items-center gap-3 rounded-xl border border-[#d9bf75] bg-white p-2 shadow-sm">
            <img src={createQrCodeUrl(verificationUrl)} alt="QR Code de validação" className="h-20 w-20 rounded bg-white p-1" crossOrigin="anonymous" />
            <p className="max-w-[150px] text-[10px] leading-4 text-black">Escaneie para conferir a autenticidade pública deste certificado.</p>
          </div>
        </div>
        <div>
          <img src={WR_SIGNATURE_IMAGE} alt="Assinatura da coordenação" className="mx-auto h-20 object-contain" crossOrigin="anonymous" />
          <div className="mx-auto -mt-2 h-px w-64 bg-black" />
          <p className="mt-2 text-sm font-bold text-black">{certificate.coordinatorName}</p>
          <p className="text-xs uppercase tracking-wide text-black">Coordenação pedagógica</p>
        </div>
        <div className="text-right text-xs leading-5 text-black">
          <p>Emitido em: {certificate.issueDate}</p>
          <p>{BRAND_LEGAL_NAME}</p>
          <p>CNPJ {BRAND_CNPJ}</p>
        </div>
      </footer>
    </article>
  );
}

function BackCertificate({ certificate, selectedClasses, totalHours, averageGrade, verificationUrl, backRef }) {
  return (
    <article
      ref={backRef}
      className="relative mx-auto flex h-[794px] w-[1123px] flex-col overflow-hidden px-16 py-12 shadow-2xl"
      style={{ backgroundColor: CERTIFICATE_BACKGROUND, color: CERTIFICATE_TEXT }}
    >
      <div className="absolute inset-5 border-[3px] border-[#b99744]" />
      <div className="absolute inset-8 border border-[#d9bf75]" />
      <header className="relative z-10 flex items-center justify-between border-b border-[#d9bf75] pb-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#9a7528]">Verso do certificado</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-wide text-black">Registro acadêmico e validação</h2>
        </div>
        <div className="rounded-2xl border border-[#b99744]/70 bg-white p-2 shadow-lg">
          <img src={WR_CERTIFICATE_LOGO} alt="Logo WR Terapia" className="h-16 w-16 object-contain" crossOrigin="anonymous" />
        </div>
      </header>

      <main className="relative z-10 grid flex-1 grid-cols-[1.7fr_1fr] gap-8 py-8">
        <section className="rounded-2xl border border-[#d9bf75] bg-white p-5 text-left">
          <h3 className="text-sm font-black uppercase tracking-[0.24em] text-[#9a7528]">Grade, cargas e notas</h3>
          <div className="mt-4 grid grid-cols-[1.2fr_2fr_80px_80px] gap-2 border-b border-[#d9bf75] pb-2 text-[11px] font-black uppercase tracking-wide text-black">
            <span>Aula</span><span>Descrição</span><span className="text-center">Horas</span><span className="text-center">Nota</span>
          </div>
          <div className="divide-y divide-[#e7d6a5]">
            {selectedClasses.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.2fr_2fr_80px_80px] gap-2 py-2 text-xs text-black">
                <span className="font-bold">{item.title}</span>
                <span>{item.description}</span>
                <span className="text-center font-bold">{Number(item.hours) || 0}h</span>
                <span className="text-center font-bold">{Number(item.grade || 0).toFixed(1)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[#d9bf75] bg-white p-3 text-center text-sm">
            <div><p className="text-[11px] uppercase tracking-wide text-black">Carga total</p><p className="text-xl font-black text-black">{totalHours}h</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-black">Média final</p><p className="text-xl font-black text-black">{averageGrade}</p></div>
          </div>
        </section>

        <aside className="space-y-4 text-left">
          <section className="rounded-2xl border border-[#d9bf75] bg-white p-5">
            <h3 className="text-sm font-black uppercase tracking-[0.24em] text-[#9a7528]">Dados sensíveis</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-black">
              <p><strong>Aluno:</strong> {certificate.studentName || 'não informado'}</p>
              <p><strong>CPF/RG:</strong> {certificate.studentDocument || 'não informado'}</p>
              <p><strong>E-mail:</strong> {certificate.studentEmail || 'não informado'}</p>
              <p><strong>Curso:</strong> {certificate.courseName}</p>
              <p><strong>Emissão:</strong> {certificate.issueDate}</p>
            </div>
          </section>
          <section className="rounded-2xl border border-[#d9bf75] bg-white p-5 text-center">
            <h3 className="text-sm font-black uppercase tracking-[0.24em] text-[#9a7528]">Conferência externa</h3>
            <img src={createQrCodeUrl(verificationUrl)} alt="QR Code de validação" className="mx-auto mt-4 h-36 w-36 rounded-lg bg-white p-2" crossOrigin="anonymous" />
            <p className="mt-3 text-xs leading-5 text-black">Escaneie o QR Code da frente ou informe o código autenticador abaixo no autenticador público.</p>
            <p className="mx-auto mt-2 inline-flex rounded-md bg-black px-2.5 py-1.5 text-[11px] font-black tracking-[0.18em] text-white">{certificate.verificationCode}</p>
            <p className="mt-2 break-all text-[10px] text-black">{verificationUrl}</p>
          </section>
        </aside>
      </main>
    </article>
  );
}

function CertificatePreview({ certificate, selectedClasses, totalHours, averageGrade, verificationUrl, previewRef, backRef }) {
  return (
    <div className="space-y-4 overflow-x-auto rounded-2xl border border-border bg-secondary/40 p-4">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted-foreground">Frente</p>
        <FrontCertificate certificate={certificate} totalHours={totalHours} averageGrade={averageGrade} verificationUrl={verificationUrl} previewRef={previewRef} />
      </div>
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted-foreground">Verso</p>
        <BackCertificate certificate={certificate} selectedClasses={selectedClasses} totalHours={totalHours} averageGrade={averageGrade} verificationUrl={verificationUrl} backRef={backRef} />
      </div>
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">
        O botão PNG 1ª página exporta exatamente a frente exibida acima, sem um layout social separado.
      </div>
    </div>
  );
}

export default function AdminCertificateGenerator() {
  const { session } = useCustomAuth();
  const previewRef = useRef(null);
  const backRef = useRef(null);
  const [certificate, setCertificate] = useState({
    studentName: '',
    studentDocument: '',
    studentEmail: '',
    studentAccessCode: '',
    courseName: COURSE_LABELS[session?.course] || 'Curso de Formação Livre',
    description: 'Certificado emitido manualmente pelo administrador para antecipação ou regularização da conclusão, conforme cargas horárias, aulas e notas registradas no verso.',
    coordinatorName: 'William Ribeiro',
    honorTitle: '',
    honorDescription: '',
    verificationCode: createVerificationCode(),
    issueDate: todayPtBr(),
  });
  const [classes, setClasses] = useState(INITIAL_CLASSES);
  const [students, setStudents] = useState([]);
  const [selectedStudentKey, setSelectedStudentKey] = useState('');
  const [savedCertificateId, setSavedCertificateId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescuing, setIsRescuing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStudents() {
      try {
        const records = await base44.entities.AccessCode.list('-created_date', 10000);
        if (!isMounted) return;
        setStudents(records.filter((record) => record.student_name || record.student_email || record.code));
      } catch (error) {
        console.error('Erro ao carregar alunos para certificado:', error);
        toast.error('Não foi possível carregar a lista de alunos.');
      }
    }
    loadStudents();
    return () => { isMounted = false; };
  }, []);

  const selectedStudent = useMemo(() => students.find((student) => String(student.id || student.code) === selectedStudentKey), [selectedStudentKey, students]);
  const selectedClasses = useMemo(() => classes.filter((item) => item.selected), [classes]);
  const totalHours = useMemo(() => selectedClasses.reduce((sum, item) => sum + (Number(item.hours) || 0), 0), [selectedClasses]);
  const averageGrade = useMemo(() => {
    if (!selectedClasses.length) return '0.0';
    const total = selectedClasses.reduce((sum, item) => sum + (Number(item.grade) || 0), 0);
    return (total / selectedClasses.length).toFixed(1);
  }, [selectedClasses]);
  const verificationUrl = useMemo(() => createVerificationUrl(certificate), [certificate]);

  const updateCertificate = (field, value) => setCertificate((prev) => ({ ...prev, [field]: value }));
  const updateClass = (id, field, value) => {
    setClasses((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };
  const addClass = () => {
    setClasses((prev) => [...prev, { id: createClassId(), selected: true, title: 'Nova aula', description: 'Descrição manual da aula ou módulo.', hours: 1, grade: 10 }]);
  };
  const removeClass = (id) => setClasses((prev) => prev.filter((item) => item.id !== id));
  const renewVerificationCode = () => {
    updateCertificate('verificationCode', createVerificationCode());
    setSavedCertificateId(null);
  };

  const fillStudentData = (student) => {
    if (!student) return;
    setCertificate((prev) => ({
      ...prev,
      studentName: student.student_name || student.profile_name || prev.studentName,
      studentEmail: student.student_email || prev.studentEmail,
      studentAccessCode: student.code || prev.studentAccessCode,
      courseName: COURSE_LABELS[student.course] || prev.courseName,
    }));
  };

  const buildCertificatePayload = () => ({
    verification_code: normalizeVerificationCode(certificate.verificationCode),
    student_name: certificate.studentName.trim(),
    student_document: certificate.studentDocument.trim(),
    student_email: certificate.studentEmail.trim(),
    student_access_code: certificate.studentAccessCode.trim(),
    course_name: certificate.courseName.trim(),
    course_slug: selectedStudent?.course || session?.course || '',
    description: certificate.description,
    coordinator_name: certificate.coordinatorName.trim(),
    honor_title: certificate.honorTitle.trim(),
    honor_description: certificate.honorDescription,
    issue_date: certificate.issueDate.trim(),
    total_hours: totalHours,
    average_grade: averageGrade,
    classes: classes.map(normalizeClassRecord),
    verification_url: verificationUrl,
  });

  const applySavedRecord = (record) => {
    setSavedCertificateId(record.id);
    setCertificate({
      studentName: record.student_name || '',
      studentDocument: record.student_document || '',
      studentEmail: record.student_email || '',
      studentAccessCode: record.student_access_code || '',
      courseName: record.course_name || COURSE_LABELS[session?.course] || 'Curso de Formação Livre',
      description: record.description || '',
      coordinatorName: record.coordinator_name || 'William Ribeiro',
      honorTitle: record.honor_title || '',
      honorDescription: record.honor_description || '',
      verificationCode: record.verification_code || createVerificationCode(),
      issueDate: record.issue_date || todayPtBr(),
    });
    setClasses(Array.isArray(record.classes) && record.classes.length ? record.classes.map(normalizeClassRecord) : INITIAL_CLASSES);
  };

  const saveCertificate = async () => {
    if (!certificate.verificationCode.trim() || !certificate.studentName.trim()) {
      toast.error('Informe pelo menos o nome do aluno e o código de autenticidade antes de salvar.');
      return;
    }
    if (!selectedClasses.length) {
      toast.error('Selecione pelo menos uma aula/carga antes de salvar.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildCertificatePayload();
      const { record } = await invokeCertificateAction({ action: 'certificateUpsert', id: savedCertificateId, data: payload });
      setSavedCertificateId(record?.id || savedCertificateId || null);
      updateCertificate('verificationCode', record?.verification_code || payload.verification_code);
      toast.success('Certificado salvo no banco de dados.');
    } catch (error) {
      console.error('Erro ao salvar certificado:', error);
      toast.error('Não foi possível salvar o certificado.');
    } finally {
      setIsSaving(false);
    }
  };

  const rescueCertificateData = async () => {
    const code = normalizeVerificationCode(certificate.verificationCode);
    const email = selectedStudent?.student_email || certificate.studentEmail.trim();
    const accessCode = selectedStudent?.code || certificate.studentAccessCode.trim();

    setIsRescuing(true);
    try {
      const { records = [] } = await invokeCertificateAction({
        action: 'certificateSearch',
        code,
        student_email: email,
        student_access_code: accessCode,
      });

      if (records[0]) {
        applySavedRecord(records[0]);
        toast.success('Dados salvos do certificado foram resgatados.');
        return;
      }

      if (selectedStudent) {
        fillStudentData(selectedStudent);
        toast.info('Nenhum certificado salvo encontrado; dados básicos do aluno selecionado foram preenchidos.');
      } else {
        toast.error('Selecione um aluno ou informe um código já salvo para resgatar dados.');
      }
    } catch (error) {
      console.error('Erro ao resgatar certificado:', error);
      toast.error('Não foi possível resgatar os dados do certificado.');
    } finally {
      setIsRescuing(false);
    }
  };

  const exportNodeAsImage = async (node, backgroundColor = CERTIFICATE_BACKGROUND) => {
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor,
      useCORS: true,
      allowTaint: false,
      width: CERTIFICATE_WIDTH_PX,
      height: CERTIFICATE_HEIGHT_PX,
      windowWidth: CERTIFICATE_WIDTH_PX,
      windowHeight: CERTIFICATE_HEIGHT_PX,
      scrollX: 0,
      scrollY: 0,
      onclone: (documentClone, element) => {
        element.style.width = `${CERTIFICATE_WIDTH_PX}px`;
        element.style.height = `${CERTIFICATE_HEIGHT_PX}px`;
        element.style.minHeight = `${CERTIFICATE_HEIGHT_PX}px`;
        element.style.transform = 'none';
        element.style.margin = '0';
        element.style.boxShadow = 'none';
      },
    });
    return canvas.toDataURL('image/png');
  };

  const generatePdf = async () => {
    if (!previewRef.current || !backRef.current) return;
    if (!selectedClasses.length) {
      toast.error('Selecione pelo menos uma aula/carga para emitir o certificado.');
      return;
    }

    setIsGenerating(true);
    try {
      const [frontImage, backImage] = await Promise.all([
        exportNodeAsImage(previewRef.current),
        exportNodeAsImage(backRef.current),
      ]);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(frontImage, 'PNG', 0, 0, 297, 210);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(backImage, 'PNG', 0, 0, 297, 210);
      const name = sanitizeFileName(certificate.studentName || 'aluno');
      pdf.save(`certificado-conclusao-${name}.pdf`);
      toast.success('Certificado frente e verso gerado com sucesso.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSocialPng = async () => {
    if (!previewRef.current) return;
    setIsGenerating(true);
    try {
      const image = await exportNodeAsImage(previewRef.current);
      const link = document.createElement('a');
      const name = sanitizeFileName(certificate.studentName || 'aluno');
      link.href = image;
      link.download = `certificado-primeira-pagina-${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PNG gerado com a primeira página exatamente como exibida na prévia.');
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
            <p className="text-sm text-muted-foreground">Emita diploma frente e verso, PNG social e campo público de autenticidade.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveCertificate} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50">
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar certificado'}
          </button>
          <button type="button" onClick={rescueCertificateData} disabled={isRescuing} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-50">
            <Search size={16} />
            {isRescuing ? 'Resgatando...' : 'Resgatar dados'}
          </button>
          <button type="button" onClick={generatePdf} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">
            <Download size={16} />
            {isGenerating ? 'Gerando...' : 'Baixar PDF frente e verso'}
          </button>
          <button type="button" onClick={generateSocialPng} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-50">
            <FileImage size={16} /> PNG 1ª página
          </button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-4 font-black text-foreground">Aluno selecionado</h3>
            <div className="space-y-3">
              <FormField label="Selecionar aluno" hint="Use Resgatar dados para buscar um certificado salvo deste aluno ou preencher dados básicos do cadastro.">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={selectedStudentKey}
                  onChange={(event) => {
                    setSelectedStudentKey(event.target.value);
                    const student = students.find((item) => String(item.id || item.code) === event.target.value);
                    fillStudentData(student);
                    setSavedCertificateId(null);
                  }}
                >
                  <option value="">Selecione um aluno cadastrado</option>
                  {students.map((student) => (
                    <option key={student.id || student.code} value={student.id || student.code}>
                      {student.student_name || student.profile_name || student.student_email || student.code} {student.course ? `· ${student.course}` : ''}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-4 font-black text-foreground">Dados principais</h3>
            <div className="space-y-3">
              <FormField label="Nome do aluno">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.studentName} onChange={(event) => updateCertificate('studentName', event.target.value)} placeholder="Nome completo" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="CPF/RG" hint="Aparece somente no verso.">
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.studentDocument} onChange={(event) => updateCertificate('studentDocument', event.target.value)} placeholder="Documento" />
                </FormField>
                <FormField label="E-mail" hint="Aparece somente no verso.">
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.studentEmail} onChange={(event) => updateCertificate('studentEmail', event.target.value)} placeholder="aluno@email.com" />
                </FormField>
              </div>
              <FormField label="Curso">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.courseName} onChange={(event) => updateCertificate('courseName', event.target.value)} />
              </FormField>
              <FormField label="Texto complementar">
                <textarea className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.description} onChange={(event) => updateCertificate('description', event.target.value)} rows={3} />
              </FormField>
              <FormField label="Coordenação">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.coordinatorName} onChange={(event) => updateCertificate('coordinatorName', event.target.value)} />
              </FormField>
              <FormField label="Data de emissão">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.issueDate} onChange={(event) => updateCertificate('issueDate', event.target.value)} />
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-4 font-black text-foreground">Destaques de honra</h3>
            <div className="space-y-3">
              <FormField label="Título do destaque" hint="Ex.: Monitor de Classe por Mérito Acadêmico.">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.honorTitle} onChange={(event) => updateCertificate('honorTitle', event.target.value)} placeholder="Sem destaque" />
              </FormField>
              <FormField label="Descrição do destaque">
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.honorDescription} onChange={(event) => updateCertificate('honorDescription', event.target.value)} rows={2} placeholder="Reconhecimento por excelência, dedicação e desempenho acadêmico." />
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-black text-foreground">Autenticidade externa</h3>
              <button type="button" onClick={renewVerificationCode} className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary">
                <RefreshCw size={14} /> Novo código
              </button>
            </div>
            <div className="space-y-3">
              <FormField label="Código público">
                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-bold uppercase tracking-widest ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={certificate.verificationCode} onChange={(event) => updateCertificate('verificationCode', event.target.value.toUpperCase())} />
              </FormField>
              <div className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                <p className="font-bold text-foreground">Link para QR Code e conferência:</p>
                <p className="mt-1 break-all">{verificationUrl}</p>
              </div>
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
            <strong>Prévia em tempo real:</strong> a frente não exibe CPF/RG, e-mail, grade nem código autenticador. Ela traz apenas o QR Code; os dados sensíveis e o código público menor ficam no verso.
          </div>
          <CertificatePreview certificate={certificate} selectedClasses={selectedClasses} totalHours={totalHours} averageGrade={averageGrade} verificationUrl={verificationUrl} previewRef={previewRef} backRef={backRef} />
        </main>
      </div>
    </div>
  );
}
