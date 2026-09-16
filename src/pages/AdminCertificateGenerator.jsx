import React, { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Award,
  Download,
  FileImage,
  RefreshCw,
  Save,
  Search,
  Copy,
  ClipboardPaste,
  Move,
  Lock,
  Loader2,
  CheckCircle2,
  Users,
  Bell,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import CertificateFront from '@/components/certificates/CertificateFront';
import CertificateBack from '@/components/certificates/CertificateBack';
import AcademicItemSelector from '@/components/certificates/AcademicItemSelector';
import { formatDuration, parseDurationToMinutes } from '@/lib/durationUtils';

const POSITIONS_KEY = 'wr_cert_front_positions_v2';
const CLIPBOARD_KEY = 'wr_cert_clipboard';

const DEFAULT_POSITIONS = {
  gratification: { x: 526, y: 210 },
  name: { x: 526, y: 295 },
  body: { x: 526, y: 435 },
  qr: { x: 905, y: 608 },
};

const GOOGLE_DRIVE_CERT_BG_FILE_ID = '1dPpaAG0DutbJ-kqMNFchf64Mh6TKgCaf';

const CERT_BG_LOCAL_HD = '/certificates/certificado-background-hd.png';
const CERT_BG_DRIVE_DIRECT = `https://lh3.googleusercontent.com/d/${GOOGLE_DRIVE_CERT_BG_FILE_ID}=s0`;

export const CERT_BG = CERT_BG_LOCAL_HD;
const LEGACY_CERT_BG_FILE_HINT = 'BlueandGoldElegantParticipationCertificate';
export const CERT_W = 1052;
export const CERT_H = 744;
const CERT_EXPORT_SCALE = 6;
const CERT_EXPORT_W = CERT_W * CERT_EXPORT_SCALE;
const CERT_EXPORT_H = CERT_H * CERT_EXPORT_SCALE;
const CERT_PNG_MIME = 'image/png';
const PDF_A4_LANDSCAPE_W_MM = 297;
const PDF_A4_LANDSCAPE_H_MM = 210;
const PDF_IMAGE_COMPRESSION = 'NONE';
const A4_LANDSCAPE_300_DPI_W = 3508;
const A4_LANDSCAPE_300_DPI_H = 2480;
const CERT_BG_SOURCES = [
  { label: 'background local HD', src: CERT_BG_LOCAL_HD },
  { label: 'background Google Drive', src: CERT_BG_DRIVE_DIRECT },
];

export const COURSE_LABELS = {
  tcc: 'Formacao Profissional em Terapia TC',
  psicanalise: 'Formacao Profissional em Psicanalise Freudiana',
  sexologia: 'Formacao Profissional em Sexologia Integrativa',
};

// ── Templates por curso (Etapa 6) ───────────────────────────────────
const COURSE_TEMPLATES = {
  tcc: {
    courseName: 'Formação Profissional em Terapia Comportamental',
    gratificationText: 'É com imensa satisfação que certificamos que',
    bodyText: 'concluiu com êxito o curso de Formação Profissional em Terapia Comportamental, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
  },
  psicanalise: {
    courseName: 'Formação Profissional em Psicanálise Freudiana',
    gratificationText: 'É com imensa satisfação que certificamos que',
    bodyText: 'concluiu com êxito o curso de Formação Profissional em Psicanálise Freudiana, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
  },
  sexologia: {
    courseName: 'Formação Profissional em Sexologia Integrativa',
    gratificationText: 'É com imensa satisfação que certificamos que',
    bodyText: 'concluiu com êxito o curso de Formação Profissional em Sexologia Integrativa, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
  },
};

const GROUPED_CATEGORIES = new Set([
  'Tarefa',
  'Prova',
  'Terapia da Semana',
  'Ofensiva Diaria',
  'Ofensiva Diária',
]);

const GROUP_LABELS = {
  Tarefa: 'Tarefas de Classe',
  Prova: 'Provas',
  'Terapia da Semana': 'Terapia da Semana',
  'Ofensiva Diaria': 'Ofensivas Diarias',
  'Ofensiva Diária': 'Ofensivas Diarias',
};

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeStorageGet(key) {
  if (!canUseBrowserStorage()) return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function safeStorageSet(key, value) {
  if (!canUseBrowserStorage()) return false;
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
}

function normalizePosition(value, fallback) {
  return {
    x: Number.isFinite(Number(value?.x)) ? Number(value.x) : fallback.x,
    y: Number.isFinite(Number(value?.y)) ? Number(value.y) : fallback.y,
  };
}

function normalizePositions(value = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_POSITIONS).map(([key, fallback]) => [key, normalizePosition(value?.[key], fallback)])
  );
}

function loadPositions() {
  const raw = safeStorageGet(POSITIONS_KEY);
  if (!raw) return normalizePositions();
  try { return normalizePositions(JSON.parse(raw)); } catch { return normalizePositions(); }
}

function savePositions(pos) {
  return safeStorageSet(POSITIONS_KEY, JSON.stringify(normalizePositions(pos)));
}

function randomToken(length = 4) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) { bytes[i] = Math.floor(Math.random() * 256); }
  }
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export function makeVerifCode() {
  return `WR-${String(new Date().getFullYear()).slice(-2)}-${randomToken(5)}`;
}

export function todayPtBr() {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
}

export function sanitizeFileName(value) {
  const safe = String(value || 'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return safe || 'arquivo';
}

export function normalizeCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
}

