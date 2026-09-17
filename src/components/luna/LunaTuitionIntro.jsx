import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { TUITION_PIX } from '@/lib/lunaTuition';

const IMAGE_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/242cbf0da_Demonstrativo.jpeg';

export default function LunaTuitionIntro() {
  const copyPix = async () => {
    await navigator.clipboard.writeText(TUITION_PIX);
    toast.success('Código Pix copiado!');
  };
  return (
    <div className="rounded-2xl border border-amber-300/50 bg-card p-3 shadow-sm">
      <img src={IMAGE_URL} alt="Demonstrativo dos custos mensais por aluno" className="w-full rounded-xl border border-border" />
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground">
        <p><strong>Como funciona a contribuição voluntária?</strong></p>
        <p>O valor de R$ 450,00 representa o custo mensal de referência da estrutura por aluno. Para estudantes bolsistas, não existe valor mínimo obrigatório: cada pessoa pode contribuir conforme suas possibilidades.</p>
        <p>A colaboração ajuda a manter suporte, tecnologia, professor, plataforma e produção dos conteúdos. Depois de contribuir, informe o valor e a data para conferência da administração.</p>
        <p className="font-semibold">O código Pix está logo abaixo:</p>
      </div>
      <div className="mt-3 rounded-xl bg-secondary/60 p-3"><p className="break-all text-xs text-foreground">{TUITION_PIX}</p><Button type="button" className="mt-3 w-full gap-2" onClick={copyPix}><Copy size={15} /> Copiar código Pix</Button></div>
    </div>
  );
}