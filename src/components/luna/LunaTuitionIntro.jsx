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
        <p>O curso tem custos mensais reais — tecnologia, plataforma, professor, suporte e produção de conteúdos. O valor de R$ 450,00 é o custo de referência da estrutura por aluno, conforme o demonstrativo acima.</p>
        <p>Nossa proposta é de autonomia e liberdade: não existe valor mínimo, máximo, taxas ou cobranças extras. Cada aluno escolhe mensalmente quanto pode colaborar, conforme suas possibilidades atuais.</p>
        <p className="font-semibold text-amber-700 dark:text-amber-300">Pergunta sincera: hoje, com quanto você poderia colaborar?</p>
        <p>Não é sobre o valor da nota — é sobre participar e sustentar juntos o espaço de aprendizado. Mesmo uma contribuição pequena faz diferença e demonstra seu comprometimento com a turma.</p>
        <p>A colaboração ajuda a manter o curso acessível para pessoas de todas as realidades de renda. Depois de contribuir, informe o valor e a data para a administração confirmar.</p>
        <p className="font-semibold">O código Pix está logo abaixo:</p>
      </div>
      <div className="mt-3 rounded-xl bg-secondary/60 p-3"><p className="break-all text-xs text-foreground">{TUITION_PIX}</p><Button type="button" className="mt-3 w-full gap-2" onClick={copyPix}><Copy size={15} /> Copiar código Pix</Button></div>
    </div>
  );
}