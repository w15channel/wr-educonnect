import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Download, Search, Settings2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatScore, roundScore } from '@/lib/scoreUtils';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, WR_SIGNATURE_IMAGE, formatDocumentIssuer } from '@/lib/brand';
import { saveBlobWithPicker, shareBlob } from '@/lib/fileExport';
import { HOURS_MAP } from '@/lib/buildStudentAcademicData';
import { Flame } from 'lucide-react';

// ─── AcademicRecord document ──────────────────────────────────────────────────
function AcademicRecord({ student, rows, totalScore, totalMaxScore, totalHours, approvalRate, onClose, isAdmin = false }) {
  const certRef = useRef(null);
  const emissionDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const emissionTime = format(new Date(), "HH:mm:ss");
  const fileBase = `historico-academico-${student.name?.replace(/\s+/g, '-') || 'aluno'}`;

  const getDocumentCanvas = async () => {
    if (!certRef.current) return null;
    return html2canvas(certRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
  };

  const handleDownloadPDF = async () => {
    const canvas = await getDocumentCanvas();
    if (!canvas) return;
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
    await saveBlobWithPicker(blob, `${fileBase}.pdf`, 'application/pdf');
    toast.success('Histórico salvo em PDF.');
  };

  const handleDownloadPNG = async () => {
    const canvas = await getDocumentCanvas();
    if (!canvas) return;
    const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!pngBlob) return;
    await saveBlobWithPicker(pngBlob, `${fileBase}.png`, 'image/png');
    toast.success('Histórico salvo em PNG.');
  };

  const handleShare = async () => {
    const canvas = await getDocumentCanvas();
    if (!canvas) return;
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
    const shared = await shareBlob(blob, `${fileBase}.pdf`, 'application/pdf', 'Histórico Acadêmico');
    if (shared) toast.success('Compartilhamento aberto.');
    else toast.error('Compartilhamento não suportado neste dispositivo.');
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        {onClose && (
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Voltar</button>
        )}
        <div className="flex gap-2 flex-wrap ml-auto">
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download size={15} /> Salvar PDF
          </Button>
          <Button variant="secondary" onClick={handleDownloadPNG} className="gap-2">
            <Download size={15} /> Salvar PNG
          </Button>
          <Button variant="outline" onClick={handleShare} className="gap-2">
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-2xl border border-border bg-secondary/20 p-3">
        <div
          ref={certRef}
          className="bg-white mx-auto"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            width: 794,
            minHeight: 1123,
            padding: '40px 48px',
            border: '2px solid #1e3a5f',
            boxShadow: 'inset 0 0 0 6px #f0f4f8, inset 0 0 0 8px #1e3a5f',
          }}
        >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
          <img src={WR_CERTIFICATE_LOGO} alt="WR Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} crossOrigin="anonymous" />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 10, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
              {BRAND_LEGAL_NAME}
            </p>
            <p style={{ fontSize: 9, color: '#888', margin: '4px 0 0', letterSpacing: 2, textTransform: 'uppercase' }}>
              Terapia · Educação · Desenvolvimento Pessoal
            </p>
          </div>
          <div style={{ width: 70 }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontSize: 10, letterSpacing: 5, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Documento Oficial
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#1e3a5f', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
            Histórico Acadêmico
          </h1>
        </div>

        {/* Student info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', background: '#f8fafc', border: '1px solid #dde4ec', borderRadius: 8, padding: '14px 18px', marginBottom: 24, fontSize: 11 }}>
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Aluno(a)</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{student.name}</p></div>
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Aproveitamento</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: Number(approvalRate) >= 60 ? '#166534' : '#991b1b' }}>{approvalRate}%</p></div>
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Total de Pontos</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{formatScore(totalScore)} / {formatScore(totalMaxScore)}</p></div>
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Carga Horária</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{totalHours}h</p></div>
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Data de Emissão</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{emissionDate}</p></div>
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Horário de Emissão</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{emissionTime}</p></div>
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Situação</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: Number(approvalRate) >= 60 ? '#166534' : '#991b1b' }}>{Number(approvalRate) >= 60 ? 'Aprovado(a)' : 'Em andamento'}</p></div>
        </div>

        {/* Grade table */}
        <p style={{ fontSize: 10, letterSpacing: 3, color: '#7a6a3a', textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 'bold' }}>Grade Curricular</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ background: '#1e3a5f' }}>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', letterSpacing: 0.5 }}>Atividade</th>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Categoria</th>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Pontos</th>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>CH</th>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Situação</th>
              {isAdmin && <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold' }}>Origem / Notas</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ padding: '16px 8px', textAlign: 'center', color: '#aaa', fontSize: 10 }}>Nenhuma atividade selecionada para este histórico.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px', color: '#1e3a5f', maxWidth: 200 }}>{r.title}</td>
                <td style={{ padding: '5px 8px', color: '#555' }}>{r.category}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: (r.score !== null && r.score !== '—') ? '#1e3a5f' : '#aaa' }}>
                  {(r.score !== null && r.score !== '—') ? `${formatScore(r.score)}/${formatScore(r.max)}` : '—'}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#555' }}>{r.hours > 0 ? `${r.hours}h` : '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 'bold', padding: '2px 8px', borderRadius: 20, background: r.status === 'Avaliado' ? '#dcfce7' : '#fef9c3', color: r.status === 'Avaliado' ? '#166534' : '#854d0e' }}>
                    {r.status}
                  </span>
                </td>
                {isAdmin && (
                  <td style={{ padding: '5px 8px', color: '#777', fontSize: 9, maxWidth: 240 }}>
                    {r.notes || '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 32, fontSize: 11 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#888', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Total Carga Horária</span>
            <p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{totalHours} horas/aula</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#888', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Pontuação Final</span>
            <p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{formatScore(totalScore)} pts</p>
          </div>
        </div>

        {/* Signature */}
        <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '24px auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <img src={WR_SIGNATURE_IMAGE} alt="Assinatura William Ribeiro" crossOrigin="anonymous" style={{ width: 220, height: 72, objectFit: 'contain', margin: '0 auto 2px', display: 'block' }} />
            <div style={{ width: 180, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
              <p style={{ fontSize: 9, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>Direção Geral</p>
              <p style={{ fontSize: 8, color: '#888', margin: '2px 0 0' }}>{BRAND_LEGAL_NAME}</p>
              <p style={{ fontSize: 8, color: '#888', margin: '2px 0 0' }}>CNPJ: {BRAND_CNPJ}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 20, paddingTop: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 8, color: '#aaa', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
            Documento emitido digitalmente pela WR-EDU Instituto de Desenvolvimento Humano · CNPJ 62.213.790/001-40 · {emissionDate} às {emissionTime}
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Item selector checkbox ───────────────────────────────────────────────────
function ItemCheckbox({ checked, onChange, label, sublabel }) {
  return (
    <div
      onClick={onChange}
      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
    >
      {checked ? <CheckSquare size={16} className="text-primary mt-0.5 shrink-0" /> : <Square size={16} className="text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoricoAcademico() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  // selectedItems: Set of "category_refId" keys
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showDocument, setShowDocument] = useState(false);

  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';
  const studentCourse = activeCourse;

  const { data: codes = [] } = useQuery({ queryKey: ['access-codes'], queryFn: () => base44.entities.AccessCode.list('-created_date', 200) });
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', studentCourse],
    queryFn: () => base44.entities.RecordedLesson.filter({ course: studentCourse }, 'order', 200),
  });
  const { data: liveSessions = [] } = useQuery({
    queryKey: ['live-sessions-historico', studentCourse],
    queryFn: () => base44.entities.LiveSession.filter({ course: studentCourse }, '-scheduled_at', 50),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', studentCourse],
    queryFn: () => base44.entities.Task.filter({ course: studentCourse }, '-created_date', 200),
  });
  const { data: scoreItems = [] } = useQuery({ queryKey: ['score-items-all'], queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000) });
  const { data: pairings = [] } = useQuery({ queryKey: ['therapist-pairings'], queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 200) });
  const { data: challengeResponses = [] } = useQuery({ queryKey: ['challenge-responses-all'], queryFn: () => base44.entities.DailyChallengeResponse.list('-date', 2000) });

  useEffect(() => {
    if (!isTeacher && session?.email && codes.length > 0) {
      const myCode = codes.find(c => c.student_email === session.email);
      const name = myCode?.profile_name || myCode?.student_name || session.email;
      const email = myCode?.student_email || session.email;
      setSelectedStudent({ name, email, code: myCode });
      // Pre-select all available items for the student
      setShowDocument(false);
      setShowSelector(false);
    }
  }, [isTeacher, session, codes]);

  // Build all possible rows for a student
  function buildAllRows(student) {
    const verifiedScores = scoreItems.filter(s => s.student_email === student.email && s.verified);
    const rows = [];

    lessons.forEach(l => {
      const si = verifiedScores.find(s => s.category === 'lesson' && s.ref_id === l.id);
      rows.push({ key: `lesson_${l.id}`, category: 'Aula Gravada', title: l.title, score: si?.score ?? '—', max: 10, hours: HOURS_MAP.lesson, status: si ? 'Avaliado' : 'Pendente' });
    });

    liveSessions.forEach(l => {
      const si = verifiedScores.find(s => s.category === 'live_attendance' && s.ref_id === l.id);
      rows.push({ key: `live_attendance_${l.id}`, category: 'Aula ao Vivo', title: l.title, score: si?.score ?? '—', max: 5, hours: HOURS_MAP.live_attendance, status: si ? 'Avaliado' : 'Pendente' });
    });

    tasks.forEach(t => {
      const cat = t.type === 'quiz' ? 'quiz' : 'task';
      const si = verifiedScores.find(s => s.category === cat && s.ref_id === t.id);
      rows.push({ key: `${cat}_${t.id}`, category: t.type === 'quiz' ? 'Prova' : 'Tarefa', title: t.title, score: si?.score ?? '—', max: t.max_grade || 10, hours: t.type === 'quiz' ? HOURS_MAP.quiz : HOURS_MAP.task, status: si ? 'Avaliado' : 'Pendente' });
    });

    const myPairings = pairings.filter(p => p.therapist_email === student.email || p.patient_email === student.email);
    myPairings.forEach((p, i) => {
      const role = p.therapist_email === student.email ? 'Terapeuta' : 'Paciente';
      const refId = `therapist_pairing:${p.id}:${role === 'Terapeuta' ? 'therapist' : 'patient'}`;
      const si = verifiedScores.find(s => s.category === 'task' && s.ref_id === refId);
      rows.push({ key: `therapist_${p.id}_${role}`, category: 'Terapia da Semana', title: `Sessão ${i + 1} (${role})`, score: si?.score ?? '—', max: 10, hours: HOURS_MAP.therapist, status: si ? 'Avaliado' : 'Pendente', notes: si?.notes || '' });
    });

    // Ofensivas Diárias
    const myResponses = challengeResponses.filter(r => r.student_email === student.email && (r.points_earned || 0) > 0);
    myResponses.forEach(r => {
      const refId = `ofensiva:${r.challenge_id}:${r.student_email}`;
      const si = verifiedScores.find(s => s.category === 'forum' && s.ref_id === refId);
      const pts = si?.score ?? (r.points_earned || 0);
      rows.push({ key: `ofensiva_${r.challenge_id}`, category: 'Ofensiva Diária', title: `Ofensiva ${r.date || 'sem data'}`, score: pts, max: si?.max_score ?? 1, hours: 0, status: 'Avaliado', notes: si?.notes || `${r.questions_answered || 0} perguntas respondidas` });
    });

    return rows;
  }

  function openSelector(student) {
    setSelectedStudent(student);
    setSelectedItems(new Set()); // start empty — teacher selects
    setShowSelector(true);
    setShowDocument(false);
  }

  function openStudentDirect(student) {
    setSelectedStudent(student);
    setSelectedItems(new Set()); // empty initially for student self-view — they see selector too
    setShowSelector(true);
    setShowDocument(false);
  }

  const allRows = selectedStudent ? buildAllRows(selectedStudent) : [];

  const selectedRows = allRows.filter(r => selectedItems.has(r.key));
  const selectedScoreRows = selectedRows.filter(r => r.status === 'Avaliado');
  const totalScore = selectedScoreRows.reduce((sum, r) => roundScore(sum + (typeof r.score === 'number' ? roundScore(r.score) : 0)), 0);
  const totalMaxScore = selectedScoreRows.reduce((sum, r) => roundScore(sum + roundScore(r.max)), 0);
  const totalHours = selectedRows.filter(r => r.status === 'Avaliado').reduce((sum, r) => sum + r.hours, 0);
  const approvalRate = totalMaxScore > 0 ? formatScore((totalScore / totalMaxScore) * 100) : 0;

  const toggleItem = (key) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedItems(new Set(allRows.map(r => r.key)));
  const clearAll = () => setSelectedItems(new Set());

  // Group rows by category label for the selector UI
  const groupedRows = allRows.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  // ── STUDENT VIEW: direct record view with selector ───────────────────────
  if (!isTeacher) {
    if (!selectedStudent) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    if (showDocument) {
      return (
        <div className="p-4 lg:p-7 max-w-4xl mx-auto">
          <button onClick={() => setShowDocument(false)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">← Voltar</button>
          <AcademicRecord
            student={selectedStudent}
            rows={selectedRows}
            totalScore={totalScore}
            totalMaxScore={totalMaxScore}
            totalHours={totalHours}
            approvalRate={approvalRate}
          />
        </div>
      );
    }

    return (
      <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-5 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Meu Histórico Acadêmico</h2>
            <p className="text-muted-foreground text-sm mt-0.5">{selectedStudent.name}</p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Itens selecionados', value: selectedItems.size },
            { label: 'Pontuação', value: `${formatScore(totalScore)}/${formatScore(totalMaxScore)}` },
            { label: 'Aproveitamento', value: `${approvalRate}%` },
            { label: 'Carga Horária', value: `${totalHours}h` },
          ].map(item => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-black text-primary">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAll} className="h-8 text-xs gap-1.5">
            <CheckSquare size={13} /> Selecionar Tudo
            
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="h-8 text-xs gap-1.5">
            <Square size={13} /> Limpar
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 ml-auto" disabled={selectedItems.size === 0} onClick={() => setShowDocument(true)}>
            <Download size={13} /> Gerar Histórico ({selectedItems.size})
          </Button>
        </div>

        {Object.entries(groupedRows).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(r => (
                <ItemCheckbox key={r.key} checked={selectedItems.has(r.key)} onChange={() => toggleItem(r.key)} label={r.title} sublabel={`${r.status}${r.hours > 0 ? ` · ${r.hours}h` : ''} · ${(r.score !== null && r.score !== '—') ? `${formatScore(r.score)}/${formatScore(r.max)} pts` : 'Sem nota'}${r.notes ? ` · ${r.notes}` : ''}`} />
              ))}
            </div>
          </div>
        ))}
        {allRows.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade encontrada ainda.</div>}
      </div>
    );
  }

  // ── TEACHER: document view ───────────────────────────────────────────────
  if (showDocument && selectedStudent) {
    return (
      <div className="p-4 lg:p-7 max-w-4xl mx-auto">
        <button onClick={() => setShowDocument(false)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">← Voltar para Seleção</button>
        <AcademicRecord student={selectedStudent} rows={selectedRows} totalScore={totalScore} totalMaxScore={totalMaxScore} totalHours={totalHours} approvalRate={approvalRate} isAdmin={isTeacher} onClose={() => { setShowDocument(false); setShowSelector(false); setSelectedStudent(null); }} />
      </div>
    );
  }

  // ── TEACHER: selector view ───────────────────────────────────────────────
  if (showSelector && selectedStudent) {
    return (
      <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-5 animate-fade-in-up">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setShowSelector(false); setSelectedStudent(null); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Voltar</button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground">Selecionar Conteúdo do Histórico</h2>
            <p className="text-sm text-muted-foreground">Aluno: <span className="font-semibold text-foreground">{selectedStudent.name}</span></p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ label: 'Itens selecionados', value: selectedItems.size }, { label: 'Pontuação', value: `${formatScore(totalScore)}/${formatScore(totalMaxScore)}` }, { label: 'Aproveitamento', value: `${approvalRate}%` }, { label: 'Carga Horária', value: `${totalHours}h` }].map(item => (
            <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-black text-primary">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={selectAll} className="h-8 text-xs gap-1.5"><CheckSquare size={13} /> Selecionar Tudo</Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="h-8 text-xs gap-1.5"><Square size={13} /> Limpar</Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 ml-auto" disabled={selectedItems.size === 0} onClick={() => setShowDocument(true)}><Download size={13} /> Gerar Histórico ({selectedItems.size})</Button>
        </div>
        {Object.entries(groupedRows).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(r => <ItemCheckbox key={r.key} checked={selectedItems.has(r.key)} onChange={() => toggleItem(r.key)} label={r.title} sublabel={`${r.status}${r.hours > 0 ? ` · ${r.hours}h` : ''} · ${(r.score !== null && r.score !== '—') ? `${formatScore(r.score)}/${formatScore(r.max)} pts` : 'Sem nota'}${r.notes ? ` · ${r.notes}` : ''}`} />)}
            </div>
          </div>
        ))}
        {allRows.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade encontrada para este aluno.</div>}
      </div>
    );
  }

  // ── TEACHER: student list ────────────────────────────────────────────────
  const filtered = codes.filter(c => {
    if (activeCourse && c.course !== activeCourse) return false;
    if (codePrefix && !(c.code || '').startsWith(codePrefix)) return false;
    if (courseEmails && !courseEmails.has(c.student_email || '')) return false;
    return !search ||
      (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.profile_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.student_email || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Histórico Acadêmico</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Selecione um aluno para configurar e emitir o histórico</p>
        </div>
      </div>

      <div className="relative w-full sm:w-80">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
      </div>

      <div className="space-y-2">
        {filtered.map(code => {
          const email = code.student_email || '';
          const name = code.profile_name || code.student_name || 'Sem nome';
          const studentScores = scoreItems.filter(s => s.student_email === email && s.verified);
          const total = roundScore(code.pontuacao_total ?? studentScores.reduce((sum, item) => roundScore(sum + roundScore(item.score)), 0));
          const max = studentScores.reduce((sum, item) => roundScore(sum + roundScore(item.max_score || 10)), 0);
          const rate = max > 0 ? Math.round((total / max) * 100) : 0;
          return (
            <div key={code.id} onClick={() => openSelector({ name, email, code })} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}>
                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">Aproveitamento</p>
                  <p className={`text-sm font-black ${Number(rate) >= 60 ? 'text-green-600' : 'text-orange-500'}`}>{rate}%</p>
                </div>
                <div className="bg-primary/10 px-3 py-1.5 rounded-xl">
                  <p className="text-xs text-muted-foreground">Pontos</p>
                  <p className="text-sm font-black text-primary">{total}</p>
                </div>
                <Settings2 size={15} className="text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}