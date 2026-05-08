import { ExternalLink } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="bg-[#0D1117] border-t border-[#1F2937] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Novo</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 text-sm hover:text-amber-400 transition-colors">Acesso</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-amber-400 transition-colors">Contate</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Acesso</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 text-sm hover:text-amber-400 transition-colors">Login</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-amber-400 transition-colors">Comunidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Conteúdo</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 text-sm hover:text-amber-400 transition-colors">Contato</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-amber-400 transition-colors">Termos</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Contact Info</h4>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">📞 (11) -3335-4899</li>
              <li className="text-gray-400 text-sm">🌐 www.wr-edu.com.br</li>
            </ul>
            <div className="flex gap-3 mt-4">
              {['Facebook', 'Instagram', 'Twitter', 'YouTube'].map(s => (
                <a key={s} href="#" className="w-8 h-8 bg-[#1F2937] rounded-full flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-[#374151] transition-colors text-xs font-bold">
                  {s[0]}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#1F2937] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm text-center">
            ✦ WR-EDU © 2025 — Escola de Formação de Terapeutas ✦
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 text-xs hover:text-amber-400 transition-colors">Registro links</a>
            <a href="#" className="text-gray-500 text-xs hover:text-amber-400 transition-colors">Legal e contribuições</a>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <div className="bg-[#1F2937] border border-[#374151] rounded-full px-4 py-1 text-gray-500 text-xs">
            ✦ 5-003.90
          </div>
        </div>
      </div>
    </footer>
  );
}