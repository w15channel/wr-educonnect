import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ } from '@/lib/brand';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReceiptCode() {
  const block = (len) => Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return `EDU-${block(4)}-${block(4)}`;
}

function buildPrompt({ studentName, receiptCode, amount, referenceLabel, paidDate, coordinatorName }) {
  return `A single, complete, print-ready vertical A4 portrait receipt document for a Brazilian education institute, rendered as one cohesive designed page — classic academic style, sober and institutional, absolutely not a collage of pieces.

OVERALL DESIGN: clean off-white paper background with a fine double border frame in deep navy blue #1a365d running around the whole page, with small ornamental corner flourishes. Elegant, symmetric, generous white space, refined serif typography throughout (Garamond / Trajan feel). Accent color forest green #2d5a27 used sparingly for rules and the seal. Flat vector editorial print design, crisp high-resolution, perfectly straight horizontal baselines, no photo texture, no drop shadows, no gradients, no mockup, no desk, no hands, no folded paper.

TEXT CONTENT — render every line exactly as written, spelled correctly, sharp and highly legible, correct Portuguese accents:
Header, centered at top: "WR EDU ®" large in navy serif capitals, below it "Instituto de Desenvolvimento Humano" in smaller serif italic, below it "CNPJ ${BRAND_CNPJ}" in small caps. A thin green horizontal rule under the header.
Main title, centered, navy serif capitals with letter-spacing: "RECIBO DE CONTRIBUIÇÃO VOLUNTÁRIA".
A bordered data panel with light blue-grey fill containing five aligned label/value rows, labels in navy serif on the left and values in bold serif on the right:
"Código de registro:" — "${receiptCode}"
"Aluno(a):" — "${studentName}"
"Valor da contribuição:" — "${amount}"
"Referente a:" — "${referenceLabel}"
"Data do pagamento:" — "${paidDate}"
Below the panel, a justified formal declaration paragraph in serif: "Declaramos, para os devidos fins, que recebemos de ${studentName} a contribuição voluntária no valor de ${amount}, referente a ${referenceLabel}, com pagamento realizado em ${paidDate}."
A recognition box outlined in green #2d5a27 with the heading "NOSSO RECONHECIMENTO" and the text: "Agradecemos a dedicação aos estudos e a contribuição realizada. Cada colaboração fortalece a continuidade das atividades formativas do instituto."
Bottom left: a handwritten-style signature line above the name "${coordinatorName}" with "Coordenador Geral" underneath.
Bottom right: an elegant circular scalloped seal in green and navy with the words "OBRIGADO POR CONTRIBUIR" curved inside the ring and a small sprouting leaf at its center.
Footer bar across the bottom in navy small capitals: "CONHECIMENTO • DESENVOLVIMENTO • OPORTUNIDADES".

No other words, no lorem ipsum, no placeholder text, no duplicated lines, no watermark, no QR code, no barcode.`;
}

export async function generateReceiptImage(data) {
  const result = await base44.integrations.Core.GenerateImage({ prompt: buildPrompt(data) });
  return result.url;
}

export async function downloadReceiptImage(url, receiptCode) {
  const response = await fetch(url);
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `recibo-contribuicao-${receiptCode}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}