import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LunaBubble from '@/components/luna/LunaBubble';
import TuitionDemonstrative from '@/components/tuitions/TuitionDemonstrative';
import TuitionPaymentForm from '@/components/tuitions/TuitionPaymentForm';

const MESSAGE = 'Olá, muito obrigada por seu desempenho como estudante. Acima de tudo, seu envolvimento acadêmico é nosso motivo para estar aqui. Para regularizar sua contribuição financeira, aqui está o código para pagamento da mensalidade, juntamente com o demonstrativo de gastos por aluno. Como você integra o grupo de alunos bolsistas, o valor da cobrança está zerado e é preenchido por você. Não há valor mínimo estipulado para pagamento; portanto, sua colaboração pode ser feita de acordo com suas possibilidades. Para liberação, haverá mensagens de reforço como lembrança, mas nenhuma cobrança direta. Parabéns pela decisão de trilhar seu futuro conosco.';

export default function TuitionLunaDialog({ tuition, open, onOpenChange, onSubmit, submitting }) {
  const [registering, setRegistering] = useState(false);
  const handleOpen = (value) => { if (!value) setRegistering(false); onOpenChange(value); };
  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><span>🦉</span> Regularização com a Luna</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <LunaBubble role="assistant">{MESSAGE}</LunaBubble>
          <TuitionDemonstrative />
          {!registering ? (
            <Button className="w-full" onClick={() => setRegistering(true)}>Registrar pagamento</Button>
          ) : (
            <TuitionPaymentForm submitting={submitting} onSubmit={(data) => onSubmit({ tuition, ...data })} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}