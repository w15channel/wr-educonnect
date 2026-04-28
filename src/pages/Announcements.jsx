import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Announcements() {
  const { user: session } = useOutletContext();
  const user = session;
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'info' });

  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements-all'],
    queryFn: () => base44.entities.Announcement.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-all'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowForm(false);
      setForm({ title: '', content: '', type: 'info' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-all'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const typeIcons = { info: Info, warning: AlertCircle, urgent: Bell };
  const typeColors = {
    info: 'border-primary/20 bg-primary/5',
    warning: 'border-yellow-200 bg-yellow-50',
    urgent: 'border-destructive/20 bg-destructive/5',
  };
  const typeLabels = { info: 'Informativo', warning: 'Atenção', urgent: 'Urgente' };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Avisos</h2>
          <p className="text-muted-foreground text-sm mt-1">Comunicados e lembretes da turma</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} /> Novo Aviso</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Aviso</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título (opcional)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Conteúdo do aviso" value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informativo</SelectItem>
                    <SelectItem value="warning">Atenção</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => createMutation.mutate(form)} disabled={!form.content} className="w-full">
                  Publicar Aviso
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum aviso publicado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const Icon = typeIcons[a.type] || Info;
            return (
              <div key={a.id} className={`p-5 rounded-2xl border ${typeColors[a.type] || typeColors.info}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <Icon size={20} className="shrink-0 mt-0.5 text-foreground/60" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {a.title && <h3 className="font-semibold text-foreground">{a.title}</h3>}
                        <Badge variant="secondary" className="text-[10px]">{typeLabels[a.type]}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(a.created_date), 'dd/MM/yyyy')}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{a.content}</p>
                    </div>
                  </div>
                  {isTeacher && (
                    <button onClick={() => deleteMutation.mutate(a.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}