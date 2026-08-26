import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const TILES = [
  { emoji: '🟥', className: 'bg-red-500/15' },
  { emoji: '🟦', className: 'bg-blue-500/15' },
  { emoji: '🟩', className: 'bg-green-500/15' },
  { emoji: '🟨', className: 'bg-yellow-500/15' },
  { emoji: '🟪', className: 'bg-purple-500/15' },
];

const SIZE = 6;
const TARGET_COMBOS = 10;

const randomTile = () => Math.floor(Math.random() * TILES.length);
const makeBoard = () => Array.from({ length: SIZE * SIZE }, randomTile);

const groupOf = (board, start) => {
  const target = board[start];
  const seen = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const index = stack.pop();
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const neighbours = [
      row > 0 ? index - SIZE : -1,
      row < SIZE - 1 ? index + SIZE : -1,
      col > 0 ? index - 1 : -1,
      col < SIZE - 1 ? index + 1 : -1,
    ];
    neighbours.forEach((n) => {
      if (n >= 0 && !seen.has(n) && board[n] === target) { seen.add(n); stack.push(n); }
    });
  }
  return [...seen];
};

/**
 * Jogo de combinar cores: gradeado quadrado com emojis coloridos. Cada grupo
 * de 3 ou mais cores iguais conectadas vale 1 combo — 10 combos liberam o ponto.
 */
export default function ColorComboGame({ onComplete, isPending }) {
  const [board, setBoard] = useState(makeBoard);
  const [combos, setCombos] = useState(0);
  const finished = combos >= TARGET_COMBOS;

  const handleTile = (index) => {
    if (finished) return;
    const group = groupOf(board, index);
    if (group.length < 3) return;
    const next = [...board];
    group.forEach((i) => { next[i] = randomTile(); });
    setBoard(next);
    setCombos((c) => c + 1);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs font-semibold text-amber-500">
        🎨 Toque em grupos de 3 ou mais cores iguais e conectadas. Faça {TARGET_COMBOS} combos para liberar o próximo ponto.
      </div>
      <div className="grid grid-cols-6 gap-1">
        {board.map((tileIndex, i) => {
          const tile = TILES[tileIndex];
          return (
            <button
              key={i}
              onClick={() => handleTile(i)}
              disabled={finished}
              className={`aspect-square rounded-lg border border-border text-xl flex items-center justify-center transition-transform active:scale-90 ${tile.className}`}
            >
              {tile.emoji}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{combos}/{TARGET_COMBOS} combos</span>
        <button type="button" className="underline" onClick={() => setBoard(makeBoard())} disabled={finished}>
          Embaralhar
        </button>
      </div>
      <Button className="w-full" disabled={!finished || isPending} onClick={() => onComplete(`Jogo de cores concluído com ${combos} combos.`)}>
        {finished ? 'Concluir e avançar' : `Faltam ${TARGET_COMBOS - combos} combos`}
      </Button>
    </div>
  );
}