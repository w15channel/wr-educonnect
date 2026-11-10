import React, { useState } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { generateCode } from '@/lib/customAuth';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Users, Search, Eye, CheckCircle, XCircle, RefreshCw, SlidersHorizontal, Zap, Trash2, Pencil, FileSpreadsheet, Upload, Check, AlertCircle } from 'lucide-react';
import StudentQuickEdit from '@/components/admin/StudentQuickEdit';
import { functionLabel } from '@/lib/profileRoles';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatScore, roundScore } from '@/lib/scoreUtils';

function FunctionBadge({ code }) {
  return (
    <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      {functionLabel(code.profile_category, 'student')}
    </span>
  );
}

function parseCSVRows(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim();
  const rows = [];
  let current = [];
  let inQuotes = false;
  let field = '';

  for (let i = 0; i < lines.length; i++) {
    const char = lines[i];
    const nextChar = lines[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      current.push(field.trim());
      field = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      current.push(field.trim());
      field = '';
      if (current.length > 1 || (current.length === 1 && current[0] !== '')) {
        rows.push(current);
      }
      current = [];
    } else {
      field += char;
    }
  }
  if (field || current.length > 0) {
    current.push(field.trim());
    rows.push(current);
  }
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, idx) => {
      const val = row[idx] ? row[idx].replace(/^["']|["']$/g, '').trim() : '';
      obj[h] = val;
    });
    return obj;
  }).filter(r => r.student_email || r.email || r.code || r.student_name || r.dedupe_key || r.title || r.message);
}

