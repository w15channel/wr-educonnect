import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Sparkles } from 'lucide-react';

export default function ReceiptImageDialog({ open, onOpenChange, imageUrl, isGenerating, onRegenerate, onDownload }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Recibo de Contribuição</DialogTitle></DialogHeader>
        <div className="mt-2 space-y-3">
          <div className="rounded-2xl border border-border bg-muted/40 aspect-[1/1.414] flex items-center justify-center overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <Sparkles size={28} className="text-primary animate-pulse" />
                <p className="text-sm font-semibold text-foreground">Gerando recibo com inteligência artificial...</p>
                <p className="text-xs text-muted-foreground">Isso leva alguns segundos.</p>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Recibo de contribuição voluntária" className="w-full h-full object-contain" />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            A imagem é criada 100% por inteligência artificial, então pequenas imperfeições no texto podem ocorrer. Se algum dado ficar ilegível, gere novamente.
          </p>
          <div className="flex gap-2">
            <Button onClick={onDownload} disabled={isGenerating || !imageUrl} className="flex-1 gap-2">
              <Download size={15} /> Baixar PNG
            </Button>
            <Button variant="outline" onClick={onRegenerate} disabled={isGenerating} className="gap-2">
              <RefreshCw size={15} /> Gerar novamente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}