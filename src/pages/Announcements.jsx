import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Plus, Trash2, AlertCircle, Info, AlertTriangle, Pencil, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EMPTY_FORM = { title: '', content: '', type: 'info' };

const TYPE_CONFIG = {
  info: {
    icon: Info,
    label: 'Simples',
    card: 'border-blue-200 bg-blue-50/50',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
    bellRead: 'text-blue-400',
    bellUnread: 'text-red-500',
  },
  warning: {
    icon: AlertCircle,
    label: 'Moderado',
    card: 'border-yellow-200 bg-yellow-50/50',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    iconColor: 'text-yellow-500',
    bellRead: 'text-blue-400',
    bellUnread: 'text-red-500',
  },
  urgent: {
    icon: AlertTriangle,
    label: 'Urgente',
    card: 'border-red-200 bg-red-50/50',
    badge: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-500',
    bellRead: 'text-blue-400',
    bellUnread: 'text-red-500',
  },
};

export default function Announcements() {
  const { user: session } = useOutletContext();
  const isTeacher = session?.role === 'admin';
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [readIds, setReadIds] = useState(() => {
    const stored = localStorage.getItem('wr-edu-read-announcements');
    return stored ? JSON.parse(stored) : [];
  });

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
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-all'] });
      setShowForm(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements-all'] }),
  });

  const openEdit = (a) => {
    setEditingItem(a);
    setForm({ title: a.title || '', content: a.content, type: a.type });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingItem) updateMutation.mutate({ id: editingItem.id, data: form });
    else createMutation.mutate(form);
  };

  const markRead = (id) => {
    const newIds = [...readIds, id];
    setReadIds(newIds);
    localStorage.setItem('wr-edu-read-announcements', JSON.stringify(newIds));
  };

  const unreadCount = announcements.filter(a => !readIds.includes(a.id)).length;

  return (
    <div className="p-4 lg:p-7 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Avisos</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Comunicados e lembretes da turma</p>
        </div>
        {isTeacher && (
          <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingItem(null); setForm(EMPTY_FORM); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 h-9 text-sm"><Plus size={15} /> Novo Aviso</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingItem ? 'Editar Aviso' : 'Criar Aviso'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Título do aviso" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                <Textarea placeholder="Conteúdo do aviso..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} />
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">💬 Simples</SelectItem>
                    <SelectItem value="warning">⚠️ Moderado</SelectItem>
                    <SelectItem value="urgent">🚨 Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSave} disabled={!form.content} className="w-full">
                  {editingItem ? 'Salvar Alterações' : 'Publicar Aviso'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BellOff size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg font-semibold">Nenhum aviso publicado</p>
          {isTeacher && <p className="text-sm mt-1">Clique em "Novo Aviso" para publicar</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            const isRead = readIds.includes(a.id);
            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl border transition-all ${cfg.card} ${!isRead && !isTeacher ? 'shadow-md' : ''}`}
                onClick={() => !isRead && !isTeacher && markRead(a.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Icon size={18} className={cfg.iconColor} />
                      {!isTeacher && (
                        <Bell
                          size={13}
                          className={isRead ? 'text-blue-400 fill-blue-400' : 'text-red-500 fill-red-500'}
                          title={isRead ? 'Lido' : 'Não lido'}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {a.title && <h3 className="font-bold text-foreground text-sm">{a.title}</h3>}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
                        {!isRead && !isTeacher && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">Novo</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(a.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{a.content}</p>
                    </div>
                  </div>
                  {isTeacher && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(a)} className={`p-2 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${a.type === 'warning' ? 'text-yellow-800 hover:bg-yellow-200' : a.type === 'urgent' ? 'text-red-800 hover:bg-red-200' : 'text-blue-800 hover:bg-blue-200'}`}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(a.id)} className={`p-2 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${a.type === 'warning' ? 'text-yellow-900 hover:bg-yellow-300' : a.type === 'urgent' ? 'text-red-900 hover:bg-red-300' : 'text-blue-900 hover:bg-blue-300'}`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
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