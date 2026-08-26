import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, CheckCircle } from 'lucide-react';
import MemoryGame from './MemoryGame';
import ColorComboGame from './ColorComboGame';

const GAME_META = {
  memory: { title: 'Jogo da Memória do Estudo', emoji: '🧠' },
  colors: { title: 'Combine as Cores', emoji: '🎨' },
};

export default function GameModal({ gameType, idx, points, answered, open, onClose, onComplete, isPending }) {
  const meta = GAME_META[gameType] || GAME_META.memory;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">{meta.emoji}</span>
            {meta.title}
            <span className="ml-auto text-xs font-bold text-yellow-500 flex items-center gap-0.5">
              <Star size={11} className="fill-yellow-400" /> +{points} pts
            </span>
          </DialogTitle>
        </DialogHeader>
        {answered ? (
          <div className="bg-green-500/10 border border-green-400/30 rounded-xl p-3 mt-1">
            <p className="text-xs font-bold text-green-500 flex items-center gap-1">
              <CheckCircle size={11} /> Desafio {idx + 1} já concluído!
            </p>
          </div>
        ) : gameType === 'colors' ? (
          <ColorComboGame onComplete={onComplete} isPending={isPending} />
        ) : (
          <MemoryGame onComplete={onComplete} isPending={isPending} />
        )}
      </DialogContent>
    </Dialog>
  );
}