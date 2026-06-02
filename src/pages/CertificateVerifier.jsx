import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Search, ShieldCheck } from 'lucide-react';
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

export default function CertificateVerifier() {
  const certificateData = useMemo(() => readCertificateParams(window.location.search), []);
  const [typedCode, setTypedCode] = useState(certificateData.codigo);
  const normalizedTypedCode = typedCode.trim().toUpperCase();
  const normalizedCertificateCode = certificateData.codigo.trim().toUpperCase();
  const hasCertificateData = Boolean(normalizedCertificateCode && certificateData.aluno && certificateData.curso);
  const isCodeConfirmed = hasCertificateData && normalizedTypedCode === normalizedCertificateCode;

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
              <p className="mt-1 text-sm text-slate-600">Digite ou cole o código exibido no certificado. Quando o QR Code é escaneado, o código já vem preenchido no link público.</p>
            </div>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Código de autenticidade</span>
            <input
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black uppercase tracking-widest outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              value={typedCode}
              onChange={(event) => setTypedCode(event.target.value.toUpperCase())}
              placeholder="WR-2026-XXXXXXXX"
            />
          </label>

          {!hasCertificateData && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Informe um link de certificado válido com os dados de autenticação emitidos pela coordenação.
            </div>
          )}

          {hasCertificateData && !isCodeConfirmed && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              O código digitado não corresponde ao código de autenticidade deste link.
            </div>
          )}

          {isCodeConfirmed && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-600" />
                <h3 className="text-lg font-black">Certificado conferido</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-900">Os dados públicos abaixo correspondem às informações de conclusão disponibilizadas no link de autenticidade do certificado.</p>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Aluno</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.aluno}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Curso</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.curso}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Carga horária</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.carga} horas</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Média final</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.media}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Emissão</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.emissao}</dd></div>
                <div className="rounded-2xl bg-white p-4"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Código</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.codigo}</dd></div>
                {certificateData.honra && <div className="rounded-2xl bg-white p-4 sm:col-span-2"><dt className="text-xs font-black uppercase tracking-wide text-slate-500">Destaque de honra</dt><dd className="mt-1 font-bold text-slate-950">{certificateData.honra}</dd></div>}
              </dl>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/65">
          <div className="flex items-center gap-2 text-white">
            <Award size={18} className="text-amber-300" />
            <h2 className="font-black">Observação de segurança</h2>
          </div>
          <p className="mt-2">Esta página confere os dados públicos vinculados ao QR Code/código do certificado. Em caso de divergência, solicite conferência administrativa junto à coordenação da {BRAND_LEGAL_NAME}.</p>
        </section>
      </main>
    </div>
  );
}
