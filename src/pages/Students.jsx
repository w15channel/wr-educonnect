import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { generateCode } from '@/lib/customAuth';
import useCourseFilteredEmails from '@/hooks/useCourseFilteredEmails';
import { Users, Search, Eye, CheckCircle, XCircle, RefreshCw, SlidersHorizontal, Zap, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Students() {
  const navigate = useNavigate();
  const { user: session } = useOutletContext() || {};
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [enrollingCode, setEnrollingCode] = useState(null);
  const [enrollNewCourse, setEnrollNewCourse] = useState('');
  const queryClient = useQueryClient();

  const { emails: courseEmails, course: routeCourse, codePrefix } = useCourseFilteredEmails();
  const activeCourse = routeCourse || session?.course || 'tcc';

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 500),
  });

  const { data: studentProfiles = [] } = useQuery({
    queryKey: ['student-profiles'],
    queryFn: () => base44.entities.StudentProfile.list('-created_date', 200),
  });

  const { data: tuitions = [] } = useQuery({
    queryKey: ['tuitions'],
    queryFn: () => base44.entities.Tuition.list('-month_ref', 500),
  });

  const updateCodeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessCode.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-codes'] }),
  });

  const deleteCodeMutation = useMutation({
    mutationFn: (id) => base44.entities.AccessCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Aluno removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover aluno.'),
  });

  const [syncing, setSyncing] = useState(false);

  const syncStudents = async () => {
    setSyncing(true);
    try {
      const [lessons, liveSessions, tasks, scoreItems] = await Promise.all([
        base44.entities.RecordedLesson.list('order', 200),
        base44.entities.LiveSession.list('-scheduled_at', 100),
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
            toCreate.push({ student_email: email, category: 'lesson', ref_id: lesson.id, ref_title: lesson.title, score: 0, max_score: 10, verified: false });
          }
        }
        for (const session of liveSessions) {
          if (!existingScores.find(s => s.category === 'live_attendance' && s.ref_id === session.id)) {
            toCreate.push({ student_email: email, category: 'live_attendance', ref_id: session.id, ref_title: session.title, score: 0, max_score: 1, verified: false });
          }
        }
        for (const task of tasks) {
          const cat = task.type === 'quiz' ? 'quiz' : 'task';
          if (!existingScores.find(s => s.category === cat && s.ref_id === task.id)) {
            toCreate.push({ student_email: email, category: cat, ref_id: task.id, ref_title: task.title, score: 0, max_score: task.max_grade || 10, verified: false });
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
    const graded = subs.filter(s => s.grade !== undefined && s.grade !== null);
    const avg = graded.length > 0 ? (graded.reduce((sum, s) => sum + s.grade, 0) / graded.length).toFixed(1) : '—';
    return { avg, submissions: subs.length, total: graded.reduce((sum, s) => sum + s.grade, 0) };
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
        const avgA = parseFloat(getStudentStats(a).avg) || 0;
        const avgB = parseFloat(getStudentStats(b).avg) || 0;
        return avgB - avgA;
      }
      if (sortBy === 'avg_asc') {
        const avgA = parseFloat(getStudentStats(a).avg) || 0;
        const avgB = parseFloat(getStudentStats(b).avg) || 0;
        return avgA - avgB;
      }
      // date_desc default
      return new Date(b.created_date) - new Date(a.created_date);
    });

  const tuitionConfig = {
    paid: { label: 'Em dia', class: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle },
    pending: { label: 'Pendente', class: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: CheckCircle },
    overdue: { label: 'Inadimplente', class: 'text-red-700 bg-red-100 border-red-200', icon: XCircle },
  };

  const courseLabel = { tcc: 'TCC', psicanalise: 'Psicanalista Freudiano', sexologia: 'Sexólogo(a)' }[activeCourse] || activeCourse;

  return (
    <div className="p-4 lg:p-7 max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Gestão de Alunos — {courseLabel}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie alunos e códigos de acesso da turma ativa</p>
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
              <option value="tcc" disabled={enrollingCode?.course === 'tcc'}>Terapeuta TCC</option>
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

      <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-xs w-48">
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
                  <SelectItem value="avg_desc">Maior média primeiro</SelectItem>
                  <SelectItem value="avg_asc">Menor média primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs"
              onClick={() => queryClient.invalidateQueries()}
            >
              <RefreshCw size={13} /> Atualizar Dados
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-9 text-xs bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] text-white border-0"
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
                    <div key={code.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
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
                      <div className="flex gap-2">
                        <button onClick={() => setEnrollingCode(code)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors" title="Matricular em outro curso">
                           <Plus size={15} />
                         </button>
                         <button onClick={() => navigate(`/students/${code.id}`)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                           <Eye size={15} />
                         </button>
                         <button onClick={() => { if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) deleteCodeMutation.mutate(code.id); }} className="p-2 text-red-500 hover:bg-red-100 rounded-xl transition-colors" title="Remover aluno">
                           <Trash2 size={15} />
                         </button>
                      </div>
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
                        <th className="p-4">Média</th>
                        <th className="p-4">Mensalidade</th>
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
                            <td className="p-4 font-bold text-foreground">{stats.avg}</td>
                            <td className="p-4">
                              {tCfg ? (
                                <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${tCfg.class}`}>
                                  <tCfg.icon size={11} /> {tCfg.label}
                                </span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
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
                                <button onClick={() => setEnrollingCode(code)} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold" title="Matricular em outro curso">
                                  <Plus size={13} /> Matricular
                                </button>
                                <button onClick={() => navigate(`/students/${code.id}`)} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                                  <Eye size={13} /> Detalhes
                                </button>
                                <button onClick={() => { if (confirm('Tem certeza? Esta ação não pode ser desfeita.')) deleteCodeMutation.mutate(code.id); }} className="flex items-center gap-1 text-xs text-red-500 hover:underline font-semibold">
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