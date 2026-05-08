import { useState } from 'react';
import { Menu, X, Lock } from 'lucide-react';

export default function LandingNav({ onLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <>
      {/* Top bar */}
      <div className="w-full bg-[#0D1117] text-center py-1.5">
        <span className="text-amber-400 text-xs flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" /> Acesso Seguro
        </span>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#111827] border-b-2 border-amber-500">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black text-sm">WR</div>
            <div>
              <div className="text-white font-bold text-base leading-tight">WR-EDU</div>
              <div className="text-amber-400/70 text-[10px] tracking-widest uppercase">Portal Educacional</div>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Nossa Escola', id: 'escola' },
              { label: 'Cursos e Formações', id: 'cursos' },
              { label: 'Certificações', id: 'certs' },
              { label: 'Depoimentos', id: 'depoimentos' },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="text-gray-300 hover:text-amber-400 text-sm font-medium transition-colors">
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button onClick={onLogin}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2 rounded transition-colors">
              Entrar na Plataforma
            </button>
            <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#1F2937] border-t border-gray-700 px-6 py-4 flex flex-col gap-4">
            {[
              { label: 'Nossa Escola', id: 'escola' },
              { label: 'Cursos e Formações', id: 'cursos' },
              { label: 'Certificações', id: 'certs' },
              { label: 'Depoimentos', id: 'depoimentos' },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="text-gray-300 hover:text-amber-400 text-sm font-medium text-left transition-colors">
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}