import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, ExternalLink, Globe } from 'lucide-react';

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
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir em nova aba"
        >
          <ExternalLink size={14} />
        </a>
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