import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TUITION_DAYS } from '@/lib/tuitionPlanDates';

/**
 * Valor de contribuição + dia de vencimento escolhidos pelo aluno.
 * Usado tanto na saudação quanto no ajuste dentro de Mensalidades.
 */
export default function TuitionPlanForm({ initialAmount = '', initialDay = '', onSubmit, saving = false, submitLabel = 'Salvar minha mensalidade', hint = 'Você poderá alterar isso depois em Mensalidades.' }) {
  const [amount, setAmount] = useState(String(initialAmount ?? '').replace('.', ','));
  const [day, setDay] = useState(initialDay ? String(initialDay) : '');

  const parsed = Number(String(amount).replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0 && !!day;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || saving) return;
        onSubmit(parsed, Number(day));
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tuition-amount" className="text-[11px] font-bold text-foreground">Valor da contribuição (R$)</Label>
          <Input
            id="tuition-amount"
            inputMode="decimal"
            placeholder="Ex.: 120,00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tuition-day" className="text-[11px] font-bold text-foreground">Dia do vencimento</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger id="tuition-day" className="h-9">
              <SelectValue placeholder="Escolha o dia" />
            </SelectTrigger>
            <SelectContent>
              {TUITION_DAYS.map((value) => (
                <SelectItem key={value} value={String(value)}>Dia {value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
      <Button type="submit" disabled={!valid || saving} className="w-full gap-2" size="sm">
        {saving ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  );
}