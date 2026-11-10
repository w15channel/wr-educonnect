/**
 * AcademicItemSelector
 * ────────────────────
 * Replica the HistoricoAcademico item-selection UX inside the certificate
 * generator. Fetches all course activities for a given student_email,
 * renders grouped checkboxes, shows running totals, and calls onSelectionChange
 * with { selectedItems, rows, selectedRows } whenever the selection changes.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Square, Loader2, BookOpen, ClipboardList, TestTube, Heart, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildStudentAcademicData } from '@/lib/buildStudentAcademicData';
import { formatScore } from '@/lib/scoreUtils';
import { formatDuration } from '@/lib/durationUtils';

const CATEGORY_ICONS = {
  'Aula Gravada':      <BookOpen size={11} />,
  'Tarefa':            <ClipboardList size={11} />,
  'Prova':             <TestTube size={11} />,
  'Terapia da Semana': <Heart size={11} />,
  'Ofensiva Diária':   <Flame size={11} />,
};

function ItemRow({ row, checked, onToggle }) {
  const scoreLabel = row.score !== null
    ? `${formatScore(row.score)} / ${formatScore(row.max)} pts`
    : 'Sem nota ainda';
  const hoursLabel = formatDuration(row.minutes);
  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all select-none ${
        checked
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card hover:border-primary/20 hover:bg-secondary/40'
      }`}
    >
      {checked
        ? <CheckSquare size={14} className="text-primary mt-0.5 shrink-0" />
        : <Square size={14} className="text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-foreground leading-tight">{row.title}</p>
        <p className={`text-[10px] mt-0.5 ${row.status === 'Avaliado' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          Módulo {row.module} · {row.status} · {hoursLabel} · {scoreLabel}
        </p>
        {row.notes && (
          <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{row.notes}</p>
        )}
      </div>
    </div>
  );
}

export default function AcademicItemSelector({ studentEmail, course, onSelectionChange }) {
  const [rows, setRows] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch all academic data for student
  useEffect(() => {
    if (!studentEmail || !course) return;
    setLoading(true);
    Promise.all([
      base44.entities.ScoreItem.filter({ student_email: studentEmail }, '-created_date', 2000),
      base44.entities.RecordedLesson.filter({ course }, 'order', 200),
      base44.entities.Task.filter({ course }, '-created_date', 200),
      base44.entities.TherapistPairing.list('-pairing_date', 200),
      base44.entities.DailyChallengeResponse.filter({ student_email: studentEmail }, '-date', 500),
      base44.entities.DailyChallenge.list('-date', 2000),
      base44.entities.ModuleClosure.list('-closed_at', 100),
    ])
      .then(([scoreItems, lessons, tasks, pairings, challengeResponses, challenges, moduleClosures]) => {
        const { rows: allRows } = buildStudentAcademicData({
          studentEmail,
          scoreItems,
          lessons,
          tasks,
          pairings,
          challengeResponses,
          challenges,
          moduleClosures,
        });
        setRows(allRows);
        // Auto-select all evaluated items by default
        const autoSelected = new Set(allRows.filter(r => r.status === 'Avaliado').map(r => r.key));
        setSelectedItems(autoSelected);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentEmail, course]);

  // Notify parent whenever selection or rows change
  useEffect(() => {
    const selectedRows = rows.filter(r => selectedItems.has(r.key));
    onSelectionChange({ selectedItems, rows, selectedRows });
  }, [selectedItems, rows]); // eslint-disable-line

  const toggle = useCallback((key) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const selectAll = () => setSelectedItems(new Set(rows.map(r => r.key)));
  const clearAll  = () => setSelectedItems(new Set());
  const selectEvaluated = () => setSelectedItems(new Set(rows.filter(r => r.status === 'Avaliado').map(r => r.key)));

  // Totals for selected rows only
  const selectedRows = rows.filter(r => selectedItems.has(r.key));
  const evalSelected = selectedRows.filter(r => r.status === 'Avaliado');
  const totalMinutes = evalSelected.reduce((s, r) => s + (Number(r.minutes) || 0), 0);
  const totalScore   = evalSelected.reduce((s, r) => s + (r.score !== null ? r.score : 0), 0);
  const totalMax     = evalSelected.reduce((s, r) => s + r.max, 0);
  const approvalRate = totalMax > 0 ? Math.round((totalScore / totalMax) * 1000) / 10 : 0;
  // Nota total = soma dos pontos obtidos
  const averageGrade = String(Math.round(totalScore * 10) / 10).replace('.', ',');

  // Group rows by category for display
  const grouped = rows.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-xs">
        <Loader2 size={14} className="animate-spin text-primary" />
        Carregando atividades acadêmicas...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Nenhuma atividade encontrada para este aluno.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Selecionados', value: selectedItems.size },
          { label: 'Pontuação de Estudos', value: `${formatScore(totalScore)}/${formatScore(totalMax)}` },
          { label: 'Aproveitamento', value: `${approvalRate}%` },
          { label: 'Carga Horária', value: formatDuration(totalMinutes) },
        ].map(item => (
          <div key={item.label} className="bg-secondary/50 border border-border rounded-lg p-1.5 text-center">
            <p className="text-[9px] text-muted-foreground leading-tight">{item.label}</p>
            <p className="text-[11px] font-black text-primary leading-tight mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Quick-select buttons */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={selectEvaluated} className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/20 transition">
          <CheckSquare size={10} /> Só avaliados
        </button>
        <button onClick={selectAll} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-bold hover:bg-secondary transition">
          <CheckSquare size={10} /> Todos
        </button>
        <button onClick={clearAll} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-bold hover:bg-secondary transition">
          <Square size={10} /> Limpar
        </button>
        <div className="ml-auto text-[10px] text-muted-foreground self-center">
          Pontuação de Estudos: <span className="font-black text-primary">{averageGrade}</span>
        </div>
      </div>

      {/* Grouped items */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-muted-foreground">{CATEGORY_ICONS[cat] || null}</span>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{cat}</p>
            <span className="text-[9px] text-muted-foreground">({items.filter(r => selectedItems.has(r.key)).length}/{items.length})</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {items.map(r => (
              <ItemRow
                key={r.key}
                row={r}
                checked={selectedItems.has(r.key)}
                onToggle={() => toggle(r.key)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}