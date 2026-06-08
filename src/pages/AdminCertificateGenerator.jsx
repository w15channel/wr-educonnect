import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, FileImage, RefreshCw, Save, Search, Copy, ClipboardPaste, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import CertificateFront from '@/components/certificates/CertificateFront';
import CertificateBack from '@/components/certificates/CertificateBack';

export const CERT_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/252c62186_BlueandGoldElegantParticipationCertificate5.png';
export const CERT_W = 1052;
export const CERT_H = 744;
const CLIPBOARD_KEY = 'wr_cert_clipboard';

export const COURSE_LABELS = {
  tcc: 'Formação Profissional em Terapia Comportamental',
  psicanalise: 'Formação Profissional em Psicanálise Freudiana',
  sexologia: 'Formação Profissional em Sexologia Integrativa',
};

export function makeVerifCode() {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WR-${String(new Date().getFullYear()).slice(-2)}-${r}`;
}

export function todayPtBr() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
}

export function sanitizeFileName(v) {
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
}

export function normalizeCode(v) {
  return String(v || '').trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

export function makeVerifUrl(code) {
  return `${window.location.origin}/validar-certificado?codigo=${normalizeCode(code)}`;
}

function uid() { return Math.random().toString(36).slice(2, 8); }

const EMPTY_CERT = {
  studentName: '',
  studentDocument: '',
  studentEmail: '',
  studentAccessCode: '',
  courseName: '',
  gratificationText: 'É com imensa satisfação que certificamos que',
  bodyText: 'concluiu com êxito o curso de formação profissional, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
  totalHours: 120,
  averageGrade: '10,0',
  issueDate: todayPtBr(),
  verificationCode: makeVerifCode(),
  honorTitle: '',
  honorDescription: '',
  classes: [
    { id: uid(), title: 'Fundamentos Teóricos', hours: 20, grade: '10,0' },
    { id: uid(), title: 'Prática Supervisionada', hours: 40, grade: '10,0' },
    { id: uid(), title: 'Avaliação e Encerramento', hours: 20, grade: '10,0' },
  ],
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCertificateGenerator() {
  const { session } = useCustomAuth();
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const [cert, setCert] = useState({ ...EMPTY_CERT, courseName: COURSE_LABELS[session?.course] || '' });
  const [students, setStudents] = useState([]);
  const [studentKey, setStudentKey] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescuing, setIsRescuing] = useState(false);
  const [activeTab, setActiveTab] = useState('front'); // 'front' | 'back'

  useEffect(() => {
    base44.entities.AccessCode.list('-created_date', 10000)
      .then(r => setStudents(r.filter(s => s.student_name || s.student_email || s.code)))
      .catch(() => {});
  }, []);

  const upd = (field, value) => setCert(p => ({ ...p, [field]: value }));

  const fillStudent = (s) => {
    if (!s) return;
    setCert(p => ({
      ...p,
      studentName: s.student_name || s.profile_name || p.studentName,
      studentEmail: s.student_email || p.studentEmail,
      studentAccessCode: s.code || p.studentAccessCode,
      courseName: COURSE_LABELS[s.course] || p.courseName,
    }));
    setSavedId(null);
  };

  const updClass = (id, field, value) =>
    setCert(p => ({ ...p, classes: p.classes.map(c => c.id === id ? { ...c, [field]: value } : c) }));
  const addClass = () =>
    setCert(p => ({ ...p, classes: [...p.classes, { id: uid(), title: 'Nova Aula', hours: 4, grade: '10,0' }] }));
  const delClass = (id) =>
    setCert(p => ({ ...p, classes: p.classes.filter(c => c.id !== id) }));

  const copyToClipboard = () => {
    const data = { courseName: cert.courseName, gratificationText: cert.gratificationText, bodyText: cert.bodyText, totalHours: cert.totalHours, averageGrade: cert.averageGrade, issueDate: cert.issueDate, classes: cert.classes };
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(data));
    toast.success('Configuração copiada!');
  };
  const pasteFromClipboard = () => {
    const raw = localStorage.getItem(CLIPBOARD_KEY);
    if (!raw) { toast.error('Nenhuma configuração copiada ainda.'); return; }
    setCert(p => ({ ...p, ...JSON.parse(raw) }));
    toast.success('Configuração colada!');
  };

  const saveCertificate = async () => {
    if (!cert.studentName.trim()) { toast.error('Informe o nome do aluno.'); return; }
    setIsSaving(true);
    try {
      const payload = {
        verification_code: normalizeCode(cert.verificationCode),
        student_name: cert.studentName.trim(),
        student_document: cert.studentDocument.trim(),
        student_email: cert.studentEmail.trim(),
        student_access_code: cert.studentAccessCode.trim(),
        course_name: cert.courseName.trim(),
        course_slug: students.find(s => String(s.id || s.code) === studentKey)?.course || session?.course || '',
        description: cert.bodyText,
        coordinator_name: 'William Ribeiro S.',
        honor_title: cert.honorTitle,
        honor_description: cert.honorDescription,
        issue_date: cert.issueDate.trim(),
        total_hours: Number(cert.totalHours),
        average_grade: cert.averageGrade,
        classes: cert.classes,
        verification_url: makeVerifUrl(cert.verificationCode),
        is_available_to_student: true,
      };
      let record;
      if (savedId) {
        record = await base44.entities.CertificateRecord.update(savedId, payload);
      } else {
        const existing = await base44.entities.CertificateRecord.filter({ verification_code: payload.verification_code });
        record = existing?.[0]
          ? await base44.entities.CertificateRecord.update(existing[0].id, payload)
          : await base44.entities.CertificateRecord.create(payload);
      }
      setSavedId(record?.id || savedId);
      toast.success('Certificado salvo!');
    } catch (e) {
      toast.error('Erro ao salvar: ' + (e.message || ''));
    } finally { setIsSaving(false); }
  };

  const rescueData = async () => {
    setIsRescuing(true);
    try {
      const code = normalizeCode(cert.verificationCode);
      const email = cert.studentEmail.trim();
      let records = [];
      if (code) records = await base44.entities.CertificateRecord.filter({ verification_code: code });
      if (!records.length && email) records = await base44.entities.CertificateRecord.filter({ student_email: email });
      if (records[0]) {
        const r = records[0];
        setSavedId(r.id);
        setCert({
          studentName: r.student_name || '',
          studentDocument: r.student_document || '',
          studentEmail: r.student_email || '',
          studentAccessCode: r.student_access_code || '',
          courseName: r.course_name || '',
          gratificationText: EMPTY_CERT.gratificationText,
          bodyText: r.description || EMPTY_CERT.bodyText,
          totalHours: r.total_hours || 120,
          averageGrade: r.average_grade || '10,0',
          issueDate: r.issue_date || todayPtBr(),
          verificationCode: r.verification_code || makeVerifCode(),
          honorTitle: r.honor_title || '',
          honorDescription: r.honor_description || '',
          classes: Array.isArray(r.classes) && r.classes.length ? r.classes.map(c => ({ ...c, id: c.id || uid() })) : EMPTY_CERT.classes,
        });
        toast.success('Dados resgatados!');
      } else {
        toast.info('Nenhum certificado encontrado.');
      }
    } catch (e) {
      toast.error('Erro ao resgatar: ' + (e.message || ''));
    } finally { setIsRescuing(false); }
  };

  const waitImages = (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(imgs.map(img => img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })));
  };

  const captureNode = async (node) => {
    await waitImages(node);
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, allowTaint: false, width: CERT_W, height: CERT_H });
    return canvas.toDataURL('image/png');
  };

  const generatePdf = async () => {
    if (!frontRef.current || !backRef.current) return;
    setIsGenerating(true);
    try {
      const [fi, bi] = await Promise.all([captureNode(frontRef.current), captureNode(backRef.current)]);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(fi, 'PNG', 0, 0, 297, 210);
      pdf.addPage('a4', 'landscape');
      pdf.addImage(bi, 'PNG', 0, 0, 297, 210);
      pdf.save(`certificado-${sanitizeFileName(cert.studentName || 'aluno')}.pdf`);
      toast.success('PDF gerado!');
    } catch { toast.error('Erro ao gerar PDF.'); }
    finally { setIsGenerating(false); }
  };

  const generatePng = async () => {
    if (!frontRef.current) return;
    setIsGenerating(true);
    try {
      const img = await captureNode(frontRef.current);
      const a = document.createElement('a');
      a.href = img; a.download = `certificado-${sanitizeFileName(cert.studentName || 'aluno')}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success('PNG gerado!');
    } catch { toast.error('Erro ao gerar PNG.'); }
    finally { setIsGenerating(false); }
  };

  const INPUT = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const TEXTAREA = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none";

  return (
    <div className="p-4 lg:p-6 space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow">
            <Award size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Gerador de Certificados</h2>
            <p className="text-xs text-muted-foreground">Frente + verso com gabarito oficial.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={rescueData} disabled={isRescuing} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
            <Search size={14} />{isRescuing ? 'Buscando...' : 'Resgatar'}
          </button>
          <button onClick={saveCertificate} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            <Save size={14} />{isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={generatePng} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
            <FileImage size={14} />PNG Frente
          </button>
          <button onClick={generatePdf} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Download size={14} />{isGenerating ? 'Gerando...' : 'PDF Completo'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        {/* ── Form ── */}
        <div className="space-y-4">

          {/* Student */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-foreground">Aluno</h3>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Selecionar do cadastro</label>
              <select className={INPUT} value={studentKey} onChange={e => { setStudentKey(e.target.value); fillStudent(students.find(s => String(s.id || s.code) === e.target.value)); }}>
                <option value="">Escolha um aluno…</option>
                {students.map(s => (
                  <option key={s.id || s.code} value={s.id || s.code}>
                    {s.student_name || s.profile_name || s.student_email || s.code}{s.course ? ` · ${s.course}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Nome completo</label>
              <input className={INPUT} value={cert.studentName} onChange={e => upd('studentName', e.target.value)} placeholder="Nome completo do aluno" />
            </div>
          </section>

          {/* Frente — textos */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">Frente do Certificado</h3>
              <div className="flex gap-1.5">
                <button onClick={copyToClipboard} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold hover:bg-secondary">
                  <Copy size={12} /> Copiar
                </button>
                <button onClick={pasteFromClipboard} className="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-400 hover:bg-amber-400/20">
                  <ClipboardPaste size={12} /> Colar
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Texto de gratificação (antes do nome)</label>
              <textarea className={TEXTAREA} rows={2} value={cert.gratificationText} onChange={e => upd('gratificationText', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Curso</label>
              <input className={INPUT} value={cert.courseName} onChange={e => upd('courseName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Corpo do texto</label>
              <textarea className={TEXTAREA} rows={3} value={cert.bodyText} onChange={e => upd('bodyText', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Carga (h)</label>
                <input className={INPUT} type="number" value={cert.totalHours} onChange={e => upd('totalHours', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Média</label>
                <input className={INPUT} value={cert.averageGrade} onChange={e => upd('averageGrade', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Data</label>
                <input className={INPUT} value={cert.issueDate} onChange={e => upd('issueDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Código de autenticidade</label>
              <div className="flex gap-2">
                <input className={INPUT + ' font-mono uppercase tracking-widest'} value={cert.verificationCode} onChange={e => upd('verificationCode', e.target.value.toUpperCase())} />
                <button onClick={() => { upd('verificationCode', makeVerifCode()); setSavedId(null); }} className="shrink-0 rounded-lg border border-border bg-background px-2 py-1 hover:bg-secondary">
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          </section>

          {/* Verso — aulas */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">Verso — Aulas</h3>
              <button onClick={addClass} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold hover:bg-secondary">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            {cert.classes.map((cls, i) => (
              <div key={cls.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Aula {i + 1}</span>
                  <button onClick={() => delClass(cls.id)} className="text-muted-foreground hover:text-red-500 transition"><Trash2 size={13} /></button>
                </div>
                <input className={INPUT} value={cls.title} onChange={e => updClass(cls.id, 'title', e.target.value)} placeholder="Título da aula" />
                <div className="grid grid-cols-2 gap-2">
                  <input className={INPUT} type="number" value={cls.hours} onChange={e => updClass(cls.id, 'hours', e.target.value)} placeholder="Horas" />
                  <input className={INPUT} value={cls.grade} onChange={e => updClass(cls.id, 'grade', e.target.value)} placeholder="Nota" />
                </div>
              </div>
            ))}
          </section>

          {/* Verso — destaque */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-foreground">Verso — Qualificação de Destaque <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h3>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Título do destaque</label>
              <input className={INPUT} value={cert.honorTitle} onChange={e => upd('honorTitle', e.target.value)} placeholder="Ex: Aluno com Distinção" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Descrição</label>
              <textarea className={TEXTAREA} rows={3} value={cert.honorDescription} onChange={e => upd('honorDescription', e.target.value)} placeholder="Descreva as qualificações de destaque do aluno..." />
            </div>

            {/* Dados sensíveis — verso */}
            <div className="pt-2 border-t border-border space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wide text-muted-foreground">Dados Sensíveis (verso)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">CPF / RG</label>
                  <input className={INPUT} value={cert.studentDocument} onChange={e => upd('studentDocument', e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">E-mail</label>
                  <input className={INPUT} value={cert.studentEmail} onChange={e => upd('studentEmail', e.target.value)} placeholder="aluno@email.com" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Preview ── */}
        <div className="min-w-0 space-y-3">
          <div className="flex gap-2">
            {['front', 'back'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
                {tab === 'front' ? '🖼 Frente' : '↩ Verso'}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-secondary/40 p-3">
            <div style={{ width: CERT_W }}>
              {activeTab === 'front'
                ? <CertificateFront cert={cert} certRef={frontRef} />
                : <CertificateBack cert={cert} certRef={backRef} />
              }
            </div>
          </div>
          {/* Hidden opposite side for PDF export */}
          <div style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none', zIndex: -1 }}>
            {activeTab === 'front'
              ? <CertificateBack cert={cert} certRef={backRef} />
              : <CertificateFront cert={cert} certRef={frontRef} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}