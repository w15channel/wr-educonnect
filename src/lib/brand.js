export const BRAND_SHORT_NAME = 'WR-EDU';
export const BRAND_LEGAL_NAME = 'WR-EDU Instituto de Desenvolvimento Humano';
export const BRAND_CNPJ = '62.213.790/001-40';
export const BRAND_DOCUMENT_LINE = `${BRAND_LEGAL_NAME} · CNPJ ${BRAND_CNPJ}`;

export const WR_PRIMARY_LOGO =
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/077216e46_textodoseupargrafoWR_20251219_192959_0000.png';

export const WR_CERTIFICATE_LOGO =
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/5265f3b64_1000407748_d589e7f2d77d09c6941cdd7fa30003c5-03_02_202612_32_07.png';

export const WR_SIGNATURE_IMAGE =
  'https://media.base44.com/images/public/69f55577840a3c93cee191be/40ede54e6_DOC-20251126-WA0000pdfpdf.png';

export function formatDocumentIssuer(extra = '') {
  return `Documento emitido digitalmente pela ${BRAND_DOCUMENT_LINE}${extra ? ` · ${extra}` : ''}`;
}