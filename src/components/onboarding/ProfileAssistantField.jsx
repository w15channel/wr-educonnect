import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AVATAR_OPTIONS } from '@/lib/avatarUtils';
import { AVATAR_COLORS } from '@/lib/profileRequirements';

/** Campo da etapa atual — botões e letras grandes, pensados para quem tem pouca familiaridade com celular. */
export default function ProfileAssistantField({ step, value, onChange }) {
  if (step.type === 'avatar') {
    return (
      <div className="grid grid-cols-5 gap-2">
        {AVATAR_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            title={option.label}
            onClick={() => onChange(option.id)}
            className={`flex h-14 items-center justify-center rounded-2xl border-2 text-2xl transition-all ${
              value === option.id ? 'border-primary bg-primary/10 scale-105' : 'border-border bg-secondary'
            }`}
          >
            {option.emoji}
          </button>
        ))}
      </div>
    );
  }

  if (step.type === 'color') {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {AVATAR_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Cor ${color}`}
            className={`h-11 w-11 rounded-full border-4 transition-all ${value === color ? 'border-foreground scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    );
  }

  if (step.type === 'textarea') {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={step.placeholder}
        rows={5}
        className="text-base"
      />
    );
  }

  return (
    <Input
      type={step.type === 'date' ? 'date' : step.type === 'tel' ? 'tel' : step.type === 'email' ? 'email' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={step.placeholder}
      className="text-base"
      style={{ height: '3.25rem' }}
    />
  );
}