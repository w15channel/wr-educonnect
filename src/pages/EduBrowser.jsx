import React, { useState } from 'react';
import { Globe, ExternalLink, Search, X, ArrowLeft, RefreshCw } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Google', url: 'https://www.google.com', icon: '🔍', color: 'from-blue-500 to-blue-600' },
  { label: 'YouTube', url: 'https://www.youtube.com', icon: '▶️', color: 'from-red-500 to-red-600' },
  { label: 'Google Acadêmico', url: 'https://scholar.google.com', icon: '🎓', color: 'from-indigo-500 to-indigo-600' },
  { label: 'Wikipedia', url: 'https://pt.wikipedia.org', icon: '📖', color: 'from-gray-500 to-gray-600' },
  { label: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', icon: '🧬', color: 'from-green-500 to-green-600' },
  { label: 'Scielo', url: 'https://www.scielo.br', icon: '📚', color: 'from-teal-500 to-teal-600' },
  { label: 'CFP', url: 'https://site.cfp.org.br', icon: '⚖️', color: 'from-purple-500 to-purple-600' },
  { label: 'Calendly', url: 'https://calendly.com/wrterapia/atendimentos', icon: '📅', color: 'from-primary to-accent' },
];

function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export default function EduBrowser() {
  const initialUrl = (() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('url');
    return u ? decodeURIComponent(u) : null;
  })();

  const [iframeUrl, setIframeUrl] = useState(initialUrl || '');
  const [activeUrl, setActiveUrl] = useState(initialUrl || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const navigate = (url) => {
    setActiveUrl(url);
    setIframeUrl(url);
    setIframeKey(k => k + 1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const url = normalizeUrl(searchQuery);
    if (url) navigate(url);
  };

  const handleQuickLink = (url) => navigate(url);

  // If we have a URL to show, render the integrated browser
  if (activeUrl) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in">
        {/* Browser toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
          <button
            onClick={() => { setActiveUrl(''); setIframeUrl(''); }}
            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Voltar ao portal"
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
          <div className="flex-1 flex items-center gap-2 bg-secondary/60 border border-border rounded-xl px-3 py-1.5 text-xs text-muted-foreground truncate">
            <Globe size={12} className="shrink-0" />
            <span className="truncate">{activeUrl}</span>
          </div>
          <button
            onClick={() => window.open(activeUrl, '_blank', 'noopener,noreferrer')}
            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            title="Abrir em nova aba"
          >
            <ExternalLink size={14} />
          </button>
        </div>

        {/* iframe */}
        <iframe
          key={iframeKey}
          src={iframeUrl}
          className="flex-1 w-full border-0 bg-white"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          title="EDU Browser"
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-lg">
          <Globe size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">EDU Browser</h2>
          <p className="text-xs text-muted-foreground">Portal de navegação educacional WR-EDU</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-primary/40 transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar ou digitar um endereço..."
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            Ir
          </button>
        </div>
      </form>

      {/* Quick Links */}
      <div className="mb-6">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Acesso Rápido</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.url}
              onClick={() => handleQuickLink(link.url)}
              className="group flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                {link.icon}
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}