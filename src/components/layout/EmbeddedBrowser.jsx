import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, ExternalLink, Globe, Minimize2, Maximize2, X } from 'lucide-react';

/**
 * Componente reutilizável de navegação integrada via iframe.
 * Mesmo padrão da Certificadora.
 * Props:
 *   url        - URL a ser carregada
 *   title      - Título exibido no header
 *   onClose    - Callback para voltar/fechar
 */
export default function EmbeddedBrowser({ url, title, onClose }) {
  const [iframeKey, setIframeKey] = useState(0);
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed right-4 bottom-[calc(86px+env(safe-area-inset-bottom))] z-[120] flex items-center gap-3 rounded-2xl border border-primary/25 bg-card/95 px-4 py-3 text-left shadow-2xl shadow-black/25 backdrop-blur-xl md:right-6 md:bottom-6"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <Globe size={18} />
        </span>
        <span className="min-w-0">
          <span className="block max-w-[190px] truncate text-xs font-black text-foreground">{title || 'Link externo'}</span>
          <span className="block text-[10px] text-muted-foreground">Toque para voltar</span>
        </span>
        <Maximize2 size={15} className="text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="flex flex-col bg-background" style={{ height: '100%', minHeight: 0 }}>
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-border bg-card flex items-center gap-2 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Voltar"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          onClick={() => setIframeKey(k => k + 1)}
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Recarregar"
        >
          <RefreshCw size={14} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-secondary/60 border border-border rounded-xl px-3 py-1.5 min-w-0">
          <Globe size={11} className="shrink-0 text-muted-foreground" />
          <span className="text-xs text-foreground font-semibold truncate">{title || url}</span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Minimizar"
        >
          <Minimize2 size={14} />
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir em nova aba"
        >
          <ExternalLink size={14} />
        </a>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Fechar"
        >
          <X size={14} />
        </button>
      </div>

      {/* iframe */}
      <div className="flex-1 min-h-0" style={{ overflow: 'hidden' }}>
        <iframe
          key={iframeKey}
          src={url}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={title || 'Conteúdo externo'}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}