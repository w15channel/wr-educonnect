import React, { useEffect, useRef, useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, FileImage, Plus, RefreshCw, Save, Search, Copy, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';

// ─── Constants ───────────────────────────────────────────────────────────────
const CERT_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/b581d0a00_BlueandGoldElegantParticipationCertificate4.png';
const CERT_W = 1052; // A4 landscape ~96dpi
const CERT_H = 744;
const CLIPBOARD_KEY = 'wr_cert_clipboard';

const COURSE_LABELS = {
  tcc: 'Formação Profissional em Terapia Comportamental',
  psicanalise: 'Formação Profissional em Psicanálise Freudiana',
  sexologia: 'Formação Profissional em Sexologia Integrativa',
};

function makeVerifCode() {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WR-${String(new Date().getFullYear()).slice(-2)}-${r}`;
}

function todayPtBr() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
}

function sanitizeFileName(v) {
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
}

function normalizeCode(v) {
  return String(v || '').trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

function makeVerifUrl(code) {
  const params = new URLSearchParams({ codigo: normalizeCode(code) });
  return `${window.location.origin}/validar-certificado?${params}`;
}

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=6&color=1a2d5a&bgcolor=FFFFFF&data=${encodeURIComponent(data)}`;
}

const EMPTY_CERT = {
  studentName: '',
  studentDocument: '',
  studentEmail: '',
  studentAccessCode: '',
  courseName: '',
  bodyText: 'concluiu com êxito o curso de formação profissional, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
  totalHours: 120,
  averageGrade: '10,0',
  issueDate: todayPtBr(),
  verificationCode: makeVerifCode(),
};

// ─── Certificate Preview ─────────────────────────────────────────────────────
function CertificatePreview({ cert, certRef }) {
  const verifUrl = makeVerifUrl(cert.verificationCode);

  return (
    <div
      ref={certRef}
      style={{
        width: CERT_W,
        height: CERT_H,
        position: 'relative',
        backgroundImage: `url('${CERT_BG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        fontFamily: "'Cinzel', 'Times New Roman', serif",
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* Student name — cursive, centered at ~38% from top */}
      <div style={{
        position: 'absolute',
        top: '36%',
        left: '12%',
        right: '12%',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Pinyon Script', 'Brush Script MT', cursive",
          fontSize: 56,
          color: '#1a2d5a',
          lineHeight: 1.15,
          letterSpacing: 1,
        }}>
          {cert.studentName || 'Nome Completo do Aluno'}
        </div>
      </div>

      {/* Body text */}
      <div style={{
        position: 'absolute',
        top: '54%',
        left: '15%',
        right: '15%',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 15.5,
          color: '#1a2d5a',
          lineHeight: 1.8,
          letterSpacing: 0.4,
        }}>
          {cert.bodyText}
        </div>
        {cert.courseName && (
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 13,
            color: '#1a2d5a',
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginTop: 10,
          }}>
            {cert.courseName}
          </div>
        )}
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 13,
          color: '#1a2d5a',
          marginTop: 8,
          opacity: 0.85,
          letterSpacing: 0.3,
        }}>
          Carga horária: {cert.totalHours}h &nbsp;·&nbsp; Média final: {cert.averageGrade} &nbsp;·&nbsp; {cert.issueDate}
        </div>
      </div>

      {/* QR Code + verification code — bottom right area, above the seal */}
      <div style={{
        position: 'absolute',
        bottom: '13%',
        right: '13%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        <img
          src={qrUrl(verifUrl)}
          alt="QR Code"
          crossOrigin="anonymous"
          style={{ width: 72, height: 72, borderRadius: 4, background: '#fff' }}
        />
        <div style={{
          fontFamily: 'monospace',
          fontSize: 9,
          color: '#1a2d5a',
          letterSpacing: 2,
          fontWeight: 700,
          background: 'rgba(255,255,255,0.7)',
          padding: '2px 5px',
          borderRadius: 3,
        }}>
          {cert.verificationCode}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCertificateGenerator() {
  const { session } = useCustomAuth();
  const certRef = useRef(null);

  const [cert, setCert] = useState({
    ...EMPTY_CERT,
    courseName: COURSE_LABELS[session?.course] || '',
  });
  const [students, setStudents] = useState([]);
  const [studentKey, setStudentKey] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescuing, setIsRescuing] = useState(false);

  // Load students
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

  // ── Clipboard: copy current non-student fields ──
  const copyToClipboard = () => {
    const data = {
      courseName: cert.courseName,
      bodyText: cert.bodyText,
      totalHours: cert.totalHours,
      averageGrade: cert.averageGrade,
      issueDate: cert.issueDate,
    };
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(data));
    toast.success('Configuração copiada! Selecione outro aluno e cole.');
  };

  const pasteFromClipboard = () => {
    const raw = localStorage.getItem(CLIPBOARD_KEY);
    if (!raw) { toast.error('Nenhuma configuração copiada ainda.'); return; }
    const data = JSON.parse(raw);
    setCert(p => ({ ...p, ...data }));
    toast.success('Configuração colada com sucesso!');
  };

  // ── Save ──
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
        issue_date: cert.issueDate.trim(),
        total_hours: Number(cert.totalHours),
        average_grade: cert.averageGrade,
        verification_url: makeVerifUrl(cert.verificationCode),
        is_available_to_student: true,
      };
      let record;
      if (savedId) {
        record = await base44.entities.CertificateRecord.update(savedId, payload);
      } else {
        const existing = await base44.entities.CertificateRecord.filter({ verification_code: payload.verification_code });
        if (existing?.[0]) {
          record = await base44.entities.CertificateRecord.update(existing[0].id, payload);
        } else {
          record = await base44.entities.CertificateRecord.create(payload);
        }
      }
      setSavedId(record?.id || savedId);
      toast.success('Certificado salvo!');
    } catch (e) {
      toast.error('Erro ao salvar: ' + (e.message || 'tente novamente.'));
    } finally { setIsSaving(false); }
  };

  // ── Rescue ──
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
          bodyText: r.description || EMPTY_CERT.bodyText,
          totalHours: r.total_hours || 120,
          averageGrade: r.average_grade || '10,0',
          issueDate: r.issue_date || todayPtBr(),
          verificationCode: r.verification_code || makeVerifCode(),
        });
        toast.success('Dados resgatados do banco!');
      } else {
        toast.info('Nenhum certificado encontrado.');
      }
    } catch (e) {
      toast.error('Erro ao resgatar: ' + (e.message || ''));
    } finally { setIsRescuing(false); }
  };

  // ── Export ──
  const waitImages = (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise(res => { img.onload = res; img.onerror = res; });
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
    });
    return canvas.toDataURL('image/png');
  };

  const generatePdf = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    try {
      const img = await captureNode(certRef.current);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      pdf.addImage(img, 'PNG', 0, 0, 297, 210);
      pdf.save(`certificado-${sanitizeFileName(cert.studentName || 'aluno')}.pdf`);
      toast.success('PDF gerado!');
    } catch (e) { toast.error('Erro ao gerar PDF.'); }
    finally { setIsGenerating(false); }
  };

  const generatePng = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    try {
      const img = await captureNode(certRef.current);
      const a = document.createElement('a');
      a.href = img;
      a.download = `certificado-${sanitizeFileName(cert.studentName || 'aluno')}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success('PNG gerado!');
    } catch (e) { toast.error('Erro ao gerar PNG.'); }
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
            <p className="text-xs text-muted-foreground">Sobreposição sobre o gabarito oficial.</p>
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
            <FileImage size={14} />PNG
          </button>
          <button onClick={generatePdf} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Download size={14} />{isGenerating ? 'Gerando...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        {/* ── Form ── */}
        <div className="space-y-4">

          {/* Student selector */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-foreground">Aluno</h3>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Selecionar do cadastro</label>
              <select className={INPUT} value={studentKey} onChange={e => {
                setStudentKey(e.target.value);
                fillStudent(students.find(s => String(s.id || s.code) === e.target.value));
              }}>
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
          </section>

          {/* Certificate content — with copy/paste */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">Conteúdo do Certificado</h3>
              <div className="flex gap-1.5">
                <button onClick={copyToClipboard} title="Copiar configuração para reutilizar" className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold text-foreground hover:bg-secondary">
                  <Copy size={12} /> Copiar config
                </button>
                <button onClick={pasteFromClipboard} title="Colar configuração copiada" className="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-400 hover:bg-amber-400/20">
                  <ClipboardPaste size={12} /> Colar
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Curso</label>
              <input className={INPUT} value={cert.courseName} onChange={e => upd('courseName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Texto do certificado</label>
              <textarea className={TEXTAREA} rows={4} value={cert.bodyText} onChange={e => upd('bodyText', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Carga horária</label>
                <input className={INPUT} type="number" value={cert.totalHours} onChange={e => upd('totalHours', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Média final</label>
                <input className={INPUT} value={cert.averageGrade} onChange={e => upd('averageGrade', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Data de emissão</label>
              <input className={INPUT} value={cert.issueDate} onChange={e => upd('issueDate', e.target.value)} />
            </div>
          </section>

          {/* Verification code */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground">Código de autenticidade</h3>
              <button onClick={() => { upd('verificationCode', makeVerifCode()); setSavedId(null); }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold hover:bg-secondary">
                <RefreshCw size={12} /> Novo
              </button>
            </div>
            <input className={INPUT + ' font-mono font-bold uppercase tracking-widest'} value={cert.verificationCode} onChange={e => upd('verificationCode', e.target.value.toUpperCase())} />
          </section>
        </div>

        {/* ── Preview ── */}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-2">Pré-visualização (scroll horizontal se necessário)</p>
          <div className="overflow-x-auto rounded-xl border border-border bg-secondary/40 p-3">
            <CertificatePreview cert={cert} certRef={certRef} />
          </div>
        </div>
      </div>
    </div>
  );
}