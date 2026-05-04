import React, { useState } from 'react';
import { Globe, ExternalLink, Search, BookOpen, Star, ArrowRight, Home, Youtube, BookMarked, Newspaper } from 'lucide-react';

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

  const [pendingUrl, setPendingUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl || '');
  const [searchQuery, setSearchQuery] = useState('');

  const openUrl = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const url = normalizeUrl(searchQuery || inputUrl);
    if (url) openUrl(url);
  };

  const handleQuickLink = (url) => {
    openUrl(url);
  };

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
          <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-primary/40 focus-within:shadow-primary/5 focus-within:shadow-lg transition-all">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Pesquisar no Google ou digitar um endereço..."
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
              className="group flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${link.color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                {link.icon}
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{link.label}</span>
              <ExternalLink size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-secondary/50 border border-border rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Globe size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Como funciona o EDU Browser?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Por questões de segurança dos sites, a navegação é feita abrindo os links em uma nova aba do seu navegador. 
            Use a barra de pesquisa acima para buscar qualquer conteúdo, ou clique nos atalhos de acesso rápido.
          </p>
        </div>
      </div>
    </div>
  );
}