import React, { useEffect, useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Award, Download, FileImage, RefreshCw, Save, Search, Copy, ClipboardPaste, Move, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import CertificateFront from '@/components/certificates/CertificateFront';
import CertificateBack from '@/components/certificates/CertificateBack';
import AcademicItemSelector from '@/components/certificates/AcademicItemSelector';

const POSITIONS_KEY = 'wr_cert_front_positions_v2';
const DEFAULT_POSITIONS = {
  gratification: { x: 526, y: 210 },
  name:          { x: 526, y: 295 },
  body:          { x: 526, y: 435 },
  qr:            { x: 905, y: 608 },
};
function loadPositions() {
  try { const r = localStorage.getItem(POSITIONS_KEY); if (r) return { ...DEFAULT_POSITIONS, ...JSON.parse(r) }; } catch {}
  return { ...DEFAULT_POSITIONS };
}
function savePositions(pos) { localStorage.setItem(POSITIONS_KEY, JSON.stringify(pos)); }

export const CERT_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/252c62186_BlueandGoldElegantParticipationCertificate5.png';
export const CERT_W = 1052;
export const CERT_H = 744;
const CLIPBOARD_KEY = 'wr_cert_clipboard';

export const COURSE_LABELS = {
  tcc: 'Formação Profissional em Terapia TC',
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
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState(loadPositions);
  // Academic selector state
  const [selectedStudent, setSelectedStudent] = useState(null); // { email, course }
  const [selectorKey, setSelectorKey] = useState(0); // force remount on student change

  const handlePositionsChange = useCallback((next) => {
    setPositions(next);
  }, []);

  const handleSavePositions = () => {
    savePositions(positions);
    toast.success('Posições salvas!');
  };

  const handleResetPositions = () => {
    setPositions({ ...DEFAULT_POSITIONS });
    savePositions({ ...DEFAULT_POSITIONS });
    toast.success('Posições redefinidas.');
  };

  useEffect(() => {
    base44.entities.AccessCode.list('-created_date', 10000)
      .then(r => setStudents(r.filter(s => s.student_name || s.student_email || s.code)))
      .catch(() => {});
  }, []);

  const upd = (field, value) => setCert(p => ({ ...p, [field]: value }));

  const fillStudent = (s) => {
    if (!s) return;
    const studentCodeSuffix = (s.code || '').replace(/[^A-Z0-9]/g, '').slice(-4) || makeVerifCode().slice(-4);
    const uniqueCode = `WR-${String(new Date().getFullYear()).slice(-2)}-${studentCodeSuffix}`;
    const course = s.course || 'tcc';

    setCert(p => ({
      ...p,
      studentName: s.student_name || s.profile_name || p.studentName,
      studentEmail: s.student_email || p.studentEmail,
      studentAccessCode: s.code || p.studentAccessCode,
      courseName: COURSE_LABELS[course] || p.courseName,
      verificationCode: uniqueCode,
    }));
    setSavedId(null);
    // Trigger AcademicItemSelector to load for this student
    setSelectedStudent({ email: s.student_email, course });
    setSelectorKey(k => k + 1);
  };

  // Called by AcademicItemSelector whenever selection changes
  const handleAcademicSelection = useCallback(({ selectedRows }) => {
    const evalRows = selectedRows.filter(r => r.status === 'Avaliado');
    const totalHours = evalRows.reduce((s, r) => s + r.hours, 0);
    const totalScore = evalRows.reduce((s, r) => s + (r.score !== null ? r.score : 0), 0);
    // Nota total = soma dos pontos obtidos (não uma média proporcional)
    const averageGrade = String(Math.round(totalScore * 10) / 10).replace('.', ',');

    // Build classes: one row per selected item (title, hours, grade)
    const classes = selectedRows.map((r, i) => ({
      id: String(i + 1),
      title: r.title,
      hours: r.hours,
      grade: r.score !== null
        ? String(Math.round((r.score / r.max) * 10 * 10) / 10).replace('.', ',')
        : '—',
    }));

    setCert(p => ({ ...p, totalHours, averageGrade, classes }));
  }, []);



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
              <select className={INPUT} value={studentKey} onChange={e => { const v = e.target.value; setStudentKey(v); fillStudent(students.find(s => String(s.id || s.code) === v)); }}>
                <option value="">Escolha um aluno… (código único gerado automaticamente)</option>
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
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Nota Total</label>
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

          {/* Verso — atividades acadêmicas com seletor */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
            <div>
              <h3 className="text-sm font-black text-foreground">Verso — Atividades Acadêmicas</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Selecione quais atividades aparecem no verso do certificado. Pontuação e horas são calculadas automaticamente.
              </p>
            </div>
            {selectedStudent ? (
              <AcademicItemSelector
                key={selectorKey}
                studentEmail={selectedStudent.email}
                course={selectedStudent.course}
                onSelectionChange={handleAcademicSelection}
              />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Selecione um aluno acima para carregar as atividades.
              </p>
            )}
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
          <div className="flex flex-wrap gap-2 items-center">
            {['front', 'back'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
                {tab === 'front' ? '🖼 Frente' : '↩ Verso'}
              </button>
            ))}

            {activeTab === 'front' && (
              <div className="flex gap-2 ml-auto items-center">
                <button
                  onClick={() => setEditMode(e => !e)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${editMode ? 'bg-violet-600 border-violet-600 text-white' : 'border-border bg-background text-foreground hover:bg-secondary'}`}
                >
                  {editMode ? <><Lock size={12} /> Sair do modo edição</> : <><Move size={12} /> Arrastar elementos</>}
                </button>
                {editMode && (
                  <>
                    <button onClick={handleSavePositions} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                      <Save size={12} /> Salvar posições
                    </button>
                    <button onClick={handleResetPositions} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold hover:bg-secondary">
                      <RefreshCw size={12} /> Resetar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {editMode && activeTab === 'front' && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs text-violet-300 flex items-center gap-2">
              <Move size={13} />
              Clique e arraste qualquer elemento para reposicioná-lo. Clique em <strong>Salvar posições</strong> quando terminar.
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border bg-secondary/40 p-3" style={editMode ? { cursor: 'default' } : {}}>
            <div style={{ width: CERT_W }}>
              {activeTab === 'front'
                ? <CertificateFront cert={cert} certRef={frontRef} editMode={editMode} positions={positions} onPositionsChange={handlePositionsChange} />
                : <CertificateBack cert={cert} certRef={backRef} />
              }
            </div>
          </div>

          {/* Hidden opposite side for PDF export */}
          <div style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none', zIndex: -1 }}>
            {activeTab === 'front'
              ? <CertificateBack cert={cert} certRef={backRef} />
              : <CertificateFront cert={cert} certRef={frontRef} editMode={false} positions={positions} onPositionsChange={handlePositionsChange} />
            }
          </div>
        </div>
      </div>
    </div>
  );
}