import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const TUITION_PIX_CODE = '00020126360014BR.GOV.BCB.PIX0114+55419925315985204000053039865802BR5925William Ribeiro dos Santo6009SAO PAULO62140510C7I0x49TlI6304D49A';
const IMAGE_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/d23904a08_Demonstrativo.jpeg';

export default function TuitionDemonstrative() {
  const copyPix = async () => {
    await navigator.clipboard.writeText(TUITION_PIX_CODE);
    toast.success('Código Pix copiado!');
  };
  return (
    <div className="space-y-3">
      <img src={IMAGE_URL} alt="Demonstrativo de valores e gastos por aluno" className="w-full rounded-xl border border-border" />
      <div className="rounded-xl border border-border bg-secondary/40 p-3">
        <p className="break-all text-xs text-foreground">{TUITION_PIX_CODE}</p>
        <Button type="button" variant="outline" className="mt-3 w-full gap-2" onClick={copyPix}><Copy size={15} /> Copiar código Pix</Button>
      </div>
    </div>
  );
}