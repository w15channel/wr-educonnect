import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LifeBuoy } from 'lucide-react';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';

export const SUPPORT_CATEGORIES = [
  'Acesso e login',
  'Aulas e vídeos',
  'Apostila',
  'Tarefas e provas',
  'Pontuação e ranking',
  'Certificados',
  'Mensalidades',
  'Outro assunto',
];

export default function SupportTicketForm({ onSubmit, isSubmitting }) {
  const [category, setCategory] = useState(SUPPORT_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const canSubmit = title.trim().length > 3 && description.trim().length > 10 && !isSubmitting;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ category, title: title.trim(), description: description.trim() });
        setTitle('');
        setDescription('');
      }}
      className="bg-card rounded-2xl border border-border p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <LifeBuoy size={16} className="text-primary" />
        <p className="font-bold text-sm text-foreground">Abrir um chamado de suporte</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1">Categoria</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SUPPORT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Input placeholder="Assunto (ex: não consigo abrir a prova do módulo 2)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex items-start gap-2">
        <Textarea
          placeholder="Descreva o que está dando errado: em qual tela aconteceu, o que você tentou fazer e qual mensagem apareceu."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="text-sm resize-none"
        />
        <VoiceDictationButton value={description} onChange={setDescription} className="mt-1" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">Seu chamado fica salvo aqui e a equipe de suporte entrará em contato com você.</p>
        <Button type="submit" disabled={!canSubmit} className="h-9 text-sm shrink-0">
          {isSubmitting ? 'Enviando...' : 'Enviar chamado'}
        </Button>
      </div>
    </form>
  );
}