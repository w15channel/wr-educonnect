import { useState } from 'react';
import HeroSection from '../components/landing/HeroSection';
import CoursesSection from '../components/landing/CoursesSection';
import AboutSection from '../components/landing/AboutSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CertificationsSection from '../components/landing/CertificationsSection';
import FooterSection from '../components/landing/FooterSection';

export default function LandingPage({ onLoginClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111827', color: '#F9FAFB', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top security bar */}
      <div className="text-center py-1.5 text-xs text-amber-400 border-b border-gray-700/50" style={{ backgroundColor: '#0D1117' }}>
        🔒 Acesso Seguro — Plataforma Certificada pela ABED
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-amber-500/20" style={{ backgroundColor: '#111827' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">WR</div>
              <div>
                <div className="font-bold text-white text-lg leading-none">WR-EDU</div>
                <div className="text-xs text-amber-400 tracking-widest">PORTAL EDUCACIONAL</div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {[['Nossa Escola', 'escola'], ['Cursos e Formações', 'cursos'], ['Certificações', 'certificacoes'], ['Depoimentos', 'depoimentos']].map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-gray-300 hover:text-amber-400 transition-colors text-sm font-medium">
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onLoginClick}
                className="hidden md:inline-flex items-center px-5 py-2 rounded-lg border border-amber-500 text-amber-400 text-sm font-semibold hover:bg-amber-500 hover:text-gray-900 transition-all duration-200"
              >
                Entrar na Plataforma
              </button>
              {/* Mobile hamburger */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-300">
                <div className="space-y-1.5">
                  <span className={`block w-6 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`block w-6 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block w-6 h-0.5 bg-current transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700/50 py-4 px-4 space-y-1" style={{ backgroundColor: '#1F2937' }}>
            {[['Nossa Escola', 'escola'], ['Cursos e Formações', 'cursos'], ['Certificações', 'certificacoes'], ['Depoimentos', 'depoimentos']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-300 py-3 px-2 text-sm border-b border-gray-700/30 hover:text-amber-400 transition-colors">
                {label}
              </button>
            ))}
            <button onClick={onLoginClick} className="w-full mt-4 px-4 py-3 rounded-lg bg-amber-500 text-gray-900 text-sm font-bold">
              Entrar na Plataforma
            </button>
          </div>
        )}
      </nav>

      {/* Sections */}
      <div id="escola"><HeroSection onLoginClick={onLoginClick} scrollTo={scrollTo} /></div>
      <div id="cursos"><CoursesSection onLoginClick={onLoginClick} /></div>
      <div id="sobre"><AboutSection /></div>
      <div id="depoimentos"><TestimonialsSection /></div>
      <div id="certificacoes"><CertificationsSection /></div>
      <FooterSection onLoginClick={onLoginClick} scrollTo={scrollTo} />
    </div>
  );
}