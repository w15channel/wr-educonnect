import React, { useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, Key } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CodeManager from '@/components/admin/CodeManager';

export default function Students() {
  const location = useLocation();
  const defaultTab = location.search.includes('tab=codes') ? 'codes' : 'students';
  const [tab, setTab] = useState(defaultTab);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 500),
  });

  const updateCodeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AccessCode.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-codes'] }),
  });

  const getStudentStats = (code) => {
    const subs = allSubmissions.filter(s => s.student_email === code.student_email);
    const graded = subs.filter(s => s.grade !== undefined && s.grade !== null);
    const avg = graded.length > 0 ? (graded.reduce((sum, s) => sum + s.grade, 0) / graded.length).toFixed(1) : '—';
    return { avg, submissions: subs.length };
  };

  const filtered = codes.filter(c =>
    !search ||
    (c.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.student_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.profile_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Gestão de Alunos</h2>
        <p className="text-muted-foreground text-sm mt-1">Gerencie alunos e códigos de acesso</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'students' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users size={16} /> Alunos
        </button>
        <button
          onClick={() => setTab('codes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'codes' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Key size={16} /> Códigos de Acesso
        </button>
      </div>

      {tab === 'codes' ? (
        <CodeManager />
      ) : (
        <>
          <div className="mb-4">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {codesLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum aluno encontrado</p>
              <p className="text-sm mt-1">Gere códigos na aba "Códigos de Acesso" para adicionar alunos</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                      <th className="p-4 font-semibold">Aluno</th>
                      <th className="p-4 font-semibold">Código</th>
                      <th className="p-4 font-semibold">Entregas</th>
                      <th className="p-4 font-semibold">Média</th>
                      <th className="p-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filtered.map(code => {
                      const stats = getStudentStats(code);
                      const displayName = code.profile_name || code.student_name || 'Sem nome';
                      return (
                        <tr key={code.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white"
                                style={{ backgroundColor: code.profile_avatar_color || '#6366f1' }}
                              >
                                {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{displayName}</p>
                                <p className="text-xs text-muted-foreground">{code.student_email || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">{code.code}</code>
                          </td>
                          <td className="p-4 font-medium text-foreground">{stats.submissions}</td>
                          <td className="p-4 font-bold text-foreground">{stats.avg}</td>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}