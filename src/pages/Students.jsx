import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Students() {
  const { user } = useOutletContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['all-submissions'],
    queryFn: () => base44.entities.TaskSubmission.list('-created_date', 500),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users'] }),
  });

  const students = allUsers.filter(u => u.role === 'student' || (!u.role));
  const filtered = students.filter(s =>
    !search || (s.full_name || '').toLowerCase().includes(search.toLowerCase()) || (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStudentStats = (student) => {
    const subs = allSubmissions.filter(s => s.student_email === student.email);
    const graded = subs.filter(s => s.grade !== undefined && s.grade !== null);
    const avg = graded.length > 0 ? (graded.reduce((sum, s) => sum + s.grade, 0) / graded.length).toFixed(1) : '—';
    const progress = subs.length > 0 ? Math.min(100, Math.round((subs.length / Math.max(1, 1)) * 100)) : 0;
    return { avg, submissions: subs.length, progress };
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await base44.users.inviteUser(inviteEmail, 'user');
    toast.success(`Convite enviado para ${inviteEmail}`);
    setInviteEmail('');
    setShowInvite(false);
  };

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    attention: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Alunos</h2>
          <p className="text-muted-foreground text-sm mt-1">{students.length} alunos cadastrados</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-full sm:w-64" />
          </div>
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button className="gap-2 shrink-0"><UserPlus size={16} /> Convidar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Convidar Aluno</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Email do aluno" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <Button onClick={handleInvite} disabled={!inviteEmail.trim()} className="w-full">
                  Enviar Convite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                  <th className="p-4 font-semibold">Aluno</th>
                  <th className="p-4 font-semibold">Entregas</th>
                  <th className="p-4 font-semibold">Média</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map(student => {
                  const stats = getStudentStats(student);
                  const currentStatus = student.status || 'active';
                  return (
                    <tr key={student.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {(student.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{student.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-foreground">{stats.submissions}</td>
                      <td className="p-4 font-bold text-foreground">{stats.avg}</td>
                      <td className="p-4">
                        <Select
                          value={currentStatus}
                          onValueChange={(v) => updateUserMutation.mutate({ id: student.id, data: { status: v } })}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="attention">Atenção</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary text-xs">Ver Detalhes</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}