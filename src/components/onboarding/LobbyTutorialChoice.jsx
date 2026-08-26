import React, { useState } from 'react';
import { BookOpen, PlayCircle, X } from 'lucide-react';
import TutorialModal from '@/components/onboarding/TutorialModal';
import TutorialPlayerCard from '@/components/dashboard/TutorialPlayerCard';

/**
 * Primeiro acesso ao lobby: o aluno escolhe conhecer a plataforma pelo
 * tutorial escrito (passo a passo de todas as funções) ou pelo vídeo tutorial
 * oficial — o mesmo player usado na dashboard.
 */
export default function LobbyTutorialChoice({ studentName, onFinish }) {
  const [mode, setMode] = useState(null);

  if (mode === 'written') return <TutorialModal onFinish={onFinish} />;

  if (mode === 'video') {
    return (
      <div className="fixed inset-0 z-[99] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-background p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-sm font-bold text-foreground">Tutorial em vídeo</p>
            <button onClick={onFinish} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
          <TutorialPlayerCard />
          <button
            onClick={onFinish}
            className="mt-3 w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            Concluir e entrar na plataforma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tutoriais da plataforma</p>
        <h2 className="mt-2 text-xl font-bold text-foreground">
          Boas-vindas{studentName ? `, ${String(studentName).split(' ')[0]}` : ''}!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Quer conhecer (ou rever) a plataforma? Escolha o tutorial escrito ou o vídeo tutorial oficial.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3">
          <button
            onClick={() => setMode('written')}
            className="flex items-center gap-3 rounded-2xl border-2 border-border p-4 text-left transition-colors hover:border-primary/50"
          >
            <BookOpen size={20} className="text-primary shrink-0" />
            <span>
              <span className="block text-sm font-bold text-foreground">Tutorial escrito</span>
              <span className="block text-[12px] text-muted-foreground">Passo a passo com todas as funções e características do site.</span>
            </span>
          </button>
          <button
            onClick={() => setMode('video')}
            className="flex items-center gap-3 rounded-2xl border-2 border-border p-4 text-left transition-colors hover:border-primary/50"
          >
            <PlayCircle size={20} className="text-primary shrink-0" />
            <span>
              <span className="block text-sm font-bold text-foreground">Tutorial em vídeo</span>
              <span className="block text-[12px] text-muted-foreground">Assista ao vídeo tutorial oficial da plataforma.</span>
            </span>
          </button>
        </div>
        <button onClick={onFinish} className="mt-4 text-[11px] font-semibold text-muted-foreground/80 underline hover:text-foreground">
          Pular
        </button>
      </div>
    </div>
  );
}