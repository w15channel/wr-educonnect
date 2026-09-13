import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Sparkles, Star, BookmarkCheck } from 'lucide-react';

export default function ReceiptImageDialog({
  open, onOpenChange, imageUrl, isGenerating, usedTemplate, isDefault, isSavingDefault,
  onNewModel, onSetDefault, onDownload,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Recibo de Contribuição</DialogTitle></DialogHeader>
        <div className="mt-2 space-y-3">
          <div className="rounded-2xl border border-border bg-muted/40 aspect-[1/1.414] flex items-center justify-center overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <Sparkles size={28} className="text-primary animate-pulse" />
                <p className="text-sm font-semibold text-foreground">
                  {usedTemplate ? 'Aplicando o modelo padrão...' : 'Gerando novo modelo com inteligência artificial...'}
                </p>
                <p className="text-xs text-muted-foreground">Isso leva alguns segundos.</p>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Recibo de contribuição voluntária" className="w-full h-full object-contain" />
            ) : null}
          </div>
          {!isGenerating && imageUrl && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isDefault ? <><BookmarkCheck size={13} className="text-emerald-600" /> Este é o modelo padrão dos recibos.</>
                : usedTemplate ? <><BookmarkCheck size={13} className="text-emerald-600" /> Gerado a partir do modelo padrão.</>
                : 'Modelo novo criado pela IA. Se gostou, defina-o como padrão para os próximos recibos.'}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            A imagem é criada por inteligência artificial, então pequenas imperfeições no texto podem ocorrer. Se algum dado ficar ilegível, gere um novo modelo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button onClick={onDownload} disabled={isGenerating || !imageUrl} className="gap-2">
              <Download size={15} /> Baixar PNG
            </Button>
            <Button variant="outline" onClick={onNewModel} disabled={isGenerating} className="gap-2">
              <RefreshCw size={15} /> Gerar novo modelo
            </Button>
            <Button variant="outline" onClick={onSetDefault} disabled={isGenerating || !imageUrl || isDefault || isSavingDefault} className="gap-2">
              <Star size={15} className={isDefault ? 'fill-current' : ''} /> {isDefault ? 'Padrão atual' : 'Usar como padrão'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}