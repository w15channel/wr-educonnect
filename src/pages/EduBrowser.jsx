import React, { useState, useRef } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCcw, Home, X, Star, BookmarkPlus, Shield, Zap, Lock } from 'lucide-react';

const BOOKMARKS = [
  { label: 'Portal WR-EDU', url: 'https://www.google.com' },
  { label: 'YouTube', url: 'https://www.youtube.com' },
  { label: 'Google', url: 'https://www.google.com' },
  { label: 'Google Acadêmico', url: 'https://scholar.google.com' },
  { label: 'Wikipedia', url: 'https://pt.wikipedia.org' },
];

const HOME_URL = 'https://www.google.com/webhp?igu=1';

function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export default function EduBrowser() {
  const [url, setUrl] = useState(HOME_URL);
  const [inputUrl, setInputUrl] = useState(HOME_URL);
  const [loading, setLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState(BOOKMARKS);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const iframeRef = useRef(null);

  const navigate = (target) => {
    const normalized = normalizeUrl(target);
    setUrl(normalized);
    setInputUrl(normalized);
    setLoading(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(inputUrl);
  };

  const addBookmark = () => {
    const label = prompt('Nome do favorito:', inputUrl);
    if (label) setBookmarks(prev => [...prev, { label, url: inputUrl }]);
  };

  const removeBookmark = (idx) => setBookmarks(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-32px)] max-w-full mx-auto">
      {/* Browser Chrome Header */}
      <div className="shrink-0 bg-gradient-to-r from-[#0f1f5c] via-[#1a3080] to-[#0f1f5c] border-b border-white/10">
        {/* Top bar: brand + controls */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-lg">
              <Globe size={16} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-black text-xs tracking-wider leading-none">EDU BROWSER</p>
              <p className="text-white/30 text-[9px] tracking-widest">by WR-EDU</p>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => iframeRef.current?.contentWindow?.history.back()}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              onClick={() => iframeRef.current?.contentWindow?.history.forward()}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Avançar"
            >
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => { setLoading(true); iframeRef.current?.contentWindow?.location.reload(); }}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => navigate(HOME_URL)}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Início"
            >
              <Home size={14} />
            </button>
          </div>

          {/* Address bar */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-1 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl px-3 py-1.5 group focus-within:border-[#5b5ef4]/60 transition-all">
            <Lock size={11} className="text-green-400 shrink-0" />
            <input
              className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-white/30 min-w-0"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="Digite um endereço ou pesquise..."
              style={{ fontFamily: 'monospace' }}
            />
            {loading && <div className="w-3 h-3 border-2 border-white/20 border-t-white/70 rounded-full animate-spin shrink-0" />}
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={addBookmark}
              className="p-1.5 text-white/50 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition-colors"
              title="Adicionar favorito"
            >
              <Star size={14} />
            </button>
            <button
              onClick={() => setShowBookmarks(v => !v)}
              className={`p-1.5 rounded-lg transition-colors ${showBookmarks ? 'text-[#5b5ef4] bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              title="Favoritos"
            >
              <BookmarkPlus size={14} />
            </button>
          </div>
        </div>

        {/* Bookmarks bar */}
        {showBookmarks ? (
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {bookmarks.map((b, i) => (
              <div key={i} className="flex items-center gap-1 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg px-2 py-0.5 group transition-all">
                <button onClick={() => navigate(b.url)} className="text-white/70 hover:text-white text-[11px] font-medium">
                  {b.label}
                </button>
                <button onClick={() => removeBookmark(i)} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-0.5">
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Quick access bar */
          <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-none">
            {bookmarks.slice(0, 6).map((b, i) => (
              <button
                key={i}
                onClick={() => navigate(b.url)}
                className="text-white/50 hover:text-white/90 text-[11px] whitespace-nowrap px-2 py-0.5 hover:bg-white/8 rounded-lg transition-all"
              >
                {b.label}
              </button>
            ))}
          </div>
        )}

        {/* Status bar */}
        <div className="flex items-center gap-3 px-3 py-1 bg-black/20 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-green-400" />
            <span className="text-[10px] text-white/40">Conexão segura</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-yellow-400" />
            <span className="text-[10px] text-white/40">EDU Browser 1.0</span>
          </div>
          <div className="ml-auto text-[10px] text-white/25 truncate max-w-xs hidden sm:block font-mono">
            {url}
          </div>
        </div>
      </div>

      {/* Iframe content */}
      <div className="flex-1 relative bg-white">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#f0f4fb] pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-xl animate-pulse">
              <Globe size={24} className="text-white" />
            </div>
            <p className="text-sm text-[#1a3080] font-semibold">Carregando...</p>
            <p className="text-xs text-gray-400 font-mono truncate max-w-xs px-4 text-center">{url}</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          title="EDU Browser"
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}