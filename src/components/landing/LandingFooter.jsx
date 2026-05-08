export default function LandingFooter({ onLogin }) {
  return (
    <footer className="bg-[#0D1117] border-t border-gray-800 pt-14 pb-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black text-sm">WR</div>
              <div>
                <div className="text-white font-bold text-sm">WR-EDU</div>
                <div className="text-amber-400/60 text-[10px] tracking-widest uppercase">Portal Educacional</div>
              </div>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mt-3">
              Escola de Formação de Terapeutas. Excelência em educação terapêutica.
            </p>
            {/* Socials */}
            <div className="flex gap-3 mt-5">
              {['f', '✈', '📷'].map((s, i) => (
                <button key={i} className="w-8 h-8 rounded-full bg-[#1F2937] border border-gray-700 hover:border-amber-500 flex items-center justify-center text-gray-400 hover:text-amber-400 text-xs transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Site map */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Site map</h4>
            <ul className="space-y-2">
              {['Nossa Escola', 'Cursos e Formações', 'Psicoterapia Holística', 'Certificações', 'Depoimentos', 'Contato'].map(l => (
                <li key={l}><a href="#" className="text-gray-400 hover:text-amber-400 text-xs transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Recursos</h4>
            <ul className="space-y-2">
              {['Vídeo', 'Lives', 'Conteúdo', 'Comunidade', 'Entrar'].map(l => (
                <li key={l}><a href="#" className="text-gray-400 hover:text-amber-400 text-xs transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Termos de Uso', 'Política de Privacidade', 'Política de Reembolso'].map(l => (
                <li key={l}><a href="#" className="text-gray-400 hover:text-amber-400 text-xs transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-xs">
            ★ WR-EDU © 2025 — Escola de Formação de Terapeutas ★
          </p>
          <p className="text-gray-700 text-xs">
            Feito com ♥ pela plataforma WR-EDU
          </p>
        </div>
      </div>
    </footer>
  );
}