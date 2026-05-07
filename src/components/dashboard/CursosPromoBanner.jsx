import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, Lock, Star, X } from 'lucide-react';

const COURSES = [
  {
    name: 'Sexologia Sistêmica',
    desc: 'Explore a sexualidade humana com abordagem terapêutica sistêmica.',
    color: '#e879a0',
    gradient: 'from-pink-600/30 to-rose-900/20',
    border: 'border-pink-500/25',
  },
  {
    name: 'Método Psicanalítico',
    desc: 'Fundamentos e prática clínica da psicanálise aplicada.',
    color: '#8b5cf6',
    gradient: 'from-violet-600/30 to-purple-900/20',
    border: 'border-violet-500/25',
  },
];

export default function CursosPromoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mx-0 mb-5 relative animate-fade-in-up">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 z-10 text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg"
      >
        <X size={14} />
      </button>

      <div className="bg-gradient-to-br from-[#5b5ef4]/15 via-card to-[#1db89e]/10 border border-[#5b5ef4]/20 rounded-2xl p-5 overflow-hidden relative">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#5b5ef4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Expanda sua formação!</p>
            <p className="text-muted-foreground text-xs">Cursos exclusivos disponíveis para alunos WR-EDU</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {COURSES.map((c, i) => (
            <div key={i} className={`bg-gradient-to-br ${c.gradient} border ${c.border} rounded-xl p-3.5`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Lock size={10} style={{ color: c.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.color }}>
                  Disponível para aquisição
                </span>
              </div>
              <p className="text-white font-semibold text-sm leading-tight mb-1">{c.name}</p>
              <p className="text-white/50 text-xs leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star size={10} className="text-yellow-400 fill-current" />
            <span>Benefício exclusivo para alunos ativos</span>
          </div>
          <Link
            to="/cursos"
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            Ver catálogo <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}