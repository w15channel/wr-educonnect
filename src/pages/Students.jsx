import React, { useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Key, Eye, CheckCircle, XCircle, Star, Phone, Mail, CalendarDays, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import CodeManager from '@/components/admin/CodeManager';
import { format } from 'date-fns';

export default function Students() {
  const location = useLocation();
  const defaultTab = location.search.includes('tab=codes') ? 'codes' : 'students';
  const [tab, setTab] = useState(defaultTab);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const queryClient = useQueryClient();

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

  const filtered = codes.filter(c =>
    !search ||
    (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.student_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.profile_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedProfile = selectedStudent ? getStudentProfile(selectedStudent) : null;
  const selectedStats = selectedStudent ? getStudentStats(selectedStudent) : null;
  const selectedTuitions = selectedStudent ? tuitions.filter(t => t.student_email === selectedStudent.student_email) : [];

  const tuitionConfig = {
    paid: { label: 'Em dia', class: 'text-green-700 bg-green-100 border-green-200', icon: CheckCircle },
    pending: { label: 'Pendente', class: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: CheckCircle },
    overdue: { label: 'Inadimplente', class: 'text-red-700 bg-red-100 border-red-200', icon: XCircle },
  };

  return (
    <div className="p-4 lg:p-7 max-w-6xl mx-auto animate-fade-in-up">
      <div className="mb-5">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">Gestão de Alunos</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie alunos e códigos de acesso</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-5 w-full sm:w-fit">
        <button
          onClick={() => setTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'students' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users size={15} /> Alunos ({codes.length})
        </button>
        <button
          onClick={() => setTab('codes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'codes' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Key size={15} /> Códigos de Acesso
        </button>
      </div>

      {tab === 'codes' ? (
        <CodeManager />
      ) : (
        <>
          <div className="mb-4 relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>

          {codesLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">Nenhum aluno encontrado</p>
              <p className="text-sm mt-1">Gere códigos na aba "Códigos de Acesso"</p>
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
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                        style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}
                      >
                        {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
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
                      <button onClick={() => setSelectedStudent(code)} className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                        <Eye size={15} />
                      </button>
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
                                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0" style={{ backgroundColor: code.profile_avatar_color || '#5b5ef4' }}>
                                  {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
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
                              <button onClick={() => setSelectedStudent(code)} className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold">
                                <Eye size={13} /> Detalhes
                              </button>
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
      )}

      {/* Student detail modal */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Perfil do Aluno</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                {selectedProfile?.photo_url ? (
                  <img src={selectedProfile.photo_url} alt="Foto" className="w-16 h-16 rounded-2xl object-cover border-2 border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white" style={{ backgroundColor: selectedStudent.profile_avatar_color || '#5b5ef4' }}>
                    {(selectedStudent.profile_name || selectedStudent.student_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-foreground">{selectedStudent.profile_name || selectedStudent.student_name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.student_email}</p>
                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-lg mt-1 inline-block">{selectedStudent.code}</code>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedProfile?.birth_date && (
                  <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-xl p-3">
                    <CalendarDays size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Nascimento</p>
                      <p className="font-semibold text-xs">{format(new Date(selectedProfile.birth_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                )}
                {selectedProfile?.whatsapp && (
                  <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-xl p-3">
                    <Phone size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">WhatsApp</p>
                      <p className="font-semibold text-xs">{selectedProfile.whatsapp}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedProfile?.bio && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs font-bold text-muted-foreground mb-1">Apresentação</p>
                  <p className="text-sm">{selectedProfile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
                  <p className="text-2xl font-black text-primary">{selectedStats?.submissions}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Entregas</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 text-center border border-primary/10">
                  <p className="text-2xl font-black text-primary">{selectedStats?.avg}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Média</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
                  <p className="text-2xl font-black text-yellow-600">{selectedStats?.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold">Pontos</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-foreground mb-2">Mensalidades</p>
                {selectedTuitions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma mensalidade lançada.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedTuitions.map(t => {
                      const cfg = tuitionConfig[t.status] || tuitionConfig.pending;
                      return (
                        <div key={t.id} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${cfg.class}`}>
                          <span className="font-bold">{t.month_ref}</span>
                          <span>{t.amount ? `R$ ${Number(t.amount).toFixed(2)}` : ''}</span>
                          <span className="font-black">{cfg.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}