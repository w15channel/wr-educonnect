import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, CheckCircle, XCircle, Award, ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WR_LOGO = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';
const ABED_LOGO_BLUE = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/235c6e412_LogotipoSOMOSASSOCIADOSABED-Azul.png';

export default function CertificateVerification() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null); // null | 'loading' | 'found' | 'not_found'
  const [cert, setCert] = useState(null);

  const handleSearch = async () => {
    if (!code.trim()) return;
    setResult('loading');
    setCert(null);
    const results = await base44.entities.Certificate.filter({ authenticity_code: code.trim().toUpperCase() }, '-created_date', 1);
    if (results.length > 0 && results[0].status !== 'revoked') {
      setCert(results[0]);
      setResult('found');
    } else {
      setResult('not_found');
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }); } catch { return d; }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-jakarta">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src={WR_LOGO} alt="WR-EDU" className="h-8 w-8 object-contain" />
            <div>
              <p className="font-bold text-slate-800 text-sm">WR-EDU</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-none">Verificação de Certificados</p>
            </div>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} /> Página Inicial
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3">Verificação de Certificado</h1>
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto">
            Insira o código de autenticidade presente no certificado para verificar sua validade e autenticidade.
          </p>
        </div>

        {/* Search box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Código de Autenticidade</label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: WRED-2024-ABCD1234"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="font-mono text-sm tracking-wider h-11"
            />
            <Button onClick={handleSearch} disabled={result === 'loading' || !code.trim()} className="gap-2 h-11 px-5 shrink-0">
              {result === 'loading' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Verificar
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">O código está impresso no rodapé do certificado emitido.</p>
        </div>

        {/* Result: NOT FOUND */}
        {result === 'not_found' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <XCircle size={40} className="text-red-400 mx-auto mb-3" />
            <h3 className="font-bold text-red-700 text-lg mb-2">Certificado não encontrado</h3>
            <p className="text-red-500 text-sm">
              Nenhum certificado ativo foi encontrado com o código <strong className="font-mono">{code}</strong>.
              Verifique se o código está correto ou entre em contato com a instituição.
            </p>
          </div>
        )}

        {/* Result: FOUND */}
        {result === 'found' && cert && (
          <div className="space-y-4">
            {/* Validity banner */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle size={28} className="text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-800">Certificado Válido e Autêntico</p>
                <p className="text-green-600 text-sm">Este certificado foi emitido oficialmente pela WR-EDU e é legítimo.</p>
              </div>
            </div>

            {/* Certificate card */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-md">
              {/* Certificate top */}
              <div className="bg-gradient-to-r from-[#1a1f4e] to-[#0d1636] p-6 text-white text-center">
                <img src={WR_LOGO} alt="WR-EDU" className="w-12 h-12 object-contain mx-auto mb-3" />
                <p className="text-xs tracking-widest text-white/60 uppercase mb-1">WR-EDU — Instituto de Desenvolvimento Humano</p>
                <h2 className="text-xl font-black">Certificado de Conclusão</h2>
                <p className="text-xs text-white/50 mt-1">CNPJ: 62.213.790/0001-40</p>
              </div>

              {/* Details */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><User size={10} /> Aluno(a)</p>
                    <p className="font-bold text-slate-800 text-base">{cert.student_full_name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Award size={10} /> Curso</p>
                    <p className="font-semibold text-slate-700">{cert.course_name}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock size={10} /> Carga Horária</p>
                    <p className="font-semibold text-slate-700">{cert.workload}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={10} /> Conclusão</p>
                    <p className="font-semibold text-slate-700">{formatDate(cert.completion_date)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar size={10} /> Emissão</p>
                    <p className="font-semibold text-slate-700">{formatDate(cert.issue_date || cert.created_date)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Modalidade</p>
                    <p className="font-semibold text-slate-700">{cert.modality || 'EAD'}</p>
                  </div>
                </div>

                {/* Signature area */}
                <div className="border-t border-slate-100 pt-4 text-center">
                  <div className="font-serif text-xl italic text-[#1e3a5f] mb-1">W.Ribeiro</div>
                  <div className="w-32 border-t border-slate-300 mx-auto pt-2">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{cert.coordinator_name || 'Prof. William Ribeiro'}</p>
                    <p className="text-[10px] text-slate-400">Coordenador Geral — WR-EDU</p>
                  </div>
                </div>

                {/* Legal & ABED */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                  <img src={ABED_LOGO_BLUE} alt="ABED" className="w-16 object-contain shrink-0" />
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    Certificado emitido por instituição associada à ABED. Validade nacional conforme {cert.legal_basis || 'Lei nº 9.394/96 e Decreto nº 5.154/04'}.
                  </p>
                </div>

                {/* Auth code */}
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Código de Autenticidade</p>
                  <p className="font-mono font-bold text-slate-700 tracking-widest">{cert.authenticity_code}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-10 text-center text-xs text-slate-400 space-y-1">
          <p>WR-EDU — Instituto de Desenvolvimento Humano · CNPJ: 62.213.790/0001-40</p>
          <p>Parceiros da ABED — Associação Brasileira de Educação a Distância</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/terms" className="hover:text-slate-600 transition-colors">Termos de Serviço</Link>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}