export default function Students() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: session } = useOutletContext() || {};

  // Build base prefix: /adm or /student (no slug — routes are now flat)
  const scopedPrefix = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'student' || parts[0] === 'adm') return `/${parts[0]}`;
    return '';
  })();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [enrollingCode, setEnrollingCode] = useState(null);
  const [enrollNewCourse, setEnrollNewCourse] = useState('');
  const [editingCodeId, setEditingCodeId] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 2000),
  });

  // Fase 2: query key padronizada — 'task-submissions-all' (global) não conflita
  // com 'task-submissions', email (filtrado, usado em StudentDetail e HistoricoAcademico)
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['task-submissions-all'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 1000),
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-created_date', 10000),
  });

  const { data: tuitions = [] } = useQuery({
    queryKey: ['tuitions'],
    queryFn: () => base44.entities.Tuition.list('-month_ref', 500),
  });

  const { data: existingAchievements = [] } = useQuery({
    queryKey: ['achievements-all'],
    queryFn: () => base44.entities.Achievement.list('-occurred_at', 2500),
  });

  const updateCodeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessCode.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-codes'] }),
  });

  const deleteCodeMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('deleteStudentData', { code_id: id, admin_email: session?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Aluno e todos os seus dados foram removidos permanentemente.');
    },
    onError: () => toast.error('Erro ao remover aluno.'),
  });

  const [syncing, setSyncing] = useState(false);

  const syncStudents = async () => {
    setSyncing(true);
    try {
      const [lessons, tasks, scoreItems] = await Promise.all([
        base44.entities.RecordedLesson.list('order', 200),
        base44.entities.Task.list('-created_date', 200),
        base44.entities.ScoreItem.list('-created_date', 5000),
      ]);
      let created = 0;
      for (const code of codes) {
        if (!code.student_email || !code.is_active) continue;
        if (codePrefix && !(code.code || '').startsWith(codePrefix)) continue;
        if (courseEmails && !courseEmails.has(code.student_email)) continue;
        const email = code.student_email;
        const existingScores = scoreItems.filter(s => s.student_email === email);
        const toCreate = [];
        for (const lesson of lessons) {
          if (!existingScores.find(s => s.category === 'lesson' && s.ref_id === lesson.id)) {
            toCreate.push({ student_email: email, category: 'lesson', ref_id: lesson.id, ref_title: lesson.title, score: 0, max_score: 2, verified: false });
          }
        }
        for (const task of tasks) {
          const cat = task.type === 'quiz' ? 'quiz' : 'task';
          if (!existingScores.find(s => s.category === cat && s.ref_id === task.id)) {
            toCreate.push({ student_email: email, category: cat, ref_id: task.id, ref_title: task.title, score: 0, max_score: task.type === 'quiz' ? 50 : 5, verified: false });
          }
        }
        if (toCreate.length > 0) {
          await base44.entities.ScoreItem.bulkCreate(toCreate);
          created += toCreate.length;
        }
      }
      queryClient.invalidateQueries();
      toast.success(`Sincronização concluída! ${created} registros criados.`);
    } catch (err) {
      toast.error('Erro na sincronização.');
    }
    setSyncing(false);
  };

  const getStudentProfile = (code) => studentProfiles.find(p => p.student_email === code.student_email);

  const getStudentStats = (code) => {
    const subs = allSubmissions.filter(s => s.student_email === code.student_email);
    const profile = studentProfiles.find(p => p.student_email === code.student_email && (p.dashboard_course === activeCourse || (!p.dashboard_course && activeCourse === 'tcc')));
    const moduleScore = roundScore(code.pontuacao_total ?? profile?.pontuacao_total ?? profile?.points ?? 0);
    return { moduleScore, moduleScoreDisplay: formatScore(moduleScore), submissions: subs.length };
  };

  const getStudentTuitionStatus = (code) => {
    const studentTuitions = tuitions.filter(t => t.student_email === code.student_email);
    if (studentTuitions.length === 0) return null;
    if (studentTuitions.some(t => t.status === 'overdue')) return 'overdue';
    if (studentTuitions.some(t => t.status === 'pending')) return 'pending';
    return 'paid';
  };

  const enrollMutation = useMutation({
    mutationFn: async ({ sourceCode, targetCourse }) => {
      const newCode = generateCode(targetCourse);
      const newAccessCode = await base44.entities.AccessCode.create({
        code: newCode,
        student_name: sourceCode.student_name,
        student_email: sourceCode.student_email,
        profile_name: sourceCode.profile_name,
        profile_bio: sourceCode.profile_bio,
        profile_avatar_color: sourceCode.profile_avatar_color,
        profile_avatar_emoji: sourceCode.profile_avatar_emoji,
        profile_photo_url: sourceCode.profile_photo_url,
        course: targetCourse,
        is_active: true,
      });
      return newAccessCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      setEnrollingCode(null);
      setEnrollNewCourse('');
      toast.success('Aluno matriculado em novo curso!');
    },
  });

  const previewItems = React.useMemo(() => {
    return parseCSVRows(csvText);
  }, [csvText]);

  const isAchievementImport = React.useMemo(() => {
    if (!previewItems.length) return false;
    const first = previewItems[0];
    return Boolean(first.dedupe_key || (first.kind && (first.title || first.message)));
  }, [previewItems]);

  const previewAnalysis = React.useMemo(() => {
    if (isAchievementImport) {
      let toUpdate = 0;
      let toCreate = 0;
      const items = previewItems.map(item => {
        const dedupeKey = item.dedupe_key || `${item.course || activeCourse}:${item.kind || 'general'}:${String(item.student_email || item.email || '').toLowerCase()}:${item.title || item.message || ''}`;
        const existing = existingAchievements.find(a => (a.dedupe_key && a.dedupe_key === dedupeKey) || (a.id && a.id === item.id));
        if (existing) toUpdate++;
        else toCreate++;
        return {
          ...item,
          dedupeKey,
          isExisting: Boolean(existing),
          existingRecord: existing,
        };
      });
      return { isAchievement: true, items, toUpdate, toCreate };
    }

    let toUpdate = 0;
    let toCreate = 0;
    const items = previewItems.map(item => {
      const email = String(item.student_email || item.email || '').trim().toLowerCase();
      const codeVal = String(item.code || '').trim().toUpperCase();
      const existing = codes.find(c =>
        (email && String(c.student_email || '').toLowerCase() === email) ||
        (codeVal && String(c.code || '').toUpperCase() === codeVal)
      );
      if (existing) toUpdate++;
      else toCreate++;
      return {
        ...item,
        isExisting: Boolean(existing),
        existingCode: existing,
      };
    });
    return { isAchievement: false, items, toUpdate, toCreate };
  }, [isAchievementImport, previewItems, existingAchievements, codes, activeCourse]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target?.result || '');
      toast.info('Arquivo CSV carregado para visualização.');
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (previewAnalysis.items.length === 0) return;
    setImporting(true);
    try {
      if (previewAnalysis.isAchievement) {
        const toSave = previewAnalysis.items.map(item => ({
          id: item.id || undefined,
          dedupe_key: item.dedupe_key || item.dedupeKey,
          course: item.course || activeCourse || 'tcc',
          student_email: String(item.student_email || item.email || '').trim().toLowerCase(),
          kind: item.kind || 'general',
          title: item.title || '',
          message: item.message || item.title || '',
          source_id: item.source_id || '',
          occurred_at: item.occurred_at || new Date().toISOString(),
          student_feature_until: item.student_feature_until || '',
          wall_highlight_until: item.wall_highlight_until || '',
          mentioned_emails: item.mentioned_emails ? (Array.isArray(item.mentioned_emails) ? item.mentioned_emails : [item.mentioned_emails]) : [],
        }));

        await base44.entities.Achievement.bulkCreate(toSave);

        await queryClient.invalidateQueries({ queryKey: ['overcoming-wall-achievements'] });
        await queryClient.invalidateQueries({ queryKey: ['achievements-all'] });
        await queryClient.invalidateQueries({ queryKey: ['module-achievements-trophies'] });
        await queryClient.invalidateQueries({ queryKey: ['class-contribution-awards'] });
        await queryClient.invalidateQueries({ queryKey: ['class-beginner-awards'] });
        await queryClient.invalidateQueries({ queryKey: ['student-achievements'] });

        setIsImportModalOpen(false);
        setCsvText('');
        toast.success(`Importação realizada! ${toSave.length} conquistas sincronizadas e mescladas via dedupe_key no Mural e nos Perfis.`);
        return;
      }

      let updatedCount = 0;
      let createdCount = 0;

      for (const item of previewAnalysis.items) {
        const email = String(item.student_email || item.email || '').trim().toLowerCase();
        const codeVal = String(item.code || '').trim().toUpperCase();
        const name = item.student_name || item.profile_name || item.name || (email ? email.split('@')[0] : 'Aluno');
        const totalScore = parseFloat(item.pontuacao_total || item.points || 0) || 0;
        const studyScore = parseFloat(item.pontuacao_estudos || 0) || 0;
        const photoUrl = item.profile_photo_url || item.photo_url || '';
        const bio = item.profile_bio || item.bio || '';
        const avatarColor = item.profile_avatar_color || item.avatar_color || '#7c3aed';
        const avatarEmoji = item.profile_avatar_emoji || item.avatar_emoji || 'a1';
        const category = item.profile_category || 'student';
        const course = item.course || activeCourse || 'tcc';
        const isActive = item.is_active !== 'false' && item.is_active !== false;

        const existingCode = item.existingCode || codes.find(c =>
          (email && String(c.student_email || '').toLowerCase() === email) ||
          (codeVal && String(c.code || '').toUpperCase() === codeVal)
        );

        let accessCodeId = existingCode?.id;

        if (existingCode) {
          await base44.entities.AccessCode.update(existingCode.id, {
            code: codeVal || existingCode.code,
            student_name: name,
            profile_name: name,
            profile_category: category,
            profile_bio: bio,
            profile_photo_url: photoUrl,
            profile_avatar_color: avatarColor,
            profile_avatar_emoji: avatarEmoji,
            pontuacao_total: totalScore,
            pontuacao_estudos: studyScore,
            is_active: isActive,
          });
          updatedCount++;
        } else {
          const newCode = await base44.entities.AccessCode.create({
            code: codeVal || generateCode(course),
            student_name: name,
            student_email: email,
            profile_name: name,
            profile_category: category,
            profile_bio: bio,
            profile_photo_url: photoUrl,
            profile_avatar_color: avatarColor,
            profile_avatar_emoji: avatarEmoji,
            pontuacao_total: totalScore,
            pontuacao_estudos: studyScore,
            course,
            is_active: isActive,
          });
          accessCodeId = newCode?.id;
          createdCount++;
        }

        const existingProfile = studentProfiles.find(p =>
          (email && String(p.student_email || p.email || '').toLowerCase() === email)
        );

        if (existingProfile) {
          await base44.entities.StudentProfile.update(existingProfile.id, {
            full_name: name,
            code_id: accessCodeId || existingProfile.code_id,
            bio,
            photo_url: photoUrl,
            avatar_color: avatarColor,
            avatar_emoji: avatarEmoji,
            points: totalScore,
            pontuacao_total: totalScore,
            pontuacao_estudos: studyScore,
          });
        } else if (email) {
          await base44.entities.StudentProfile.create({
            student_email: email,
            email,
            full_name: name,
            nickname: name.split(' ')[0],
            code_id: accessCodeId,
            bio,
            photo_url: photoUrl,
            avatar_color: avatarColor,
            avatar_emoji: avatarEmoji,
            points: totalScore,
            pontuacao_total: totalScore,
            pontuacao_estudos: studyScore,
            dashboard_course: course,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      await queryClient.invalidateQueries({ queryKey: ['student-profiles'] });
      setIsImportModalOpen(false);
      setCsvText('');
      toast.success(`Importação realizada! ${updatedCount} atualizados e ${createdCount} novos cadastrados.`);
    } catch (err) {
      toast.error('Erro ao importar: ' + (err?.message || 'Falha no processamento'));
    } finally {
      setImporting(false);
    }
  };

  const filtered = codes
    .filter(c => codePrefix ? (c.code || '').startsWith(codePrefix) : true)
    .filter(c => courseEmails ? courseEmails.has(c.student_email || '') : true)
    .filter(c =>
      !search ||
      (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.student_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.profile_name || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.profile_name || a.student_name || '').localeCompare(b.profile_name || b.student_name || '');
      if (sortBy === 'alpha_desc') return (b.profile_name || b.student_name || '').localeCompare(a.profile_name || a.student_name || '');
      if (sortBy === 'date_asc') return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === 'status_active') return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
      if (sortBy === 'tuition_overdue') {
        const ta = getStudentTuitionStatus(a) || '';
        const tb = getStudentTuitionStatus(b) || '';
        const order = { overdue: 0, pending: 1, paid: 2, '': 3 };
        return (order[ta] ?? 3) - (order[tb] ?? 3);
      }
      if (sortBy === 'submissions_desc') return getStudentStats(b).submissions - getStudentStats(a).submissions;
      if (sortBy === 'submissions_asc') return getStudentStats(a).submissions - getStudentStats(b).submissions;
      if (sortBy === 'avg_desc') {
        return getStudentStats(b).moduleScore - getStudentStats(a).moduleScore;
      }
      if (sortBy === 'avg_asc') {
        return getStudentStats(a).moduleScore - getStudentStats(b).moduleScore;
      }
      // date_desc default
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const tuitionConfig = {
    paid: { label: 'Em dia', class: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle },
    pending: { label: 'Pendente', class: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: CheckCircle },
    overdue: { label: 'Inadimplente', class: 'text-red-700 bg-red-100 border-red-200', icon: XCircle },
  };

  const courseLabel = { tcc: 'Terapia TC', psicanalise: 'Psicanalista Freudiano', sexologia: 'Sexólogo(a)' }[activeCourse] || activeCourse;

  return (
    <div className="app-page max-w-[1100px] mx-auto animate-fade-in-up">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Gestão de Alunos — {courseLabel}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie alunos e códigos de acesso da turma ativa</p>
        </div>
      </div>

      {/* Dialog para matricular em outro curso */}
      <Dialog open={!!enrollingCode} onOpenChange={() => { setEnrollingCode(null); setEnrollNewCourse(''); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Matricular em Outro Curso</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Aluno: <strong>{enrollingCode?.student_name || enrollingCode?.profile_name}</strong></p>
            <p className="text-sm">Selecione o novo curso:</p>
            <select
              value={enrollNewCourse}
              onChange={e => setEnrollNewCourse(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background text-foreground text-sm px-3"
            >
              <option value="">Escolher curso...</option>
              <option value="tcc" disabled={enrollingCode?.course === 'tcc'}>Terapia TC</option>
              <option value="psicanalise" disabled={enrollingCode?.course === 'psicanalise'}>Psicanalista Freudiano</option>
              <option value="sexologia" disabled={enrollingCode?.course === 'sexologia'}>Sexólogo(a)</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEnrollingCode(null); setEnrollNewCourse(''); }}>Cancelar</Button>
            <Button
              onClick={() => enrollMutation.mutate({ sourceCode: enrollingCode, targetCourse: enrollNewCourse })}
              disabled={!enrollNewCourse || enrollMutation.isPending}
            >
              {enrollMutation.isPending ? 'Matriculando...' : 'Matricular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Importar e Atualizar Alunos via CSV */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileSpreadsheet size={19} className="text-primary" />
              {previewAnalysis.isAchievement ? 'Importar & Sincronizar Conquistas (CSV)' : 'Importar ou Atualizar Alunos (CSV)'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {previewAnalysis.isAchievement ? (
                <>Lote de <strong>Achievement</strong> detectado. O sistema usará <code>dedupe_key</code> para atualizar e mesclar as publicações sem gerar duplicatas no Mural da Comunidade e nos Perfis dos Alunos.</>
              ) : (
                <>Cole abaixo as linhas do CSV exportado (com colunas como <code>code</code>, <code>student_name</code>, <code>student_email</code>, <code>pontuacao_total</code>, etc.). Registros existentes serão atualizados e novos alunos serão cadastrados no sistema.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 my-1">
            <Textarea
              placeholder={`"id","dedupe_key","student_email","course","kind","title","message","occurred_at"...\n"ach_1","module:tcc:aluno@mail.com:mod_01","aluno@mail.com","tcc","module","Concluiu Módulo 1","Parabéns pela conclusão!","2026-03-01T12:00:00Z"`}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              className="font-mono text-xs min-h-[140px] leading-relaxed resize-y"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  id="csv-file-upload-input"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="csv-file-upload-input"
                  className="cursor-pointer inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Upload size={13} />
                  Selecionar arquivo .csv do computador
                </label>
              </div>
              {csvText && (
                <button
                  type="button"
                  onClick={() => setCsvText('')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar campo
                </button>
              )}
            </div>

            {previewItems.length > 0 && (
              <div className="border border-border rounded-xl p-3 bg-muted/30 space-y-2.5">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-foreground">
                    Total: <span className="tabular-nums font-bold text-primary">{previewAnalysis.items.length}</span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {previewAnalysis.toUpdate} {previewAnalysis.isAchievement ? 'a mesclar/atualizar' : 'a atualizar'}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {previewAnalysis.toCreate} {previewAnalysis.isAchievement ? 'novas conquistas' : 'novos perfis'}
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto border border-border/60 rounded-lg">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-muted text-muted-foreground sticky top-0">
                      {previewAnalysis.isAchievement ? (
                        <tr>
                          <th className="py-1.5 px-2.5 font-medium">Aluno</th>
                          <th className="py-1.5 px-2.5 font-medium">Tipo</th>
                          <th className="py-1.5 px-2.5 font-medium">Conquista / Mensagem</th>
                          <th className="py-1.5 px-2.5 font-medium">Data</th>
                          <th className="py-1.5 px-2.5 font-medium text-center">Ação</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-1.5 px-2.5 font-medium">Aluno</th>
                          <th className="py-1.5 px-2.5 font-medium">Código</th>
                          <th className="py-1.5 px-2.5 font-medium">E-mail</th>
                          <th className="py-1.5 px-2.5 font-medium text-right">Pts</th>
                          <th className="py-1.5 px-2.5 font-medium text-center">Ação</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono">
                      {previewAnalysis.items.slice(0, 15).map((row, idx) => {
                        if (previewAnalysis.isAchievement) {
                          return (
                            <tr key={idx} className="hover:bg-muted/40">
                              <td className="py-1.5 px-2.5 font-sans font-medium text-foreground truncate max-w-[150px]">
                                {row.student_email || row.email || '—'}
                              </td>
                              <td className="py-1.5 px-2.5 text-primary">
                                <span className="bg-primary/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                                  {row.kind || 'general'}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-foreground truncate max-w-[200px] font-sans">
                                {row.title || row.message || '—'}
                              </td>
                              <td className="py-1.5 px-2.5 text-muted-foreground text-[10px]">
                                {row.occurred_at ? new Date(row.occurred_at).toLocaleDateString() : 'Hoje'}
                              </td>
                              <td className="py-1.5 px-2.5 text-center font-sans text-[10px]">
                                {row.isExisting ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    Mesclar
                                  </span>
                                ) : (
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                                    Nova
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={idx} className="hover:bg-muted/40">
                            <td className="py-1.5 px-2.5 font-sans font-medium text-foreground truncate max-w-[160px]">
                              {row.student_name || row.profile_name || row.name || '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-primary">
                              {row.code || 'Auto-gerar'}
                            </td>
                            <td className="py-1.5 px-2.5 text-muted-foreground truncate max-w-[170px]">
                              {row.student_email || row.email || '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right tabular-nums">
                              {row.pontuacao_total || row.points || '0'}
                            </td>
                            <td className="py-1.5 px-2.5 text-center font-sans text-[10px]">
                              {row.isExisting ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  Atualizar
                                </span>
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                                  Novo
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {previewAnalysis.items.length > 15 && (
                    <div className="text-[10px] text-center py-1 text-muted-foreground bg-muted/20">
                      + {previewAnalysis.items.length - 15} outros registros no lote
                    </div>
                  )}
                </div>
              </div>
            )}

            {csvText.trim() && previewItems.length === 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>Nenhum registro válido detectado. Certifique-se de incluir a linha de cabeçalho do CSV.</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsImportModalOpen(false); setCsvText(''); }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteImport}
              disabled={importing || previewAnalysis.items.length === 0}
              className="gap-1.5 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white"
            >
              {importing ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
              {importing ? 'Importando...' : `Confirmar Importação (${previewAnalysis.items.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <>
          <div className="mb-4 grid grid-cols-1 md:flex md:flex-wrap items-stretch md:items-center gap-2.5 md:gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 text-xs w-full sm:w-56">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_desc">Mais recentes primeiro</SelectItem>
                  <SelectItem value="date_asc">Mais antigos primeiro</SelectItem>
                  <SelectItem value="alpha">A-Z (nome)</SelectItem>
                  <SelectItem value="alpha_desc">Z-A (nome)</SelectItem>
                  <SelectItem value="status_active">Ativos primeiro</SelectItem>
                  <SelectItem value="tuition_overdue">Inadimplentes primeiro</SelectItem>
                  <SelectItem value="submissions_desc">Mais entregas primeiro</SelectItem>
                  <SelectItem value="submissions_asc">Menos entregas primeiro</SelectItem>
                  <SelectItem value="avg_desc">Maior pontuação primeiro</SelectItem>
                  <SelectItem value="avg_asc">Menor pontuação primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-10 text-xs w-full sm:w-auto"
              onClick={() => queryClient.invalidateQueries()}
            >
              <RefreshCw size={13} /> Atualizar Dados
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-10 text-xs w-full sm:w-auto text-primary border-primary/30 hover:bg-primary/5"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileSpreadsheet size={14} className="text-primary" /> Importar CSV
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-10 text-xs w-full sm:w-auto bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white border-0"
              onClick={syncStudents}
              disabled={syncing}
            >
              <Zap size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Alunos'}
            </Button>
          </div>

          {codesLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
              <p className="text-sm mt-1">Gere códigos na página "Códigos de Acesso"</p>
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="flex flex-col gap-2 lg:hidden">
                {filtered.map(code => {
                  const stats = getStudentStats(code);
                  const displayName = code.profile_name || code.student_name || 'Sem nome';
                  const tStatus = getStudentTuitionStatus(code);
                  const tCfg = tStatus ? tuitionConfig[tStatus] : null;
                  return (
                    <div key={code.id} className="bg-card rounded-2xl border border-border p-3.5 flex flex-col gap-3">
                      {editingCodeId === code.id ? (
                        <StudentQuickEdit code={code} onDone={() => setEditingCodeId(null)} />
                      ) : (
                      <>
                      <div className="flex items-center gap-3">
                      {code.profile_photo_url ? (
                        <img src={code.profile_photo_url} alt={displayName} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                          style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}
                        >
                          {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{code.student_email || 'Sem e-mail cadastrado'}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <code className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{code.code}</code>
                          {tCfg && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tCfg.class}`}>{tCfg.label}</span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                            {code.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-border px-2.5 py-2 bg-secondary/30">
                          <p className="text-muted-foreground">Entregas</p>
                          <p className="font-semibold text-foreground">{stats.submissions}</p>
                        </div>
                        <div className="rounded-xl border border-border px-2.5 py-2 bg-secondary/30">
                          <p className="text-muted-foreground truncate">Pontuação total</p>
                          <p className="font-semibold text-foreground">{stats.moduleScoreDisplay}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Função</p>
                          <FunctionBadge code={code} />
                        </div>
                        <button onClick={() => setEditingCodeId(code.id)} className="h-10 px-3 text-foreground border border-border hover:bg-secondary rounded-xl transition-colors text-xs font-semibold flex items-center justify-center gap-1.5" title="Editar dados">
                          <Pencil size={15} /> Editar
                        </button>
                        <button onClick={() => navigate(`${scopedPrefix}/students/${code.id}`)} className="h-10 px-3 text-primary border border-border hover:bg-primary/10 rounded-xl transition-colors text-xs font-semibold flex items-center justify-center gap-1.5">
                           <Eye size={15} /> Detalhes
                         </button>
                      </div>

                      <div className="w-full">
                         <button onClick={() => { if (confirm('Remover este aluno? TODOS os dados dele (pontuação, entregas, fórum, presenças, mensalidades, certificados) serão apagados permanentemente e sem deixar rastros. Esta ação não pode ser desfeita.')) deleteCodeMutation.mutate(code.id); }} disabled={deleteCodeMutation.isPending} className="w-full h-10 px-3 text-red-500 border border-red-200 hover:bg-red-100 rounded-xl transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50" title="Remover aluno">
                           <Trash2 size={15} /> Remover
                         </button>
                      </div>
                      </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border text-xs text-muted-foreground font-bold uppercase tracking-wider">
                        <th className="p-4">Aluno</th>
                        <th className="p-4">Código</th>
                        <th className="p-4">Entregas</th>
                        <th className="p-4">Pontuação total</th>
                        <th className="p-4">Mensalidade</th>
                        <th className="p-4">Função</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(code => {
                        const stats = getStudentStats(code);
                        const displayName = code.profile_name || code.student_name || 'Sem nome';
                        const tStatus = getStudentTuitionStatus(code);
                        const tCfg = tStatus ? tuitionConfig[tStatus] : null;
                        if (editingCodeId === code.id) {
                          return (
                            <tr key={code.id} className="border-b border-border bg-secondary/10">
                              <td className="p-4" colSpan={8}>
                                <StudentQuickEdit code={code} onDone={() => setEditingCodeId(null)} />
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={code.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {code.profile_photo_url ? (
                                <img src={code.profile_photo_url} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0 border border-border" />
                              ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}>
                                  {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{displayName}</p>
                                  <p className="text-xs text-muted-foreground">{code.student_email || '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-lg">{code.code}</code>
                            </td>
                            <td className="p-4 font-semibold text-foreground text-sm">{stats.submissions}</td>
                            <td className="p-4 font-bold text-foreground">{stats.moduleScoreDisplay}</td>
                            <td className="p-4">
                              {tCfg ? (
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${tCfg.class}`}>
                                  <tCfg.icon size={11} /> {tCfg.label}
                                </span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="p-4 min-w-36">
                              <FunctionBadge code={code} />
                            </td>
                            <td className="p-4">
                              <Select
                                value={code.is_active ? 'active' : 'inactive'}
                                onValueChange={(v) => updateCodeMutation.mutate({ id: code.id, data: { is_active: v === 'active' } })}
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="inactive">Inativo</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button onClick={() => setEditingCodeId(code.id)} className="flex items-center gap-1 text-xs text-foreground hover:underline font-semibold" title="Editar dados">
                                  <Pencil size={13} /> Editar
                                </button>
                                <button onClick={() => navigate(`${scopedPrefix}/students/${code.id}`)} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                                  <Eye size={13} /> Detalhes
                                </button>
                                <button onClick={() => { if (confirm('Remover este aluno? TODOS os dados dele (pontuação, entregas, fórum, presenças, mensalidades, certificados) serão apagados permanentemente e sem deixar rastros. Esta ação não pode ser desfeita.')) deleteCodeMutation.mutate(code.id); }} disabled={deleteCodeMutation.isPending} className="flex items-center gap-1 text-xs text-red-500 hover:underline font-semibold disabled:opacity-50">
                                  <Trash2 size={13} /> Remover
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
      </>

    </div>
  );
}