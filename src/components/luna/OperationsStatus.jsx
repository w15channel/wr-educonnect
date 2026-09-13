import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function OperationsStatus({ phase, error, messages, refresh, retry }) {
  if (phase === 'login' || phase === 'denied') return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-3">
      <p>{phase === 'login' ? 'Para executar operações, conecte sua conta administrativa Base44. O acesso por código ao site não autentica as ferramentas da Luna.' : 'A conta Base44 conectada não tem função de administrador neste aplicativo.'}</p>
      <Button onClick={() => phase === 'login' ? base44.auth.redirectToLogin(window.location.href) : base44.auth.logout(window.location.href)}>{phase === 'login' ? 'Conectar conta administrativa' : 'Sair desta conta Base44'}</Button>
    </div>
  );
  if (error) return <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-3 text-xs space-y-2"><p className="flex gap-2"><AlertCircle size={16} className="shrink-0 text-destructive" />{error}</p><Button size="sm" variant="outline" onClick={phase === 'stalled' ? refresh : retry}>{phase === 'stalled' ? 'Consultar andamento' : 'Reconectar'}</Button></div>;
  if (!['opening', 'sending', 'waiting'].includes(phase)) return null;
  const lastUser = messages.reduce((index, row, i) => row.role === 'user' ? i : index, -1);
  const tool = messages.slice(lastUser + 1).flatMap(m => m.tool_calls || []).find(t => ['pending', 'running', 'in_progress'].includes(t.status));
  const label = phase === 'opening' ? 'Conectando à sala de operações…' : phase === 'sending' ? 'Enviando pedido…' : tool ? tool.display_projection?.active_label || `Executando ${tool.name}` : 'Pedido enviado. Aguardando próximo evento da Luna…';
  return <div role="status" className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground"><Loader2 size={14} className="shrink-0 animate-spin text-primary" /><span>{label}</span></div>;
}