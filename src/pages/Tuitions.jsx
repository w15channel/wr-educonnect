import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, Plus, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  paid: { label: 'Pago', icon: CheckCircle, class: 'text-green-600 bg-green-50 border-green-200' },
  pending: { label: 'Pendente', icon: AlertCircle, class: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  overdue: { label: 'Inadimplente', icon: XCircle, class: 'text-red-600 bg-red-50 border-red-200' },
};

export default function Tuitions() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_email: '', student_name: '', month_ref: '', amount: '', due_date: '', status: 'pending', notes: '' });
  const [selectedStudent, setSelectedStudent] = useState('all');

  const { data: tuitions = [], isLoading } = useQuery({
    queryKey: ['tuitions'],
    queryFn: () => isAdmin
      ? base44.entities.Tuition.list('-month_ref', 500)
      : base44.entities.Tuition.filter({ student_email: session?.email }, '-month_ref', 50),
    enabled: !!session,
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tuition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tuitions'] });
      setShowForm(false);
      setForm({ student_email: '', student_name: '', month_ref: '', amount: '', due_date: '', status: 'pending', notes: '' });
      toast.success('Mensalidade lançada!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tuition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tuitions'] });
      toast.success('Status atualizado!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tuition.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tuitions'] }),
  });

  const students = [...new Set(codes.map(c => c.student_email).filter(Boolean))];

  const filtered = selectedStudent === 'all' ? tuitions : tuitions.filter(t => t.student_email === selectedStudent);

  const myStatus = !isAdmin && tuitions.length > 0 ? tuitions[0].status : null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mensalidades</h2>
          <p className="text-muted-foreground text-sm mt-1">{isAdmin ? 'Gerencie pagamentos dos alunos' : 'Seu histórico de mensalidades'}</p>
        </div>
        {isAdmin && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Lançar Mensalidade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Mensalidade</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Select value={form.student_email} onValueChange={v => {
                  const code = codes.find(c => c.student_email === v);
                  setForm({...form, student_email: v, student_name: code?.profile_name || code?.student_name || ''});
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
                  <SelectContent>
                    {codes.filter(c => c.student_email).map(c => (
                      <SelectItem key={c.id} value={c.student_email}>{c.profile_name || c.student_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Mês de referência (ex: 2025-01)" value={form.month_ref} onChange={e => setForm({...form, month_ref: e.target.value})} />
                <Input type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                <Input type="date" placeholder="Vencimento" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Observações (opcional)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                <Button onClick={() => createMutation.mutate({...form, amount: Number(form.amount)})} disabled={!form.student_email || !form.month_ref} className="w-full">
                  Lançar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Status banner for student */}
      {!isAdmin && myStatus && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${STATUS_CONFIG[myStatus]?.class}`}>
          {React.createElement(STATUS_CONFIG[myStatus].icon, { size: 22 })}
          <div>
            <p className="font-semibold">Situação Financeira: {STATUS_CONFIG[myStatus].label}</p>
            <p className="text-sm opacity-80">
              {myStatus === 'paid' ? 'Você está em dia com suas mensalidades.' : myStatus === 'pending' ? 'Você possui mensalidades pendentes.' : 'Você possui mensalidades em atraso.'}
            </p>
          </div>
        </div>
      )}

      {/* Admin: filter by student */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Filtrar por aluno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os alunos</SelectItem>
              {codes.filter(c => c.student_email).map(c => (
                <SelectItem key={c.id} value={c.student_email}>{c.profile_name || c.student_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <DollarSign size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhuma mensalidade encontrada</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-secondary/50 border-b border-border text-sm text-muted-foreground">
                  {isAdmin && <th className="p-4 font-semibold">Aluno</th>}
                  <th className="p-4 font-semibold">Referência</th>
                  <th className="p-4 font-semibold">Valor</th>
                  <th className="p-4 font-semibold">Vencimento</th>
                  <th className="p-4 font-semibold">Status</th>
                  {isAdmin && <th className="p-4 font-semibold">Ações</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {filtered.map(t => {
                  const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={t.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      {isAdmin && (
                        <td className="p-4">
                          <p className="font-medium">{t.student_name || t.student_email}</p>
                          <p className="text-xs text-muted-foreground">{t.student_email}</p>
                        </td>
                      )}
                      <td className="p-4 font-mono font-medium">{t.month_ref}</td>
                      <td className="p-4 font-semibold">{t.amount ? `R$ ${Number(t.amount).toFixed(2)}` : '—'}</td>
                      <td className="p-4 text-muted-foreground">{t.due_date ? format(new Date(t.due_date + 'T12:00:00'), 'dd/MM/yyyy') : '—'}</td>
                      <td className="p-4">
                        {isAdmin ? (
                          <Select value={t.status} onValueChange={v => updateMutation.mutate({ id: t.id, data: { status: v, paid_date: v === 'paid' ? new Date().toISOString().split('T')[0] : t.paid_date } })}>
                            <SelectTrigger className={`w-36 h-8 text-xs border ${cfg.class}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="paid">Pago</SelectItem>
                              <SelectItem value="overdue">Inadimplente</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.class}`}>
                            <StatusIcon size={12} /> {cfg.label}
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="p-4">
                          <button onClick={() => deleteMutation.mutate(t.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
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