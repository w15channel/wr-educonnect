import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO } from '@/lib/brand';

function readCertificateParams(search) {
  const params = new URLSearchParams(search);
  const codigo = params.get('codigo') || '';
  return {
    codigo,
    aluno: params.get('aluno') || '',
    curso: params.get('curso') || '',
    carga: params.get('carga') || '',
    media: params.get('media') || '',
    emissao: params.get('emissao') || '',
    honra: params.get('honra') || '',
  };
}

function mapCertificateRecord(record) {
  if (!record) return null;
  return {
    codigo: record.verification_code || '',
    aluno: record.student_name || '',
    curso: record.course_name || '',
    carga: record.total_hours ? String(record.total_hours) : '',
    media: record.average_grade || '',
    emissao: record.issue_date || '',
    honra: record.honor_title || '',
  };
}

export default function CertificateVerifier() {
  const certificateParams = useMemo(() => readCertificateParams(window.location.search), []);
  const [certificateData, setCertificateData] = useState(certificateParams);
  const [typedCode, setTypedCode] = useState(certificateParams.codigo);
  const [isSearching, setIsSearching] = useState(false);
  const normalizedTypedCode = typedCode.trim().toUpperCase();
  const normalizedCertificateCode = certificateData.codigo.trim().toUpperCase();
  const hasCertificateData = Boolean(normalizedCertificateCode && certificateData.aluno && certificateData.curso);
  const isCodeConfirmed = hasCertificateData && normalizedTypedCode === normalizedCertificateCode;

  const searchCertificateCode = async () => {
    const code = normalizedTypedCode;
    if (!code) {
      toast.error('Digite um código de autenticidade para pesquisar.');
      return;
    }

    setIsSearching(true);
    try {
      const records = await base44.entities.CertificateRecord.filter({ verification_code: code }, '-created_date', 1);
      const publicData = mapCertificateRecord(records[0]);
      if (!publicData) {
        setCertificateData({ codigo: code, aluno: '', curso: '', carga: '', media: '', emissao: '', honra: '' });
        toast.error('Nenhum certificado foi encontrado para este código.');
        return;
      }
      setCertificateData(publicData);
      setTypedCode(publicData.codigo);
      const url = new URL(window.location.href);
      url.search = new URLSearchParams({ codigo: publicData.codigo }).toString();
      window.history.replaceState({}, '', url.toString());
      toast.success('Certificado encontrado no banco de dados.');
    } catch (error) {
      console.error('Erro ao pesquisar certificado:', error);
      toast.error('Não foi possível pesquisar o código agora.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <main className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
                <img src={WR_CERTIFICATE_LOGO} alt="Logo WR" className="h-12 w-12 object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300">Autenticidade</p>
                <h1 className="mt-1 text-2xl font-black">Validação de certificado</h1>
                <p className="mt-1 text-sm text-white/60">{BRAND_LEGAL_NAME} · CNPJ {BRAND_CNPJ}</p>
              </div>
            </div>
            <ShieldCheck className="h-14 w-14 text-emerald-300" />
          </div>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Search size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black">Campo público de conferência</h2>
              <p className="mt-1 text-sm text-slate-700">Digite ou cole o código exibido no certificado e clique em pesquisar código para buscar o registro salvo no banco de dados.</p>
            </div>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-700">Código de autenticidade</span>
            <input
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black uppercase tracking-widest text-black outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
              value={typedCode}
              onChange={(event) => setTypedCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === 'Enter') searchCertificateCode();
              }}
              placeholder="WR-26-XXXX"
            />
          </label>

          <button
            type="button"
            onClick={searchCertificateCode}
            disabled={isSearching}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            <Search size={18} />
            {isSearching ? 'Pesquisando...' : 'Pesquisar código'}
          </button>

          {!hasCertificateData && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Informe um código válido e clique em pesquisar para consultar os dados públicos do certificado emitido pela coordenação.
            </div>
          )}

          {hasCertificateData && !isCodeConfirmed && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              O código digitado não corresponde ao código de autenticidade carregado nesta página.
            </div>
          )}

          {isCodeConfirmed && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-600" />
                <h3 className="text-lg font-black">Certificado conferido</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-950">Os dados públicos abaixo correspondem às informações de conclusão salvas no banco de dados de autenticidade do certificado.</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-black">Aluno</dt><dd className="mt-1 font-bold text-black">{certificateData.aluno}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-black">Curso</dt><dd className="mt-1 font-bold text-black">{certificateData.curso}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-black">Carga horária</dt><dd className="mt-1 font-bold text-black">{certificateData.carga} horas</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-black">Média final</dt><dd className="mt-1 font-bold text-black">{certificateData.media}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-black">Emissão</dt><dd className="mt-1 font-bold text-black">{certificateData.emissao}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-black">Código</dt><dd className="mt-1 font-black tracking-widest text-black">{certificateData.codigo}</dd></div>
              </dl>
              {certificateData.honra && (
                <div className="mt-3 rounded-2xl bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-black">Destaque</p>
                  <p className="mt-1 font-bold text-black">{certificateData.honra}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="flex items-center justify-center gap-2 text-sm text-white/60">
          <Award size={16} /> WR Educacional · Validação pública de certificados
        </footer>
      </main>
    </div>
  );
}
