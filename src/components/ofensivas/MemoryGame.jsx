import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const SYMBOLS = ['📚', '🧠', '🎓', '🔬', '💡', '📝'];

const shuffle = (items) => items
  .map((value) => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value);

/**
 * Jogo da memória com símbolos de estudo/psicologia — substitui a pergunta
 * escrita no primeiro ponto da ofensiva.
 */
export default function MemoryGame({ onComplete, isPending }) {
  const [cards, setCards] = useState(() => shuffle([...SYMBOLS, ...SYMBOLS]).map((symbol, index) => ({ id: index, symbol })));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);

  const finished = matched.length === cards.length;
  const flippedSymbols = useMemo(() => flipped.map((id) => cards.find((c) => c.id === id)?.symbol), [flipped, cards]);

  const handleFlip = (card) => {
    if (flipped.length >= 2 || flipped.includes(card.id) || matched.includes(card.id)) return;
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((id) => cards.find((c) => c.id === id));
      if (a.symbol === b.symbol) {
        setMatched((prev) => [...prev, a.id, b.id]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-xs font-semibold text-primary">
        🧠 Encontre os 6 pares de símbolos do estudo para liberar o próximo ponto da ofensiva.
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const isOpen = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              disabled={finished}
              className={`aspect-square rounded-xl border-2 text-2xl flex items-center justify-center transition-all active:scale-95 ${
                matched.includes(card.id)
                  ? 'bg-green-500/15 border-green-400/40'
                  : isOpen
                    ? 'bg-card border-primary/50'
                    : 'bg-secondary border-border'
              }`}
            >
              {isOpen ? card.symbol : '❔'}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        {matched.length / 2}/6 pares · {moves} tentativa{moves !== 1 ? 's' : ''}
        {flippedSymbols.length === 2 ? ' · comparando...' : ''}
      </p>
      <Button className="w-full" disabled={!finished || isPending} onClick={() => onComplete(`Jogo da memória concluído em ${moves} tentativas.`)}>
        {finished ? 'Concluir e avançar' : 'Complete todos os pares'}
      </Button>
    </div>
  );
}