import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Megaphone, Radio, Clock, BookOpen, Sparkles, Pin, Send } from 'lucide-react';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';

export const ANNOUNCEMENT_CATEGORIES = [
  { id: 'geral', label: 'Aviso Geral', icon: Megaphone, color: 'text-blue-600 dark:text-blue-400 border-blue-300/40 bg-blue-50/50 dark:bg-blue-950/30' },
  { id: 'ao_vivo', label: 'Aula ao Vivo', icon: Radio, color: 'text-emerald-600 dark:text-emerald-400 border-emerald-300/40 bg-emerald-50/50 dark:bg-emerald-950/30' },
  { id: 'prazos', label: 'Prazo Acadêmico', icon: Clock, color: 'text-amber-600 dark:text-amber-400 border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/30' },
  { id: 'dica', label: 'Dica Pedagógica', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400 border-indigo-300/40 bg-indigo-50/50 dark:bg-indigo-950/30' },
  { id: 'superacao', label: 'Palavra de Força', icon: Sparkles, color: 'text-rose-600 dark:text-rose-400 border-rose-300/40 bg-rose-50/50 dark:bg-rose-950/30' },
];

export const QUICK_TEMPLATES = [
  {
    label: 'Aula ao Vivo',
    category: 'ao_vivo',
    title: 'Aula ao Vivo Hoje às 20h — Participe!',
    message: 'Olá, queridos alunos e alunas!\n\nHoje teremos nossa aula ao vivo da turma de TCC. Preparem suas anotações e dúvidas para o nosso encontro.\n\nContamos com a presença e a energia de todos!',
  },
  {
    label: 'Prazo de Entrega',
    category: 'prazos',
    title: 'Lembrete de Prazo: Atividades do Módulo',
    message: 'Atenção turma:\n\nLembramos que o prazo de envio das tarefas e revisões do módulo em andamento encerra em breve. Recomendamos que não deixem para o último momento para garantir a revisão e pontuação máxima no checklist acadêmico.',
  },
  {
    label: 'Palavra da Direção',
    category: 'superacao',
    title: 'Parabéns pela dedicação da turma!',
    message: 'Queridos alunos,\n\nQueremos parabenizar a dedicação e constância demonstradas por cada um de vocês nas aulas e desafios diários. Cada passo dado é uma vitória rumo à excelência pessoal e profissional.\n\nSigam firmes!',
  },
  {
    label: 'Plantão de Apoio',
    category: 'dica',
    title: 'Orientações Pedagógicas & Plantão de Dúvidas',
    message: 'Dica importante para os estudos desta semana:\n\nRevisem com calma os conceitos na apostila do TCC e registrem suas reflexões. Caso encontrem qualquer dúvida, nossa tutora Luna e os monitores estão à disposição no chat para apoiar vocês.',
  },
];

const PIN_DURATIONS = [
  { label: '1 dia', value: 1 },
  { label: '3 dias (recomendado)', value: 3 },
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
];

export default function OfficialAnnouncementModal({ open, onClose, onSend, isSending }) {
  const [category, setCategory] = useState('geral');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [pinToTop, setPinToTop] = useState(true);
  const [pinDuration, setPinDuration] = useState(3);

  const applyTemplate = (tpl) => {
    setCategory(tpl.category);
    setTitle(tpl.title);
    setMessage(tpl.message);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim() || !message.trim() || isSending) return;
    onSend({
      category,
      title: title.trim(),
      message: message.trim(),
      pinToTop,
      pinDuration: Number(pinDuration) || 3,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Megaphone size={20} className="shrink-0" />
            <DialogTitle className="text-lg font-bold text-foreground">
              Novo Comunicado para a Turma
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Publique uma mensagem oficial no Chat Geral de TCC com destaque institucional e opção de fixação no topo.
          </DialogDescription>
        </DialogHeader>

        {/* Modelos rápidos */}
        <div className="space-y-1.5 border-y border-border/60 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Modelos Rápidos (1 clique para preencher)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Categoria do Comunicado
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ANNOUNCEMENT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      isSelected
                        ? `${cat.color} font-semibold ring-2 ring-primary/40`
                        : 'border-border/70 bg-card hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="announcement-title" className="text-xs font-semibold text-foreground">
              Título do Comunicado
            </label>
            <input
              id="announcement-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aula ao Vivo Hoje às 20h — Participe!"
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Mensagem / Conteúdo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="announcement-message" className="text-xs font-semibold text-foreground">
                Mensagem Completa
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {message.length} caracteres
                </span>
                <VoiceDictationButton value={message} onChange={setMessage} />
              </div>
            </div>
            <textarea
              id="announcement-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva as instruções, orientações ou palavras de incentivo para a turma..."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
            />
          </div>

          {/* Opção de Fixar no Topo */}
          <div className="rounded-xl border border-border/80 bg-secondary/20 p-3 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pinToTop}
                onChange={(e) => setPinToTop(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
              />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Pin size={13} className="text-primary" />
                Fixar este comunicado no topo do Chat da Turma
              </span>
            </label>

            {pinToTop && (
              <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                <span className="text-xs text-muted-foreground">Permanecer fixado por:</span>
                <select
                  value={pinDuration}
                  onChange={(e) => setPinDuration(Number(e.target.value))}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {PIN_DURATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !message.trim() || isSending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 text-xs font-semibold text-white shadow-sm transition-all disabled:opacity-50"
            >
              <Send size={14} />
              {isSending ? 'Publicando Comunicado...' : 'Publicar Comunicado'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
