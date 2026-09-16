import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, CheckCircle2, Loader2, Pencil, Trash2, Save, X } from 'lucide-react';
import { SUPPORT_CATEGORIES } from '@/components/support/SupportTicketForm';

const STATUS_META = {
  open: { label: 'Aguardando suporte', icon: Clock, className: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  in_progress: { label: 'Em atendimento', icon: Loader2, className: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
};

export default function SupportTicketCard({ ticket, isTeacher, onRespond, onChangeStatus, onEdit, onDelete }) {
  const [reply, setReply] = useState(ticket.support_response || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title || '');
  const [editCategory, setEditCategory] = useState(ticket.category || SUPPORT_CATEGORIES[0]);
  const [editDescription, setEditDescription] = useState(ticket.description || '');
  const meta = STATUS_META[ticket.status] || STATUS_META.open;
  const Icon = meta.icon;

  const startEdit = () => {
    setEditTitle(ticket.title || '');
    setEditCategory(ticket.category || SUPPORT_CATEGORIES[0]);
    setEditDescription(ticket.description || '');
    setIsEditing(true);
  };

  const saveEdit = () => {
    onEdit?.(ticket.id, {
      title: editTitle.trim(),
      category: editCategory,
      description: editDescription.trim(),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Excluir este chamado permanentemente? Esta ação não pode ser desfeita.')) {
      onDelete?.(ticket.id);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-card rounded-2xl border border-primary/40 p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="font-bold text-sm text-foreground">Editando chamado</p>
          <span className={`inline-flex items-center gap-1 shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.className}`}>
            <Icon size={10} /> {meta.label}
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Categoria</label>
            <Select value={editCategory} onValueChange={setEditCategory}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Assunto" className="text-sm" />
          <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} placeholder="Descrição do problema" className="text-sm resize-none" />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setIsEditing(false)}>
              <X size={14} className="mr-1" /> Cancelar
            </Button>
            <Button size="sm" className="h-8 text-xs" disabled={!editTitle.trim() || !editDescription.trim()} onClick={saveEdit}>
              <Save size={14} className="mr-1" /> Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-foreground">{ticket.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {ticket.category || 'Outro assunto'}
            {isTeacher && ` · ${ticket.student_name || ticket.student_email}`}
            {ticket.created_date && ` · ${new Date(ticket.created_date).toLocaleString('pt-BR')}`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${meta.className}`}>
            <Icon size={10} /> {meta.label}
          </span>
          <button type="button" onClick={startEdit} title="Editar chamado" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Pencil size={14} />
          </button>
          <button type="button" onClick={handleDelete} title="Excluir chamado" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="text-sm text-foreground/80 mt-3 whitespace-pre-wrap">{ticket.description}</p>

      {ticket.support_response && (
        <div className="mt-3 rounded-xl bg-secondary/50 border border-border p-3">
          <p className="text-[10px] font-bold text-muted-foreground mb-1">Resposta do suporte</p>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">{ticket.support_response}</p>
        </div>
      )}

      {isTeacher && (
        <div className="mt-3 space-y-2">
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Resposta para o aluno..." className="text-sm resize-none" />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onChangeStatus(ticket.id, 'in_progress')}>Em atendimento</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onChangeStatus(ticket.id, 'resolved')}>Marcar resolvido</Button>
            <Button size="sm" className="h-8 text-xs" disabled={!reply.trim()} onClick={() => onRespond(ticket.id, reply.trim())}>Enviar resposta</Button>
          </div>
        </div>
      )}
    </div>
  );
}