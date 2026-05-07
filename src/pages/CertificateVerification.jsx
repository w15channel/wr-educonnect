import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Search, CheckCircle, XCircle, Award, ExternalLink, Calendar, Clock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

export default function CertificateVerification() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(false);
    const trimmed = query.trim().toUpperCase();
    const results = await base44.entities.Certificate.filter({ authenticity_code: trimmed });
    if (results.length === 0) {
      setResult(null);
    } else {
      setResult(results[0]);
    }
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center gap-4">
        <a href="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="WR-EDU" className="w-9 h-9 object-contain" />
          <div>
            <span className="text-white font-bold text-base">WR-EDU</span>
            <p className="text-white/30 text-[10px] uppercase tracking-widest -mt-0.5">Portal Educacional</p>
          </div>
        </a>
        <div className="ml-auto">
          <a href="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">
            ← Voltar ao portal
          </a>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12 max-w-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/30">
            <Award size={32} className="text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Verificação de Certificado
          </h1>
          <p className="text-white/50 text-base leading-relaxed">
            Digite o código de autenticidade do certificado para verificar sua validade e autenticidade.
          </p>
        </div>

        {/* Search box */}
        <div className="w-full max-w-lg">
          <form onSubmit={handleSearch} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <label className="block text-white/50 text-xs font-bold uppercase tracking-widest mb-3">
              Código de Autenticidade
            </label>
            <div className="flex gap-3">
              <Input
                placeholder="Ex: WR-2025-XXXXX"
                value={query}
                onChange={e => setQuery(e.target.value.toUpperCase())}
                className="flex-1 bg-white/6 border-white/10 text-white placeholder:text-white/20 h-12 text-center tracking-widest font-mono"
              />
              <Button
                type="submit"
                disabled={!query.trim() || loading}
                className="h-12 px-5 bg-gradient-to-r from-[#5b5ef4] to-[#1db89e] border-0 hover:opacity-90 gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                Verificar
              </Button>
            </div>
          </form>

          {/* Result */}
          {searched && (
            <div className="mt-6 animate-fade-in">
              {result ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-green-300 font-bold text-base">Certificado Válido e Autêntico</h3>
                      <p className="text-green-400/60 text-xs">Verificado pela WR-EDU</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <User size={14} className="text-white/40 shrink-0" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Aluno</p>
                        <p className="text-white font-semibold text-sm">{result.student_full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <Award size={14} className="text-white/40 shrink-0" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Curso</p>
                        <p className="text-white font-semibold text-sm">{result.course_name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <Clock size={14} className="text-white/40 shrink-0" />
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Carga Horária</p>
                          <p className="text-white font-semibold text-sm">{result.workload}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                        <Calendar size={14} className="text-white/40 shrink-0" />
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider">Conclusão</p>
                          <p className="text-white font-semibold text-sm">
                            {result.completion_date ? new Date(result.completion_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                      <Shield size={14} className="text-white/40 shrink-0" />
                      <div>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">Coordenação</p>
                        <p className="text-white font-semibold text-sm">{result.coordinator_name || 'William Ribeiro'}</p>
                        <p className="text-white/40 text-[10px]">{result.legal_basis || 'Lei nº 9.394/96 e Decreto nº 5.154/04'}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Código de Autenticidade</p>
                      <p className="text-white/70 font-mono text-xs break-all">{result.authenticity_code}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/30">
                    <Shield size={11} />
                    Representado junto à ABED —
                    <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
                      className="text-[#1db89e] hover:underline flex items-center gap-1">
                      Consultar <ExternalLink size={9} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <XCircle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-red-300 font-bold">Certificado não encontrado</h3>
                    <p className="text-red-400/60 text-sm mt-1">
                      O código informado não corresponde a nenhum certificado em nossa base. Verifique se o código está correto e tente novamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-5 text-center">
        <p className="text-white/20 text-xs">
          WR-EDU © {new Date().getFullYear()} · Escola de Formação de Terapeutas · Representado junto à ABED
        </p>
        <p className="text-white/12 text-[10px] mt-1">
          Base legal: Lei nº 9.394/96 e Decreto nº 5.154/04
        </p>
      </footer>
    </div>
  );
}