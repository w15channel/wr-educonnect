export default function FooterSection({ onLoginClick, scrollTo }) {
  return (
    <footer style={{ backgroundColor: '#0D1117' }}>
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-gray-900 font-bold text-sm">WR</div>
              <div>
                <div className="font-bold text-white text-lg leading-none">WR-EDU</div>
                <div className="text-xs text-amber-400 tracking-widest">PORTAL EDUCACIONAL</div>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Escola de Formação de Terapeutas. Transformando vidas através da educação integrativa e da prática terapêutica supervisionada.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-400 transition-colors text-xl">f</a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-400 transition-colors text-lg">✈</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-amber-400 transition-colors text-xl">◎</a>
            </div>
          </div>

          {/* Sitemap */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Mapa do Site</h4>
            <ul className="space-y-3">
              {[['Nossa Escola', 'escola'], ['Cursos e Formações', 'cursos'], ['Certificações', 'certificacoes'], ['Depoimentos', 'depoimentos']].map(([label, id]) => (
                <li key={id}>
                  <button onClick={() => scrollTo(id)} className="text-gray-500 hover:text-amber-400 transition-colors text-sm">
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={onLoginClick} className="text-gray-500 hover:text-amber-400 transition-colors text-sm">
                  Entrar na Plataforma
                </button>
              </li>
            </ul>
          </div>

          {/* Content */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Conteúdo</h4>
            <ul className="space-y-3">
              {['Videoaulas', 'Lives ao Vivo', 'Comunidade', 'Fórum de Alunos', 'Material Didático'].map((item) => (
                <li key={item}>
                  <span className="text-gray-500 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">Legal</h4>
            <ul className="space-y-3">
              {['Termos de Uso', 'Política de Privacidade', 'Política de Cookies', 'Contato'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-amber-400 transition-colors text-sm">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            ★ WR-EDU © 2025 — Escola de Formação de Terapeutas ★
          </p>
          <p className="text-gray-700 text-xs">
            Feito com ♥ — Plataforma segura e certificada
          </p>
        </div>
      </div>
    </footer>
  );
}