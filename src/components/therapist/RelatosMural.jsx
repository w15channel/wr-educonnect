import React, { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, Calendar, ShieldCheck } from 'lucide-react';
import ReportItem from './ReportItem';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { normalizeStudentEmail } from '@/lib/therapistPairings';

function formatDateLabel(dateStr) {
  if (!dateStr) return 'Sem data';
  try {
    return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

// Turns pairings into a flat list of individual reports (one per submitted evaluation).
function buildReports(pairings, getStudentInfo) {
  const reports = [];
  for (const p of pairings) {
    if (p.therapist_submitted && p.therapist_comment) {
      reports.push({
        id: `${p.id}-therapist`,
        pairingId: p.id,
        field: 'therapist',
        date: p.pairing_date,
        authorEmail: p.therapist_email,
        authorName: getStudentInfo(p.therapist_email).name,
        targetName: getStudentInfo(p.patient_email).name,
        roleLabel: 'Terapeuta → Paciente',
        roleColor: 'text-pink-600',
        comment: p.therapist_comment,
        score: p.therapist_score,
      });
    }
    if (p.patient_submitted && p.patient_comment) {
      reports.push({
        id: `${p.id}-patient`,
        pairingId: p.id,
        field: 'patient',
        date: p.pairing_date,
        authorEmail: p.patient_email,
        authorName: getStudentInfo(p.patient_email).name,
        targetName: getStudentInfo(p.therapist_email).name,
        roleLabel: 'Paciente → Terapeuta',
        roleColor: 'text-blue-600',
        comment: p.patient_comment,
        score: p.patient_score,
      });
    }
  }
  return reports;
}

export default function RelatosMural({ pairings, getStudentInfo, isTeacher, session, activeCourse, onEditReport, onDeleteReport }) {
  const [expanded, setExpanded] = useState(false);

  const reports = buildReports(pairings, getStudentInfo);

  // Group by date, most recent first
  const groups = {};
  for (const r of reports) {
    const key = r.date || 'sem-data';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  const sortedDates = Object.keys(groups).sort((a, b) => (b || '').localeCompare(a || ''));

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 p-5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Mural privado da dupla</h3>
            <p className="text-xs text-muted-foreground">Somente relatos das suas duplas · {reports.length} relato(s)</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-muted-foreground shrink-0" /> : <ChevronDown size={18} className="text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border p-5 space-y-5 animate-fade-in">
          {!isTeacher && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
              <ShieldCheck size={15} className="mt-0.5 shrink-0" />
              <span>Espaço confidencial: apenas você, sua dupla em cada atendimento e o professor podem ver estes relatos.</span>
            </div>
          )}
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum relato enviado ainda.</p>
            </div>
          ) : (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  <Calendar size={13} className="text-primary" />
                  {dateKey === 'sem-data' ? 'Sem data' : formatDateLabel(dateKey)}
                </div>
                <div className="space-y-2">
                  {groups[dateKey].map(r => (
                    <ReportItem
                      key={r.id}
                      report={r}
                      isTeacher={isTeacher}
                      isOwn={isTeacher || normalizeStudentEmail(r.authorEmail) === normalizeStudentEmail(session?.email)}
                      session={session}
                      activeCourse={activeCourse}
                      onEdit={onEditReport}
                      onDelete={onDeleteReport}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
