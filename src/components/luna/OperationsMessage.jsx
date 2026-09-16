import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Loader2, XCircle, ChevronDown, ChevronRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';

function parseJson(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function handleShare(content, label) {
  const text = stripMarkdown(content);
  if (!text) return;

  const shareData = {
    title: 'Luna · WR-EDU',
    text: text,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      if (e.name !== 'AbortError') {
        toast.error('Não foi possível compartilhar.');
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Conteúdo copiado! Cole onde desejar.');
    } catch {
      toast.error('Não foi possível compartilhar.');
    }
  }
}

function ToolCallRow({ toolCall }) {
  const results = parseJson(toolCall.results);
  const running = ['pending', 'running', 'in_progress'].includes(toolCall.status);
  const [open, setOpen] = useState(true);
  const failed = ['failed', 'error'].includes(toolCall.status)
    || (typeof toolCall.results === 'string' && /error|failed/i.test(toolCall.results))
    || results?.success === false;
  const proj = toolCall.display_projection;
  const hidden = proj?.hide_details && proj?.details_redacted;
  const label = running ? (proj?.active_label || 'Executando') : failed ? (proj?.error_label || 'Falhou') : (proj?.label || 'Concluído');
  const Icon = running ? Loader2 : failed ? XCircle : CheckCircle2;
  const color = running ? 'text-amber-500' : failed ? 'text-destructive' : 'text-emerald-600';

  return (
    <div className="mt-1.5 overflow-hidden rounded-lg border border-border/70 bg-background/60 text-[11px]">
      <button type="button" onClick={() => !hidden && setOpen((v) => !v)} className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left">
        <Icon size={12} className={`${color} ${running ? 'animate-spin' : ''} shrink-0`} />
        <span className="font-mono font-semibold text-foreground break-all">{toolCall.name}</span>
        <span className="text-muted-foreground shrink-0">· {label}</span>
        {!hidden && <span className="ml-auto shrink-0 text-muted-foreground">{open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>}
      </button>
      {open && !hidden && (
        <div className="space-y-1 overflow-hidden border-t border-border/70 px-2 py-1.5">
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
  const rawContent = message.content || '';
  const hasContent = rawContent.trim().length > 0;
  const wrapStyle = { overflowWrap: 'anywhere' };

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[88%] min-w-0">
        <div className={`overflow-hidden rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
          {hasContent && (isUser
            ? <p className="whitespace-pre-wrap break-words" style={wrapStyle}>{rawContent.replace(/^\[Contexto administrativo\][\s\S]*?\[\/Contexto administrativo\]\s*/, '')}</p>
            : <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_p]:my-1 [&_ul]:my-1" style={wrapStyle}><ReactMarkdown>{rawContent}</ReactMarkdown></div>)}
          {message.tool_calls?.map((toolCall, idx) => <ToolCallRow key={idx} toolCall={toolCall} />)}
        </div>
        {hasContent && (
          <button
            onClick={() => handleShare(rawContent)}
            title="Compartilhar"
            className={`absolute -bottom-2.5 ${isUser ? 'right-2' : 'left-2'} inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-sm opacity-0 transition-all hover:text-foreground hover:border-primary/40 group-hover:opacity-100 active:scale-95`}
          >
            <Share2 size={10} />
            Compartilhar
          </button>
        )}
      </div>
    </div>
  );
}