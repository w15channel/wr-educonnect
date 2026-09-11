import React, { useState } from 'react';
import { BookOpen, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MinLengthHint from '@/components/shared/MinLengthHint';
import VoiceDictationButton from '@/components/shared/VoiceDictationButton';
import { isTextLongEnough } from '@/lib/minTextLength';

/**
 * Campo "Meu Resumo" da aula: quando já existe um resumo salvo, ele fica
 * apenas em leitura com um lápis para abrir a edição — o aluno pode reeditar
 * e salvar quantas vezes quiser.
 */
export default function LessonSummaryField({ lessonId, savedSummary = '', draft, onDraftChange, onSave }) {
  const [editing, setEditing] = useState(!savedSummary);
  const value = draft ?? savedSummary ?? '';

  if (savedSummary && !editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <BookOpen size={12} className="text-primary" /> Meu Resumo
          </label>
          <button
            onClick={() => { onDraftChange(savedSummary); setEditing(true); }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground border border-border px-2 py-1 rounded-lg hover:text-primary hover:border-primary/30 transition-colors"
            title="Editar meu resumo"
          >
            <Pencil size={11} /> Editar
          </button>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">{savedSummary}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
        <BookOpen size={12} className="text-primary" /> Meu Resumo
      </label>
      <div className="flex items-start gap-2">
        <Textarea
          placeholder="Anote os principais pontos e aprendizados (mínimo de 1000 caracteres)..."
          value={value}
          onChange={e => onDraftChange(e.target.value)}
          rows={4}
          className="text-sm"
        />
        <VoiceDictationButton value={value} onChange={onDraftChange} className="mt-1" />
      </div>
      <MinLengthHint value={value} />
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          disabled={!isTextLongEnough(value)}
          onClick={() => { onSave(lessonId); if (savedSummary) setEditing(false); }}
        >
          Salvar Resumo
        </Button>
        {savedSummary && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { onDraftChange(savedSummary); setEditing(false); }}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}