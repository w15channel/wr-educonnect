import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { generateCode } from '@/lib/customAuth';
import { Plus, Copy, Trash2, ToggleLeft, ToggleRight, RefreshCw, Pencil, Check, X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CodeManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newCourse, setNewCourse] = useState('tcc');
  const [newEmail, setNewEmail] = useState('');
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['access-codes'],
    queryFn: () => base44.entities.AccessCode.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.AccessCode.create({
      code: generateCode(newCourse),
      student_name: newName.trim(),
      student_email: newEmail.trim(),
      course: newCourse,
      is_active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      setNewName('');
      setNewEmail('');
      setNewCourse('tcc');
      toast.success('Código gerado com sucesso!');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.AccessCode.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-codes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (code) => {
      const email = code.student_email;
      // Cascade delete all student data
      const [profiles, submissions, progresses, tuitions, attendances, scoreItems, chatMessages, forumPosts, forumReplies] = await Promise.all([
        email ? base44.entities.StudentProfile.filter({ student_email: email }, '-created_date', 200) : [],
        email ? base44.entities.TaskSubmission.filter({ student_email: email }, '-created_date', 500) : [],
        email ? base44.entities.LessonProgress.filter({ student_email: email }, '-created_date', 500) : [],
        email ? base44.entities.Tuition.filter({ student_email: email }, '-created_date', 500) : [],
        email ? base44.entities.LiveAttendance.filter({ student_email: email }, '-created_date', 500) : [],
        email ? base44.entities.ScoreItem.filter({ student_email: email }, '-created_date', 500) : [],
        email ? base44.entities.ChatMessage.filter({ author_email: email }, '-created_date', 500) : [],
        email ? base44.entities.ForumPost.filter({ author_email: email }, '-created_date', 500) : [],
        email ? base44.entities.ForumReply.filter({ author_email: email }, '-created_date', 500) : [],
      ]);
      await Promise.all([
        ...profiles.map(r => base44.entities.StudentProfile.delete(r.id)),
        ...submissions.map(r => base44.entities.TaskSubmission.delete(r.id)),
        ...progresses.map(r => base44.entities.LessonProgress.delete(r.id)),
        ...tuitions.map(r => base44.entities.Tuition.delete(r.id)),
        ...attendances.map(r => base44.entities.LiveAttendance.delete(r.id)),
        ...scoreItems.map(r => base44.entities.ScoreItem.delete(r.id)),
        ...chatMessages.map(r => base44.entities.ChatMessage.delete(r.id)),
        ...forumPosts.map(r => base44.entities.ForumPost.delete(r.id)),
        ...forumReplies.map(r => base44.entities.ForumReply.delete(r.id)),
      ]);
      return base44.entities.AccessCode.delete(code.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Aluno e todos os dados excluídos.');
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: ({ id, email }) => base44.entities.AccessCode.update(id, { student_email: email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      setEditingEmailId(null);
      toast.success('Email atualizado!');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: ({ id, course }) => base44.entities.AccessCode.update(id, { code: generateCode(course) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-codes'] });
      toast.success('Código regenerado!');
    },
  });

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h3 className="font-semibold text-foreground mb-4">Gerar Novo Código</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Nome do aluno"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Email (opcional)"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <select
            value={newCourse}
            onChange={e => setNewCourse(e.target.value)}
            className="h-10 rounded-xl border border-border bg-background text-foreground text-sm px-3 shrink-0"
          >
            <option value="tcc">Terapeuta TCC</option>
            <option value="psicanalise">Psicanalista Freudiano</option>
            <option value="sexologia">Sexólogo(a)</option>
          </select>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!newName.trim() || createMutation.isPending}
            className="gap-2 shrink-0"
          >
            <Plus size={16} /> Gerar Código
          </Button>
        </div>
      </div>

      {/* Codes list */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/50">
          <h3 className="font-semibold text-foreground">{codes.length} código(s) gerado(s)</h3>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : codes.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            Nenhum código gerado ainda. Crie o primeiro acima.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {codes.map(c => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <p className="font-medium text-foreground text-sm">{c.student_name || 'Sem nome'}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: c.course === 'psicanalise' ? '#1db89e20' : c.course === 'sexologia' ? '#a855f720' : '#5b5ef420', color: c.course === 'psicanalise' ? '#1db89e' : c.course === 'sexologia' ? '#a855f7' : '#5b5ef4' }}>
                        {c.course === 'psicanalise' ? 'Psicanalista' : c.course === 'sexologia' ? 'Sexólogo(a)' : 'TCC'}
                      </span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {c.code}
                      </code>
                      {editingEmailId === c.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            className="text-xs border border-border rounded-md px-2 py-0.5 bg-background text-foreground outline-none focus:border-primary w-48"
                            value={editingEmailValue}
                            onChange={e => setEditingEmailValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') updateEmailMutation.mutate({ id: c.id, email: editingEmailValue });
                              if (e.key === 'Escape') setEditingEmailId(null);
                            }}
                          />
                          <button onClick={() => updateEmailMutation.mutate({ id: c.id, email: editingEmailValue })} className="p-0.5 text-green-600 hover:text-green-700"><Check size={13} /></button>
                          <button onClick={() => setEditingEmailId(null)} className="p-0.5 text-muted-foreground hover:text-destructive"><X size={13} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingEmailId(c.id); setEditingEmailValue(c.student_email || ''); }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground group"
                        >
                          <span className={c.student_email ? '' : 'italic text-destructive/70'}>
                            {c.student_email || 'Sem email'}
                          </span>
                          <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                    {c.last_login && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Último acesso: {format(new Date(c.last_login), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={c.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                    {c.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <button onClick={() => copyCode(c.code)} title="Copiar código" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Copy size={15} />
                  </button>
                  <button onClick={() => regenerateMutation.mutate({ id: c.id, course: c.course })} title="Regenerar código" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw size={15} />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: c.id, is_active: !c.is_active })}
                    title={c.is_active ? 'Desativar' : 'Ativar'}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {c.is_active ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} />}
                  </button>
                  <button onClick={() => { if (confirm(`Excluir "${c.student_name}" permanentemente? Todos os dados do aluno serão apagados.`)) deleteMutation.mutate(c); }} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}