export function makeVerifUrl(code) {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  return `${origin}/validar-certificado?codigo=${encodeURIComponent(normalizeCode(code))}`;
}

function uid() {
  return `${Date.now().toString(36)}-${randomToken(5).toLowerCase()}`;
}

function toNumber(value, fallback = 0) {
  const normalized = String(value ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatPtNumber(value, decimals = 1) {
  const numeric = toNumber(value, 0);
  return String(Math.round(numeric * 10 ** decimals) / 10 ** decimals).replace('.', ',');
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function createEmptyCert(courseName = '') {
  return {
    studentName: '',
    studentDocument: '',
    studentEmail: '',
    studentAccessCode: '',
    courseName,
    gratificationText: 'É com imensa satisfação que certificamos que',
    bodyText: 'concluiu com êxito o curso de formação profissional, cumprindo todos os requisitos pedagógicos, avaliações e carga horária estabelecidos pela instituição.',
    totalHours: 120,
    totalMinutes: 120 * 60,
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
}

function getCourseName(courseSlug, fallback = '') {
  return COURSE_TEMPLATES[courseSlug]?.courseName || COURSE_LABELS[courseSlug] || fallback || '';
}

function getStudentOptionValue(student) {
  return String(student?.id || student?.code || student?.student_email || '');
}

function pickClipboardPayload(cert) {
  return {
    courseName: cert.courseName,
    gratificationText: cert.gratificationText,
    bodyText: cert.bodyText,
    totalHours: cert.totalHours,
    totalMinutes: cert.totalMinutes,
    averageGrade: cert.averageGrade,
    issueDate: cert.issueDate,
    classes: Array.isArray(cert.classes) ? cert.classes : [],
  };
}

function normalizeSavedClasses(classes) {
  if (!Array.isArray(classes) || classes.length === 0) return createEmptyCert().classes;
  return classes
    .filter((item) => cleanText(item?.title))
    .map((item) => ({
      id: item.id || uid(),
      title: cleanText(item.title),
      minutes: toNumber(item.minutes, toNumber(item.hours, 0) * 60),
      hours: toNumber(item.hours, 0),
      grade: cleanText(item.grade || item.score || '0,0'),
    }));
}

export default function AdminCertificateGenerator() {
  const { session } = useCustomAuth();
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const [cert, setCert] = useState(() => createEmptyCert(getCourseName(session?.course)));
  const [students, setStudents] = useState([]);
  const [studentKey, setStudentKey] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRescuing, setIsRescuing] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [activeTab, setActiveTab] = useState('front');
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState(loadPositions);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectorKey, setSelectorKey] = useState(0);

  // ── Estados de automação (Etapas 1, 4, 5) ──────────────────────────
  const [activePanel, setActivePanel] = useState('generator');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [isBatchEmitting, setIsBatchEmitting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentName: '' });

  const handlePositionsChange = useCallback((next) => {
    setPositions(normalizePositions(next));
  }, []);

  const upd = useCallback((field, value) => {
    setCert((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleSavePositions = () => {
    const ok = savePositions(positions);
    if (ok) toast.success('Posições salvas.');
    else toast.error('Não foi possível salvar as posições neste navegador.');
  };

  const handleResetPositions = () => {
    const next = normalizePositions();
    setPositions(next);
    savePositions(next);
    toast.success('Posições redefinidas.');
  };

  useEffect(() => {
    const courseName = getCourseName(session?.course);
    if (!courseName) return;
    setCert((previous) => previous.courseName ? previous : { ...previous, courseName });
  }, [session?.course]);

  // ── Carrega alunos (existente) ────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setIsLoadingStudents(true);
    base44.entities.AccessCode.list('-created_date', 10000)
      .then((records = []) => {
        if (!mounted) return;
        const visibleStudents = records.filter((student) =>
          student?.student_name || student?.profile_name || student?.student_email || student?.code
        );
        setStudents(visibleStudents);
      })
      .catch((error) => {
        console.error('[Certificados] Erro ao carregar alunos:', error);
        toast.error('Não foi possível carregar a lista de alunos.');
      })
      .finally(() => { if (mounted) setIsLoadingStudents(false); });
    return () => { mounted = false; };
  }, []);

  // ── Carrega solicitações pendentes (Etapa 1) ──────────────────────
  const loadPendingRequests = useCallback(async () => {
    try {
      const records = await base44.entities.Announcement.filter({ type: 'info' }, '-created_date', 200);
      const requests = records.filter(r => (r.title || '').startsWith('Solicitação de Certificado'));
      setPendingRequests(requests);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadPendingRequests(); }, [loadPendingRequests]);

  // ── fillStudent com templates e auto-preenchimento (Etapa 3+6) ────
  const fillStudent = (student) => {
    if (!student) { setSelectedStudent(null); return; }

    const cleanAccessCode = normalizeCode(student.code);
    const studentCodeSuffix = cleanAccessCode.replace(/[^A-Z0-9]/g, '').slice(-5) || randomToken(5);
    const uniqueCode = `WR-${String(new Date().getFullYear()).slice(-2)}-${studentCodeSuffix}`;
    const course = student.course || session?.course || 'tcc';
    const studentEmail = cleanText(student.student_email);
    const template = COURSE_TEMPLATES[course] || {};

    setCert((previous) => ({
      ...previous,
      studentName: cleanText(student.student_name || student.profile_name) || previous.studentName,
      studentEmail: studentEmail || previous.studentEmail,
      studentAccessCode: cleanAccessCode || previous.studentAccessCode,
      courseName: template.courseName || getCourseName(course, previous.courseName),
      gratificationText: template.gratificationText || previous.gratificationText,
      bodyText: template.bodyText || previous.bodyText,
      verificationCode: normalizeCode(uniqueCode),
      issueDate: todayPtBr(),
    }));
    setSavedId(null);
    setSelectedStudent(studentEmail ? { email: studentEmail, course } : null);
    setSelectorKey((key) => key + 1);
  };

  // ── Resolver solicitação: carrega aluno no gerador (Etapa 1) ──────
  const resolveRequest = async (request) => {
    const emailMatch = (request.content || '').match(/E-mail: (.+)/);
    const email = emailMatch?.[1]?.trim() || '';
    const student = students.find(s => s.student_email === email);
    if (student) {
      fillStudent(student);
      setStudentKey(getStudentOptionValue(student));
      setActivePanel('generator');
      toast.success(`Aluno ${student.student_name || student.profile_name} carregado no gerador.`);
    } else {
      toast.error('Aluno não encontrado no cadastro. Verifique se ainda está ativo.');
    }
  };

  const dismissRequest = async (request) => {
    await base44.entities.Announcement.delete(request.id).catch(() => {});
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    toast.success('Solicitação arquivada.');
  };

  // ── Detecção de elegibilidade (Etapa 4) ────────────────────────────
  const calculateEligibility = async () => {
    setIsLoadingEligibility(true);
    try {
      const allCerts = await base44.entities.CertificateRecord.list('-created_date', 5000);
      const certEmails = new Set(allCerts.map(c => (c.student_email || '').toLowerCase()));

      const courseStudents = students.filter(s =>
        s.is_active !== false &&
        s.student_email &&
        (s.course === session?.course || (!s.course && (session?.course || 'tcc') === 'tcc'))
      );

      const result = courseStudents.map(s => {
        const hasCert = certEmails.has((s.student_email || '').toLowerCase());
        const pontuacao = Number(s.pontuacao_estudos) || 0;
        return {
          student: s,
          hasCertificate: hasCert,
          pontuacao,
          eligible: !hasCert && pontuacao > 0,
        };
      }).sort((a, b) => b.pontuacao - a.pontuacao);

      setEligibleStudents(result);
    } catch (error) {
      toast.error('Erro ao verificar elegibilidade: ' + (error.message || ''));
    } finally {
      setIsLoadingEligibility(false);
    }
  };

  // ── Emissão em lote (Etapa 5) ─────────────────────────────────────
  const batchEmit = async (studentsToEmit) => {
    const toEmit = studentsToEmit.filter(s => s.eligible && !s.hasCertificate);
    if (toEmit.length === 0) {
      toast.info('Nenhum aluno elegível sem certificado para emitir.');
      return;
    }

    setIsBatchEmitting(true);
    setBatchProgress({ current: 0, total: toEmit.length, currentName: '' });
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toEmit.length; i++) {
      const { student } = toEmit[i];
      const name = student.student_name || student.profile_name || student.student_email || 'aluno';
      setBatchProgress({ current: i + 1, total: toEmit.length, currentName: name });

      try {
        const studentEmail = cleanText(student.student_email).toLowerCase();
        const course = student.course || session?.course || 'tcc';
        const template = COURSE_TEMPLATES[course] || {};
        const studentCodeSuffix = normalizeCode(student.code).replace(/[^A-Z0-9]/g, '').slice(-5) || randomToken(5);
        const verificationCode = normalizeCode(`WR-${String(new Date().getFullYear()).slice(-2)}-${studentCodeSuffix}`);

        // Buscar dados acadêmicos do aluno
        const scoreItems = await base44.entities.ScoreItem.filter({ student_email: studentEmail }, '-created_date', 500);
        const evalItems = scoreItems.filter(item => item.verified);
        const totalScore = evalItems.reduce((s, item) => s + (Number(item.score) || 0), 0);

        const payload = {
          verification_code: verificationCode,
          student_name: cleanText(student.student_name || student.profile_name),
          student_email: studentEmail,
          student_access_code: normalizeCode(student.code),
          course_name: template.courseName || getCourseName(course),
          course_slug: course,
          description: template.bodyText || createEmptyCert().bodyText,
          coordinator_name: 'William Ribeiro S.',
          honor_title: '',
          honor_description: '',
          issue_date: todayPtBr(),
          total_hours: 0,
          total_minutes: 0,
          average_grade: String(Math.round(totalScore * 10) / 10).replace('.', ','),
          classes: [],
          verification_url: makeVerifUrl(verificationCode),
          is_available_to_student: true,
        };

        const existing = await base44.entities.CertificateRecord.filter({ student_email: studentEmail });
        if (existing?.length > 0) {
          await base44.entities.CertificateRecord.update(existing[0].id, payload);
        } else {
          await base44.entities.CertificateRecord.create(payload);
        }

        // Deletar solicitação pendente se existir
        const studentRequests = pendingRequests.filter(r => (r.content || '').includes(studentEmail));
        for (const req of studentRequests) {
          await base44.entities.Announcement.delete(req.id).catch(() => {});
        }
        if (studentRequests.length > 0) {
          setPendingRequests(prev => prev.filter(r => !studentRequests.some(sr => sr.id === r.id)));
        }

        // Notificar aluno
        await base44.entities.Announcement.create({
          title: 'Seu certificado foi emitido!',
          content: `Olá ${payload.student_name}! Seu certificado de conclusão foi emitido e está disponível para download na aba Certificação > Meu Diploma. Código de autenticidade: ${verificationCode}`,
          type: 'info',
          course,
          recipient_email: studentEmail,
        }).catch(() => {});

        successCount++;
      } catch (error) {
        console.error(`[Batch] Erro ao emitir para ${student.student_name}:`, error);
        errorCount++;
      }
    }

    setIsBatchEmitting(false);
    setBatchProgress({ current: 0, total: 0, currentName: '' });

    if (successCount > 0) toast.success(`${successCount} certificado(s) emitido(s) com sucesso!`);
    if (errorCount > 0) toast.error(`${errorCount} erro(s) durante a emissão.`);

    calculateEligibility();
  };

  // ── handleAcademicSelection (existente) ───────────────────────────
  const handleAcademicSelection = useCallback(({ selectedRows = [] } = {}) => {
    const evalRows = selectedRows.filter((row) => row?.status === 'Avaliado');
    const totalMinutes = evalRows.reduce((sum, row) => sum + toNumber(row.minutes, 0), 0);
    const totalScore = evalRows.reduce((sum, row) => sum + toNumber(row.score, 0), 0);
    const averageGrade = formatPtNumber(totalScore, 1);

    const classesMap = {};
    let itemId = 0;

    evalRows.forEach((row) => {
      const category = cleanText(row.category);
      const minutes = toNumber(row.minutes, 0);
      const score = toNumber(row.score, 0);

      if (category === 'Aula Gravada') {
        itemId += 1;
        classesMap[`individual_${itemId}`] = { id: String(itemId), title: cleanText(row.title) || 'Aula Gravada', minutes, scoreSum: score };
        return;
      }
      if (GROUPED_CATEGORIES.has(category)) {
        const groupKey = `group_${category}`;
        if (!classesMap[groupKey]) {
          itemId += 1;
          classesMap[groupKey] = { id: String(itemId), title: GROUP_LABELS[category] || category, minutes: 0, scoreSum: 0 };
        }
        classesMap[groupKey].minutes += minutes;
        classesMap[groupKey].scoreSum += score;
      }
    });

    const classes = Object.values(classesMap).map((item) => ({
      id: item.id, title: item.title, minutes: item.minutes,
      hours: Math.round((item.minutes / 60) * 100) / 100,
      grade: formatPtNumber(item.scoreSum, 1),
    }));

    setCert((previous) => ({
      ...previous,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      averageGrade,
      classes: classes.length ? classes : previous.classes,
    }));
  }, []);

  // ── Clipboard (existente) ─────────────────────────────────────────
  const copyToClipboard = () => {
    const ok = safeStorageSet(CLIPBOARD_KEY, JSON.stringify(pickClipboardPayload(cert)));
    if (ok) toast.success('Configuração copiada.');
    else toast.error('Não foi possível copiar a configuração.');
  };

  const pasteFromClipboard = () => {
    const raw = safeStorageGet(CLIPBOARD_KEY);
    if (!raw) { toast.error('Nenhuma configuração copiada ainda.'); return; }
    try {
      const parsed = JSON.parse(raw);
      const payload = pickClipboardPayload(parsed);
      setCert((previous) => ({ ...previous, ...payload, classes: normalizeSavedClasses(payload.classes) }));
      setSavedId(null);
      toast.success('Configuração colada.');
    } catch { toast.error('A configuração copiada está corrompida.'); }
  };

  // ── Validação (existente) ─────────────────────────────────────────
  const validateCertificate = () => {
    if (!cleanText(cert.studentName)) return 'Informe o nome do aluno.';
    if (!cleanText(cert.courseName)) return 'Informe o nome do curso.';
    if (!normalizeCode(cert.verificationCode)) return 'Informe o código de autenticidade.';
    if (toNumber(cert.totalMinutes, 0) <= 0) return 'Informe uma carga horária válida.';
    return '';
  };

  // ── saveCertificate com resolução de solicitações (Etapa 1) ────────
  const saveCertificate = async () => {
    const validationError = validateCertificate();
    if (validationError) { toast.error(validationError); return null; }

    setIsSaving(true);
    try {
      const matchedStudent = students.find((student) => getStudentOptionValue(student) === studentKey);
      const verificationCode = normalizeCode(cert.verificationCode);
      const payload = {
        verification_code: verificationCode,
        student_name: cleanText(cert.studentName),
        student_document: cleanText(cert.studentDocument),
        student_email: cleanText(cert.studentEmail).toLowerCase(),
        student_access_code: normalizeCode(cert.studentAccessCode),
        course_name: cleanText(cert.courseName),
        course_slug: matchedStudent?.course || session?.course || '',
        description: cleanText(cert.bodyText),
        coordinator_name: 'William Ribeiro S.',
        honor_title: cleanText(cert.honorTitle),
        honor_description: cleanText(cert.honorDescription),
        issue_date: cleanText(cert.issueDate),
        total_hours: toNumber(cert.totalHours, 0),
        total_minutes: toNumber(cert.totalMinutes, 0),
        average_grade: cleanText(cert.averageGrade),
        classes: normalizeSavedClasses(cert.classes),
        verification_url: makeVerifUrl(verificationCode),
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

      // Deletar solicitação pendente do aluno (Etapa 1)
      const studentEmail = payload.student_email;
      if (studentEmail) {
        const studentRequests = pendingRequests.filter(r => (r.content || '').includes(studentEmail));
        for (const req of studentRequests) {
          await base44.entities.Announcement.delete(req.id).catch(() => {});
        }
        if (studentRequests.length > 0) {
          setPendingRequests(prev => prev.filter(r => !studentRequests.some(sr => sr.id === r.id)));
        }

        // Notificar aluno sobre a emissão
        await base44.entities.Announcement.create({
          title: 'Seu certificado foi emitido!',
          content: `Olá ${payload.student_name}! Seu certificado de conclusão foi emitido e está disponível para download na aba Certificação > Meu Diploma. Código de autenticidade: ${verificationCode}`,
          type: 'info',
          course: payload.course_slug || 'tcc',
          recipient_email: studentEmail,
        }).catch(() => {});
      }

      toast.success('Certificado salvo.');
      return record;
    } catch (error) {
      toast.error('Erro ao salvar: ' + (error.message || ''));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // ── rescueData (existente) ────────────────────────────────────────
  const rescueData = async () => {
    setIsRescuing(true);
    try {
      const code = normalizeCode(cert.verificationCode);
      const email = cleanText(cert.studentEmail).toLowerCase();
      let records = [];
      if (code) records = await base44.entities.CertificateRecord.filter({ verification_code: code });
      if (!records.length && email) records = await base44.entities.CertificateRecord.filter({ student_email: email });
      if (!records[0]) { toast.info('Nenhum certificado encontrado.'); return; }

      const record = records[0];
      setSavedId(record.id);
      setCert({
        ...createEmptyCert(record.course_name || getCourseName(session?.course)),
        studentName: record.student_name || '',
        studentDocument: record.student_document || '',
        studentEmail: record.student_email || '',
        studentAccessCode: record.student_access_code || '',
        courseName: record.course_name || '',
        bodyText: record.description || createEmptyCert().bodyText,
        totalHours: toNumber(record.total_hours, 120),
        totalMinutes: toNumber(record.total_minutes, toNumber(record.total_hours, 120) * 60),
        averageGrade: record.average_grade || '10,0',
        issueDate: record.issue_date || todayPtBr(),
        verificationCode: record.verification_code || makeVerifCode(),
        honorTitle: record.honor_title || '',
        honorDescription: record.honor_description || '',
        classes: normalizeSavedClasses(record.classes),
      });
      toast.success('Dados resgatados.');
    } catch (error) {
      toast.error('Erro ao resgatar: ' + (error.message || ''));
    } finally {
      setIsRescuing(false);
    }
  };

  // ── Exportação (existente — inalterado) ────────────────────────────
  const waitImages = async (node) => {
    const imgs = Array.from(node?.querySelectorAll?.('img') || []);
    await Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === 'function') return img.decode().catch(() => {});
        return Promise.resolve();
      }
      return new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
    }));
  };

  const isCertificateBackgroundSource = (value = '') => {
    const source = String(value || '');
    return source.includes(GOOGLE_DRIVE_CERT_BG_FILE_ID)
      || source.includes(LEGACY_CERT_BG_FILE_HINT)
      || source.includes(encodeURIComponent(GOOGLE_DRIVE_CERT_BG_FILE_ID));
  };

  const hideCertificateBackgroundInClone = (clonedDocument, clonedElement) => {
    const allNodes = [clonedElement, ...Array.from(clonedElement?.querySelectorAll?.('*') || [])].filter(Boolean);
    allNodes.forEach((element) => {
      const tagName = element.tagName?.toLowerCase();
      const inlineBackground = element.style?.backgroundImage || '';
      const computedBackground = clonedDocument.defaultView?.getComputedStyle(element)?.backgroundImage || '';
      const src = tagName === 'img' ? element.getAttribute('src') || element.src || '' : '';
      if (tagName === 'img' && isCertificateBackgroundSource(src)) { element.style.visibility = 'hidden'; element.style.opacity = '0'; }
      if (isCertificateBackgroundSource(inlineBackground) || isCertificateBackgroundSource(computedBackground)) { element.style.backgroundImage = 'none'; element.style.background = 'transparent'; }
    });
    if (clonedElement?.style) { clonedElement.style.backgroundColor = 'transparent'; }
  };

  const nodeHasCertificateBackground = (node) => {
    const allNodes = [node, ...Array.from(node?.querySelectorAll?.('*') || [])].filter(Boolean);
    return allNodes.some((element) => {
      const tagName = element.tagName?.toLowerCase();
      const src = tagName === 'img' ? element.getAttribute('src') || element.src || '' : '';
      const inlineBackground = element.style?.backgroundImage || '';
      const computedBackground = typeof window !== 'undefined' ? window.getComputedStyle(element)?.backgroundImage || '' : '';
      return isCertificateBackgroundSource(src) || isCertificateBackgroundSource(inlineBackground) || isCertificateBackgroundSource(computedBackground);
    });
  };

  const getImageResolution = (image) => ({ width: image?.naturalWidth || image?.width || 0, height: image?.naturalHeight || image?.height || 0 });
  const isGoodEnoughForPrint = (image) => { const { width, height } = getImageResolution(image); return width >= A4_LANDSCAPE_300_DPI_W && height >= A4_LANDSCAPE_300_DPI_H; };

  const preloadImage = (src, timeoutMs = 12000) => new Promise((resolve) => {
    if (!src || typeof window === 'undefined') { resolve(null); return; }
    const image = new window.Image();
    let settled = false;
    const finish = (result) => { if (settled) return; settled = true; window.clearTimeout(timeout); resolve(result); };
    const timeout = window.setTimeout(() => finish(null), timeoutMs);
    image.crossOrigin = 'anonymous';
    image.onload = async () => { try { if (typeof image.decode === 'function') await image.decode(); } catch {} finish(image); };
    image.onerror = () => finish(null);
    image.src = src;
  });

  const loadBestBackgroundImage = async () => {
    const loaded = [];
    for (const source of CERT_BG_SOURCES) {
      const image = await preloadImage(source.src);
      if (!image) { continue; }
      const resolution = getImageResolution(image);
      loaded.push({ ...source, image, ...resolution });
      if (isGoodEnoughForPrint(image)) { return { ...source, image, ...resolution }; }
    }
    if (!loaded.length) return null;
    return loaded.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
  };

  const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Não foi possível gerar o PNG em alta resolução.')); }, CERT_PNG_MIME);
  });

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const releaseCanvas = (canvas) => { if (!canvas) return; canvas.width = 1; canvas.height = 1; };

  const drawImageCover = (context, image, targetWidth, targetHeight) => {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;
    let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
    if (sourceRatio > targetRatio) { sw = sourceHeight * targetRatio; sx = (sourceWidth - sw) / 2; }
    else if (sourceRatio < targetRatio) { sh = sourceWidth / targetRatio; sy = (sourceHeight - sh) / 2; }
    context.drawImage(image, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
  };

  const captureFullNodeCanvas = async (node) => {
    if (!node) throw new Error('Área do certificado não encontrada.');
    await waitImages(node);
    return html2canvas(node, { scale: CERT_EXPORT_SCALE, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', width: CERT_W, height: CERT_H, windowWidth: CERT_W, windowHeight: CERT_H, scrollX: 0, scrollY: 0, logging: false, imageTimeout: 15000 });
  };

  const captureOverlayCanvas = async (node) => {
    if (!node) throw new Error('Área do certificado não encontrada.');
    await waitImages(node);
    return html2canvas(node, { scale: CERT_EXPORT_SCALE, useCORS: true, allowTaint: false, backgroundColor: null, width: CERT_W, height: CERT_H, windowWidth: CERT_W, windowHeight: CERT_H, scrollX: 0, scrollY: 0, logging: false, imageTimeout: 15000, onclone: (clonedDocument, clonedElement) => { hideCertificateBackgroundInClone(clonedDocument, clonedElement); } });
  };

  const composeCertificateCanvas = async (node) => {
    if (!node) throw new Error('Área do certificado não encontrada.');
    if (!nodeHasCertificateBackground(node)) { return captureFullNodeCanvas(node); }
    const bestBackground = await loadBestBackgroundImage();
    if (!bestBackground?.image) { return captureFullNodeCanvas(node); }
    const backgroundImage = bestBackground.image;
    const backgroundNaturalWidth = bestBackground.width;
    const backgroundNaturalHeight = bestBackground.height;
    const overlayCanvas = await captureOverlayCanvas(node);
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = CERT_EXPORT_W; outputCanvas.height = CERT_EXPORT_H;
    const context = outputCanvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Não foi possível preparar o canvas de exportação HD.');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, CERT_EXPORT_W, CERT_EXPORT_H);
    drawImageCover(context, backgroundImage, CERT_EXPORT_W, CERT_EXPORT_H);
    context.drawImage(overlayCanvas, 0, 0, CERT_EXPORT_W, CERT_EXPORT_H);
    releaseCanvas(overlayCanvas);
    return outputCanvas;
  };

  const captureNode = async (node) => {
    const canvas = await composeCertificateCanvas(node);
    return canvas;
  };

  const generatePdf = async () => {
    if (!frontRef.current || !backRef.current) { toast.error('Prévia do certificado ainda não está pronta.'); return; }
    setIsGenerating(true);
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: false });
      const frontCanvas = await captureNode(frontRef.current);
      pdf.addImage(frontCanvas, 'PNG', 0, 0, PDF_A4_LANDSCAPE_W_MM, PDF_A4_LANDSCAPE_H_MM, undefined, PDF_IMAGE_COMPRESSION);
      releaseCanvas(frontCanvas);
      pdf.addPage('a4', 'landscape');
      const backCanvas = await captureNode(backRef.current);
      pdf.addImage(backCanvas, 'PNG', 0, 0, PDF_A4_LANDSCAPE_W_MM, PDF_A4_LANDSCAPE_H_MM, undefined, PDF_IMAGE_COMPRESSION);
      releaseCanvas(backCanvas);
      pdf.save(`certificado-${sanitizeFileName(cert.studentName || 'aluno')}.pdf`);
      toast.success(`PDF gerado em alta resolução (${CERT_EXPORT_W} x ${CERT_EXPORT_H}px por página).`);
    } catch (error) { toast.error('Erro ao gerar PDF: ' + (error.message || '')); }
    finally { setIsGenerating(false); }
  };

  const generatePng = async () => {
    if (!frontRef.current) { toast.error('Frente do certificado ainda não está pronta.'); return; }
    setIsGenerating(true);
    try {
      const canvas = await captureNode(frontRef.current);
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, `certificado-${sanitizeFileName(cert.studentName || 'aluno')}-${CERT_EXPORT_W}x${CERT_EXPORT_H}.png`);
      releaseCanvas(canvas);
      toast.success(`PNG gerado em alta resolução (${CERT_EXPORT_W} x ${CERT_EXPORT_H}px).`);
    } catch (error) { toast.error('Erro ao gerar PNG: ' + (error.message || '')); }
    finally { setIsGenerating(false); }
  };

  const INPUT = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const TEXTAREA = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none';

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
            <p className="text-xs text-muted-foreground">Frente e verso com gabarito oficial · Automação de emissão</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={rescueData} disabled={isRescuing} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
            {isRescuing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {isRescuing ? 'Buscando...' : 'Resgatar'}
          </button>
          <button onClick={saveCertificate} disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={generatePng} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
            <FileImage size={14} /> PNG HD Frente
          </button>
          <button onClick={generatePdf} disabled={isGenerating} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isGenerating ? 'Gerando...' : 'PDF HD Completo'}
          </button>
        </div>
      </div>

      {/* ── Painel de abas: Gerador / Solicitações / Elegibilidade ── */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActivePanel('generator')} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${activePanel === 'generator' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
          <Award size={14} /> Gerador
        </button>
        <button onClick={() => setActivePanel('requests')} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${activePanel === 'requests' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
          <Bell size={14} /> Solicitações
          {pendingRequests.length > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none">{pendingRequests.length}</span>}
        </button>
        <button onClick={() => { setActivePanel('eligibility'); if (!eligibleStudents.length) calculateEligibility(); }} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${activePanel === 'eligibility' ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
          <Users size={14} /> Elegibilidade
        </button>
      </div>

      {/* ── Painel: Solicitações Pendentes (Etapa 1) ────────────────── */}
      {activePanel === 'requests' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-black text-foreground mb-1">Solicitações de Emissão de Certificado</h3>
            <p className="text-xs text-muted-foreground mb-4">Alunos que solicitaram a emissão do certificado pela aba Certificação.</p>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma solicitação pendente.</div>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(req => {
                  const nameMatch = (req.title || '').match(/Solicitação de Certificado - (.+)/);
                  const name = nameMatch?.[1] || 'Aluno';
                  const emailMatch = (req.content || '').match(/E-mail: (.+)/);
                  const email = emailMatch?.[1]?.trim() || '';
                  const progressMatch = (req.content || '').match(/Progresso geral: (\d+)%/);
                  const progress = progressMatch?.[1] || '?';
                  return (
                    <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 bg-amber-500">
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground">{email} · Progresso: {progress}%</p>
                      </div>
                      <button onClick={() => resolveRequest(req)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shrink-0">
                        <Zap size={12} /> Emitir
                      </button>
                      <button onClick={() => dismissRequest(req)} className="text-xs text-muted-foreground hover:text-red-500 font-semibold shrink-0">Arquivar</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Painel: Elegibilidade (Etapa 4+5) ──────────────────────── */}
      {activePanel === 'eligibility' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-foreground">Alunos e Elegibilidade</h3>
                <p className="text-xs text-muted-foreground">Verifique quais alunos podem receber certificado e emita em lote.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={calculateEligibility} disabled={isLoadingEligibility} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold hover:bg-secondary disabled:opacity-50">
                  {isLoadingEligibility ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Atualizar
                </button>
                <button onClick={() => batchEmit(eligibleStudents)} disabled={isBatchEmitting || !eligibleStudents.some(s => s.eligible)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {isBatchEmitting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} Emitir lote
                </button>
              </div>
            </div>

            {isBatchEmitting && (
              <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                <p className="text-xs font-bold text-emerald-800">Emitindo certificados... ({batchProgress.current}/{batchProgress.total})</p>
                <p className="text-xs text-emerald-700">Aluno atual: {batchProgress.currentName}</p>
                <div className="mt-2 h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {isLoadingEligibility ? (
              <div className="text-center py-8"><Loader2 size={20} className="animate-spin text-primary mx-auto" /></div>
            ) : eligibleStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum aluno encontrado. Clique em "Atualizar" para carregar.</div>
            ) : (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                {eligibleStudents.map(({ student, hasCertificate, pontuacao, eligible }) => {
                  const name = student.student_name || student.profile_name || student.student_email || '?';
                  return (
                    <div key={student.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition ${hasCertificate ? 'border-green-300 bg-green-50' : eligible ? 'border-amber-300 bg-amber-50' : 'border-border bg-background'}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0" style={{ backgroundColor: student.profile_avatar_color || '#5b5ef4' }}>
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-foreground truncate">{name}</p>
                        <p className="text-[10px] text-muted-foreground">{student.student_email} · {pontuacao} pts</p>
                      </div>
                      {hasCertificate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full"><CheckCircle2 size={10} /> Emitido</span>
                      ) : eligible ? (
                        <button onClick={() => { fillStudent(student); setStudentKey(getStudentOptionValue(student)); setActivePanel('generator'); }} className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded-full hover:bg-amber-300 transition">
                          <Zap size={10} /> Emitir
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sem atividade</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Painel: Gerador (existente) ────────────────────────────── */}
      {activePanel === 'generator' && (
        <>
          <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
            <div className="space-y-4">
              <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-foreground">Aluno</h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Selecionar do cadastro</label>
                  <select className={INPUT} value={studentKey} disabled={isLoadingStudents} onChange={(event) => { const value = event.target.value; setStudentKey(value); fillStudent(students.find((student) => getStudentOptionValue(student) === value)); }}>
                    <option value="">{isLoadingStudents ? 'Carregando alunos...' : 'Escolha um aluno... código único gerado automaticamente'}</option>
                    {students.map((student) => {
                      const value = getStudentOptionValue(student);
                      return (
                        <option key={value} value={value}>
                          {student.student_name || student.profile_name || student.student_email || student.code}
                          {student.course ? ` - ${student.course}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Nome completo</label>
                  <input className={INPUT} value={cert.studentName} onChange={(event) => upd('studentName', event.target.value)} placeholder="Nome completo do aluno" />
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-foreground">Frente do Certificado</h3>
                  <div className="flex gap-1.5">
                    <button onClick={copyToClipboard} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold hover:bg-secondary"><Copy size={12} /> Copiar</button>
                    <button onClick={pasteFromClipboard} className="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-500 hover:bg-amber-400/20"><ClipboardPaste size={12} /> Colar</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Texto de gratificação antes do nome</label>
                  <textarea className={TEXTAREA} rows={2} value={cert.gratificationText} onChange={(event) => upd('gratificationText', event.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Curso</label>
                  <input className={INPUT} value={cert.courseName} onChange={(event) => upd('courseName', event.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Corpo do texto</label>
                  <textarea className={TEXTAREA} rows={3} value={cert.bodyText} onChange={(event) => upd('bodyText', event.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Carga (HH:MM:SS)</label>
                    <input className={`${INPUT} font-mono`} value={formatDuration(cert.totalMinutes ?? (toNumber(cert.totalHours, 0) * 60))} onChange={(event) => { const minutes = parseDurationToMinutes(event.target.value); setCert((previous) => ({ ...previous, totalMinutes: minutes, totalHours: Math.round((minutes / 60) * 100) / 100 })); }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Nota Total</label>
                    <input className={INPUT} value={cert.averageGrade} onChange={(event) => upd('averageGrade', event.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Data</label>
                    <input className={INPUT} value={cert.issueDate} onChange={(event) => upd('issueDate', event.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Código de autenticidade</label>
                  <div className="flex gap-2">
                    <input className={`${INPUT} font-mono uppercase tracking-widest`} value={cert.verificationCode} onChange={(event) => upd('verificationCode', normalizeCode(event.target.value))} />
                    <button type="button" aria-label="Gerar novo código" onClick={() => { upd('verificationCode', makeVerifCode()); setSavedId(null); }} className="shrink-0 rounded-lg border border-border bg-background px-2 py-1 hover:bg-secondary"><RefreshCw size={13} /></button>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                <div>
                  <h3 className="text-sm font-black text-foreground">Verso - Atividades Acadêmicas</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Selecione quais atividades aparecem no verso do certificado. Pontuação e horas são calculadas automaticamente.</p>
                </div>
                {selectedStudent ? (
                  <AcademicItemSelector key={selectorKey} studentEmail={selectedStudent.email} course={selectedStudent.course} onSelectionChange={handleAcademicSelection} />
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Selecione um aluno com e-mail cadastrado para carregar as atividades.</p>
                )}
              </section>

              <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-black text-foreground">Verso - Qualificação de Destaque <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h3>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Título do destaque</label>
                  <input className={INPUT} value={cert.honorTitle} onChange={(event) => upd('honorTitle', event.target.value)} placeholder="Ex: Aluno com Distinção" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Descrição</label>
                  <textarea className={TEXTAREA} rows={3} value={cert.honorDescription} onChange={(event) => upd('honorDescription', event.target.value)} placeholder="Descreva as qualificações de destaque do aluno..." />
                </div>
                <div className="pt-2 border-t border-border space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wide text-muted-foreground">Dados sensíveis do verso</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">CPF / RG</label>
                      <input className={INPUT} value={cert.studentDocument} onChange={(event) => upd('studentDocument', event.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">E-mail</label>
                      <input className={INPUT} type="email" value={cert.studentEmail} onChange={(event) => upd('studentEmail', event.target.value)} placeholder="aluno@email.com" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                {['front', 'back'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground hover:bg-secondary'}`}>
                    {tab === 'front' ? 'Frente' : 'Verso'}
                  </button>
                ))}
                {activeTab === 'front' && (
                  <div className="flex gap-2 ml-auto items-center">
                    <button onClick={() => setEditMode((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition border ${editMode ? 'bg-violet-600 border-violet-600 text-white' : 'border-border bg-background text-foreground hover:bg-secondary'}`}>
                      {editMode ? <><Lock size={12} /> Sair da edição</> : <><Move size={12} /> Arrastar elementos</>}
                    </button>
                    {editMode && (
                      <>
                        <button onClick={handleSavePositions} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"><Save size={12} /> Salvar posições</button>
                        <button onClick={handleResetPositions} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold hover:bg-secondary"><RefreshCw size={12} /> Resetar</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editMode && activeTab === 'front' && (
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs text-violet-300 flex items-center gap-2"><Move size={13} /> Clique e arraste qualquer elemento para reposicionar. Depois clique em <strong>Salvar posições</strong>.</div>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-3" style={editMode ? { cursor: 'default' } : {}}>
                <div style={{ width: CERT_W }}>
                  {activeTab === 'front' ? (
                    <CertificateFront cert={cert} certRef={frontRef} editMode={editMode} positions={positions} onPositionsChange={handlePositionsChange} />
                  ) : (
                    <CertificateBack cert={cert} certRef={backRef} />
                  )}
                </div>
              </div>

              <div style={{ position: 'fixed', top: -9999, left: -9999, pointerEvents: 'none', zIndex: -1 }}>
                {activeTab === 'front' ? (
                  <CertificateBack cert={cert} certRef={backRef} />
                ) : (
                  <CertificateFront cert={cert} certRef={frontRef} editMode={false} positions={positions} onPositionsChange={handlePositionsChange} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}