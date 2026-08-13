import React from 'react';
import { Heart } from 'lucide-react';

export default function TherapistWeekInviteCard() {
  return (
    <div className="bg-card rounded-2xl border border-pink-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
          <Heart size={16} className="text-pink-600" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-foreground">Terapeuta da Semana</h3>
          <p className="text-xs text-muted-foreground">Uma experiência real de consultório</p>
        </div>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        O "Terapeuta da Semana" é uma experiência prática em que você atende um colega como se estivesse em
        um consultório de verdade, colocando em prática o que está aprendendo. <strong>Todos os alunos participam</strong> —
        os pareamentos são definidos pelo administrador e divulgados na página <em>Terapeuta da Semana</em>.
      </p>
    </div>
  );
}