import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TuitionPaymentForm({ onSubmit, submitting }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const valid = amount !== '' && Number(amount) >= 0 && !!date;
  return (
    <div className="space-y-3 rounded-xl border border-amber-300/40 bg-amber-50/40 p-4 dark:bg-amber-950/10">
      <p className="text-sm font-bold text-foreground">Agora me informe os dados do pagamento:</p>
      <Input type="number" min="0" step="0.01" placeholder="Valor pago (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input type="date" aria-label="Data do pagamento" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
      <Button className="w-full" disabled={!valid || submitting} onClick={() => onSubmit({ amount: Number(amount), date })}>
        {submitting ? 'Enviando para conferência...' : 'Enviar registro de pagamento'}
      </Button>
      <p className="text-xs text-muted-foreground">A mensalidade será concluída somente após a confirmação da administração.</p>
    </div>
  );
}