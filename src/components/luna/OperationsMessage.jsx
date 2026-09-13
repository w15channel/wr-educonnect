import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Loader2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

function parseJson(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function ToolCallRow({ toolCall }) {
  const results = parseJson(toolCall.results);
  const running = ['pending', 'running', 'in_progress'].includes(toolCall.status);
  // Enquanto o passo está em execução ele já aparece aberto — o admin acompanha
  // a linha de ação em tempo real, sem precisar clicar.
  const [open, setOpen] = useState(running);
  const failed = ['failed', 'error'].includes(toolCall.status)
    || (typeof toolCall.results === 'string' && /error|failed/i.test(toolCall.results))
    || results?.success === false;
  const proj = toolCall.display_projection;
  const hidden = proj?.hide_details && proj?.details_redacted;
  const label = running ? (proj?.active_label || 'Executando') : failed ? (proj?.error_label || 'Falhou') : (proj?.label || 'Concluído');
  const Icon = running ? Loader2 : failed ? XCircle : CheckCircle2;
  const color = running ? 'text-amber-500' : failed ? 'text-destructive' : 'text-emerald-600';

  return (
    <div className="mt-1.5 rounded-lg border border-border/70 bg-background/60 text-[11px]">
      <button type="button" onClick={() => !hidden && setOpen((v) => !v)} className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left">
        <Icon size={12} className={`${color} ${running ? 'animate-spin' : ''}`} />
        <span className="font-mono font-semibold text-foreground">{toolCall.name}</span>
        <span className="text-muted-foreground">· {label}</span>
        {!hidden && <span className="ml-auto text-muted-foreground">{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>}
      </button>
      {open && !hidden && (
        <div className="space-y-1 border-t border-border/70 px-2 py-1.5">
          <p className="font-semibold text-muted-foreground">Parâmetros</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-[10px]">{JSON.stringify(parseJson(toolCall.arguments_string), null, 2)}</pre>
          <p className="font-semibold text-muted-foreground">Resultado</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all text-[10px]">{typeof results === 'string' ? results : JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function OperationsMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
        {message.content && (isUser
          ? <p className="whitespace-pre-wrap">{message.content}</p>
          : <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1">{message.content}</ReactMarkdown>)}
        {message.tool_calls?.map((toolCall, idx) => <ToolCallRow key={idx} toolCall={toolCall} />)}
      </div>
    </div>
  );
}