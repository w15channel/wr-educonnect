import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Download, Search, Settings2, Save, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const WR_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';

const HOURS_MAP = { lesson: 2, live_attendance: 2, task: 1, quiz: 1.5, forum: 0.5, therapist: 1 };

// ─── Assinatura SVG manual ────────────────────────────────────────────────────
function SignatureSVG() {
  return (
    <svg width="140" height="38" viewBox="0 0 140 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', margin: '0 auto 2px' }}>
      <path d="M8 28 C12 18, 16 10, 20 20 C24 30, 28 10, 32 22 C34 28, 36 14, 40 24 C42 30, 44 20, 48 26 C50 30, 52 22, 56 26 C60 30, 62 20, 66 22 C68 24, 70 18, 74 20 C76 22, 78 18, 82 16 C86 14, 90 10, 96 14 C100 17, 102 22, 106 18 C108 16, 110 20, 114 22 C116 23, 118 20, 122 22 C126 24, 128 28, 132 28" stroke="#1e3a5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M20 32 C30 30, 50 31, 70 30 C90 29, 110 31, 130 30" stroke="#1e3a5f" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="1 3" fill="none"/>
    </svg>
  );
}

// ─── AcademicRecord document ──────────────────────────────────────────────────
function AcademicRecord({ student, rows, totalScore, totalMaxScore, totalHours, approvalRate, onClose }) {
  const certRef = useRef(null);
  const emissionDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const emissionTime = format(new Date(), "HH:mm:ss");

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#fff', useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`historico-academico-${student.name.replace(/\s+/g, '-')}.pdf`);
    toast.success('Histórico exportado em PDF!');
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        {onClose && (
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">← Voltar</button>
        )}
        <Button onClick={handleDownloadPDF} className="gap-2 ml-auto">
          <Download size={15} /> Exportar PDF
        </Button>
      </div>

      <div
        ref={certRef}
        className="bg-white"
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          padding: '40px 48px',
          border: '2px solid #1e3a5f',
          boxShadow: 'inset 0 0 0 6px #f0f4f8, inset 0 0 0 8px #1e3a5f',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e3a5f', paddingBottom: 16, marginBottom: 24 }}>
          <img src={WR_LOGO} alt="WR Logo" style={{ width: 70, height: 70, objectFit: 'contain' }} crossOrigin="anonymous" />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 10, letterSpacing: 4, color: '#1e3a5f', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>
              WR — Instituto de Desenvolvimento Humano
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
          <div><span style={{ color: '#888', textTransform: 'uppercase', fontSize: 9, letterSpacing: 1 }}>Total de Pontos</span><p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{totalScore} / {totalMaxScore}</p></div>
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
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Nota</th>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>CH</th>
              <th style={{ color: '#fff', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Situação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px 8px', textAlign: 'center', color: '#aaa', fontSize: 10 }}>Nenhuma atividade selecionada para este histórico.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px', color: '#1e3a5f', maxWidth: 200 }}>{r.title}</td>
                <td style={{ padding: '5px 8px', color: '#555' }}>{r.category}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: r.score !== '—' ? '#1e3a5f' : '#aaa' }}>
                  {r.score !== '—' ? `${r.score}/${r.max}` : '—'}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#555' }}>{r.hours}h</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 'bold', padding: '2px 8px', borderRadius: 20, background: r.status === 'Avaliado' ? '#dcfce7' : '#fef9c3', color: r.status === 'Avaliado' ? '#166534' : '#854d0e' }}>
                    {r.status}
                  </span>
                </td>
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
            <p style={{ margin: '2px 0 0', fontWeight: 'bold', color: '#1e3a5f' }}>{totalScore} pts</p>
          </div>
        </div>

        {/* Signature */}
        <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '24px auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontStyle: 'italic', color: '#1e3a5f', marginBottom: 4, letterSpacing: 1 }}>W.Ribeiro</div>
            <div style={{ width: 180, borderTop: '1px solid #1e3a5f', paddingTop: 6 }}>
              <p style={{ fontSize: 9, color: '#1e3a5f', margin: 0, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>Direção Geral</p>
              <p style={{ fontSize: 8, color: '#888', margin: '2px 0 0' }}>WR — Instituto de Desenvolvimento Humano</p>
            </div>
          </div>
        </div>

        {/* ABED + Legal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, padding: '10px 14px', background: '#f0f4f8', borderRadius: 8, border: '1px solid #dde4ec' }}>
          <div>
            <p style={{ fontSize: 8, color: '#1e3a5f', margin: 0, fontWeight: 'bold' }}>CNPJ: 62.213.790/0001-40</p>
            <p style={{ fontSize: 7, color: '#888', margin: '2px 0 0' }}>Parceiros da ABED — Associação Brasileira de Educação a Distância</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 7, color: '#888', margin: 0 }}>Lei nº 9.394/96 (LDB) · Decreto nº 5.154/04</p>
            <p style={{ fontSize: 7, color: '#888', margin: '1px 0 0' }}>Validade nacional · Formação Profissionalizante</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #ccd6e0', marginTop: 12, paddingTop: 8, textAlign: 'center' }}>
          <p style={{ fontSize: 8, color: '#aaa', margin: 0, letterSpacing: 2, textTransform: 'uppercase' }}>
            Documento emitido digitalmente pela plataforma WR-EDU · {emissionDate} às {emissionTime}
          </p>
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

  const { data: codes = [] } = useQuery({ queryKey: ['access-codes'], queryFn: () => base44.entities.AccessCode.list('-created_date', 200) });
  const { data: lessons = [] } = useQuery({ queryKey: ['lessons'], queryFn: () => base44.entities.RecordedLesson.list('order', 100) });
  const { data: liveSessions = [] } = useQuery({ queryKey: ['live-sessions'], queryFn: () => base44.entities.LiveSession.list('-scheduled_at', 50) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date', 100) });
  const { data: scoreItems = [] } = useQuery({ queryKey: ['score-items-all'], queryFn: () => base44.entities.ScoreItem.list('-created_date', 2000) });
  const { data: pairings = [] } = useQuery({ queryKey: ['therapist-pairings'], queryFn: () => base44.entities.TherapistPairing.list('-pairing_date', 200) });

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
      const si = verifiedScores.find(s => s.category === 'therapist' && s.ref_id === p.id);
      rows.push({ key: `therapist_${p.id}`, category: 'Terapia da Semana', title: `Sessão ${i + 1} (${role})`, score: si?.score ?? '—', max: 10, hours: HOURS_MAP.therapist, status: si ? 'Avaliado' : 'Pendente' });
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
  const totalScore = selectedScoreRows.reduce((sum, r) => sum + (typeof r.score === 'number' ? r.score : 0), 0);
  const totalMaxScore = selectedScoreRows.reduce((sum, r) => sum + r.max, 0);
  const totalHours = selectedRows.filter(r => r.status === 'Avaliado').reduce((sum, r) => sum + r.hours, 0);
  const approvalRate = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : 0;

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
            { label: 'Pontuação', value: `${totalScore}/${totalMaxScore}` },
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
            <Download size={13} /> Gerar PDF ({selectedItems.size})
          </Button>
        </div>

        {Object.entries(groupedRows).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(r => (
                <ItemCheckbox key={r.key} checked={selectedItems.has(r.key)} onChange={() => toggleItem(r.key)} label={r.title} sublabel={`${r.status} · ${r.hours}h · ${r.score !== '—' ? `${r.score}/${r.max} pts` : 'Sem nota'}`} />
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
        <AcademicRecord student={selectedStudent} rows={selectedRows} totalScore={totalScore} totalMaxScore={totalMaxScore} totalHours={totalHours} approvalRate={approvalRate} onClose={() => { setShowDocument(false); setShowSelector(false); setSelectedStudent(null); }} />
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
          {[{ label: 'Itens selecionados', value: selectedItems.size }, { label: 'Pontuação', value: `${totalScore}/${totalMaxScore}` }, { label: 'Aproveitamento', value: `${approvalRate}%` }, { label: 'Carga Horária', value: `${totalHours}h` }].map(item => (
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
              {items.map(r => <ItemCheckbox key={r.key} checked={selectedItems.has(r.key)} onChange={() => toggleItem(r.key)} label={r.title} sublabel={`${r.status} · ${r.hours}h · ${r.score !== '—' ? `${r.score}/${r.max} pts` : 'Sem nota'}`} />)}
            </div>
          </div>
        ))}
        {allRows.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade encontrada para este aluno.</div>}
      </div>
    );
  }

  // ── TEACHER: student list ────────────────────────────────────────────────
  const filtered = codes.filter(c =>
    !search ||
    (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.profile_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.student_email || '').toLowerCase().includes(search.toLowerCase())
  );

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
          const total = studentScores.reduce((sum, s) => sum + (s.score || 0), 0);
          const max = studentScores.reduce((sum, s) => sum + (s.max_score || 10), 0);
          const rate = max > 0 ? ((total / max) * 100).toFixed(0) : 0;
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