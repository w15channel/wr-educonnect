import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lightbulb, RefreshCw, X } from 'lucide-react';

export default function OptimizationSuggestionCard({ suggestion, onNext, onApply, onClose, applying }) {
  if (!suggestion) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
          <Lightbulb size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-black text-foreground">{suggestion.title}</h3>
            <Badge variant="secondary">{suggestion.area}</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.summary}</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="bg-destructive border border-destructive rounded-xl p-3">
          <p className="text-xs font-bold text-destructive mb-1">Falha ou risco percebido</p>
          <p className="text-sm text-destructive leading-relaxed">{suggestion.problem}</p>
        </div>
        <div className="bg-accent border border-primary rounded-xl p-3">
          <p className="text-xs font-bold text-primary mb-1">Ajuste sugerido</p>
          <p className="text-sm text-primary leading-relaxed">{suggestion.solution}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
          <X size={14} /> Sair
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} className="gap-2">
          <RefreshCw size={14} /> Próxima ideia
        </Button>
        <Button size="sm" onClick={onApply} disabled={applying} className="gap-2">
          <CheckCircle size={14} /> {applying ? 'Registrando...' : 'Aplicar ideia'}
        </Button>
      </div>
    </div>
  );
}