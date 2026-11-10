import jsPDF from 'jspdf';
import { base44 } from '@/api/base44Client';
import { saveBlobWithPicker } from '@/lib/fileExport';
import { BRAND_LEGAL_NAME } from '@/lib/brand';
import { getStepGuide } from '@/lib/checklistGuide';

const ACTIVE_GUIDE_KEY = 'wr_active_checklist_guide';

export function resolveChecklistPrefix(pathname = '') {
  const parts = String(pathname || '').split('/').filter(Boolean);
  if (parts[0] === 'degree') return '/degree/student';
  if (parts[0] === 'student' || parts[0] === 'adm') return `/${parts[0]}`;
  return '';
}

export function saveActiveChecklistGuide({ moduleNumber, itemKey }) {
  if (!moduleNumber) return;
  try {
    sessionStorage.setItem(
      ACTIVE_GUIDE_KEY,
      JSON.stringify({
        moduleNumber: Number(moduleNumber),
        itemKey: itemKey || null,
        updatedAt: Date.now(),
      })
    );
  } catch {}
}

export function loadActiveChecklistGuide() {
  try {
    const raw = sessionStorage.getItem(ACTIVE_GUIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.moduleNumber) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveChecklistGuide() {
  try {
    sessionStorage.removeItem(ACTIVE_GUIDE_KEY);
  } catch {}
}

export async function markChecklistItemDone({ session, moduleNumber, itemKey, queryClient }) {
  if (!moduleNumber || !itemKey) {
    throw new Error('Etapa ou módulo inválido.');
  }
  const studentEmail = session?.email || session?.code;
  const studentIdentifiers = [session?.email, session?.code].filter(Boolean);
  if (!studentEmail && studentIdentifiers.length === 0) {
    throw new Error('Sessão do aluno não identificada.');
  }

  await base44.functions.invoke('saveStudentRecord', {
    action: 'lessonProgressUpsert',
    lesson_id: `checklist:mod${moduleNumber}:${itemKey}`,
    student_email: studentEmail,
    student_identifiers: studentIdentifiers,
    patch: {
      watched: true,
      comment: `Marcada como concluída pelo aluno no módulo ${moduleNumber}.`,
    },
  });

  if (queryClient) {
    await queryClient.invalidateQueries({ queryKey: ['student-learning-records', 'LessonProgress'] });
  }
}

export async function downloadCompletedChecklistPDF({ session, moduleNumber, items = [], modules = [] }) {
  const studentName = session?.name || session?.full_name || session?.email || session?.code || 'Aluno(a)';
  const courseName = String(session?.course || 'tcc').toUpperCase();
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 20;

  // Cabeçalho institucional
  pdf.setFillColor(23, 37, 84);
  pdf.rect(0, 0, pageWidth, 34, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(BRAND_LEGAL_NAME || 'WR-EDU', 15, 15);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Comprovante de Etapas Concluídas do Checklist', 15, 23);
  pdf.setFontSize(8.5);
  pdf.text(`Emitido em ${dateStr} às ${timeStr}`, 15, 29);

  y = 44;
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`Aluno(a): ${studentName}`, 15, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.text(`Curso: ${courseName}   |   Módulo selecionado: Módulo ${moduleNumber}`, 15, y);
  y += 8;

  const targetModules = modules.length > 0
    ? modules.filter((m) => (m.items || []).some((i) => i.done) || m.moduleNumber === Number(moduleNumber))
    : [{ moduleNumber, items }];

  for (const mod of targetModules) {
    const modItems = mod.items || [];
    const doneItems = modItems.filter((i) => i.done);

    if (y > 260) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(14, y - 4, pageWidth - 28, 9, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(23, 37, 84);
    pdf.text(
      `Módulo ${mod.moduleNumber} — ${doneItems.length} de ${modItems.length} etapa(s) concluída(s)`,
      17,
      y + 2
    );
    y += 10;

    if (doneItems.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Nenhuma etapa concluída neste módulo até o momento.', 18, y);
      y += 8;
      continue;
    }

    for (const item of doneItems) {
      if (y > 272) {
        pdf.addPage();
        y = 20;
      }
      const guide = getStepGuide(item.key);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(22, 101, 52);
      pdf.text('[CONCLUÍDO]', 18, y);

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59);
      pdf.text(`${guide.short || item.key}: ${item.label}`, 45, y);
      y += 5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Progresso registrado: ${item.current}/${item.target}`, 45, y);
      y += 6.5;
    }

    y += 3;
  }

  const safeName = String(studentName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'aluno';

  const blob = pdf.output('blob');
  await saveBlobWithPicker(
    blob,
    `checklist-concluidas-mod${moduleNumber}-${safeName}.pdf`,
    'application/pdf'
  );
}