import jsPDF from 'jspdf';
import { base44 } from '@/api/base44Client';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_PRIMARY_LOGO, WR_SIGNATURE_IMAGE } from '@/lib/brand';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PRIMARY = [26, 54, 93];
const GREEN = [45, 90, 39];

export function generateReceiptCode() {
  const block = (len) => Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return `EDU-${block(4)}-${block(4)}`;
}

const artworkPrompts = {
  header_banner: 'Wide horizontal vector ornament only, for a Brazilian education institution receipt. Elegant academic botanical motif: navy blue #1a365d graduation cap silhouette, open book, flowing teal leaves, delicate pale blue curves on transparent or white background. Premium clean editorial vector style, no words, no letters, no numbers, no logo, no watermark.',
  contribution_seal: 'Circular premium vector seal badge for a Brazilian education institution receipt. Forest green #2d5a27 and warm cream, scalloped circular edge, small central sprouting leaf icon, refined ornamental ring. Absolutely no words, no letters, no numbers, no watermark; leave the inner circle uncluttered for text overlay.',
};

async function asDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function getArtwork(kind) {
  const existing = await base44.entities.ReceiptArtwork.filter({ kind }, '-created_date', 1);
  if (existing[0]?.image_url) return { url: existing[0].image_url, generated: false };
  const image = await base44.integrations.Core.GenerateImage({ prompt: artworkPrompts[kind] });
  await base44.entities.ReceiptArtwork.create({ kind, image_url: image.url });
  return { url: image.url, generated: true };
}

function addImageIfAvailable(doc, dataUrl, x, y, width, height) {
  if (dataUrl) doc.addImage(dataUrl, 'PNG', x, y, width, height, undefined, 'FAST');
}

export async function generateTuitionReceiptPdf({ studentName, receiptCode, amount, referenceLabel, paidDate, coordinatorName = 'William Ribeiro', onArtworkPreparing }) {
  const [banner, seal] = await Promise.all([getArtwork('header_banner'), getArtwork('contribution_seal')]);
  const hasNewArtwork = banner.generated || seal.generated;
  if (hasNewArtwork) onArtworkPreparing?.();
  const [bannerData, sealData, logoData, signatureData] = await Promise.all([
    asDataUrl(banner.url), asDataUrl(seal.url), asDataUrl(WR_PRIMARY_LOGO), asDataUrl(WR_SIGNATURE_IMAGE),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const margin = 17;
  const contentWidth = width - margin * 2;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, 297, 'F');
  doc.setDrawColor(160, 174, 192);
  doc.setLineWidth(0.35);
  doc.rect(8, 8, width - 16, 281);

  addImageIfAvailable(doc, bannerData, 16, 12, 51, 30);
  addImageIfAvailable(doc, logoData, 19, 15, 40, 21);
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.55); doc.line(70, 13, 70, 42);
  doc.setTextColor(...PRIMARY); doc.setFont('times', 'bold'); doc.setFontSize(22); doc.text('WR EDU ®', 77, 22);
  doc.setFont('times', 'normal'); doc.setFontSize(11); doc.text('Instituto de Desenvolvimento Humano', 77, 29);
  doc.setFontSize(8.5); doc.text(`CNPJ: ${BRAND_CNPJ}`, 77, 35);
  doc.setDrawColor(111, 181, 151); doc.line(164, 16, 164, 37);
  doc.setFont('times', 'bold'); doc.setFontSize(6.5); doc.setCharSpace(0.7);
  doc.text(['PESSOAS', 'MAIS HUMANAS', 'UM FUTURO', 'MAIS POSSÍVEL'], 170, 20);
  doc.setCharSpace(0);

  doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.45); doc.line(margin, 46, 60, 46); doc.line(150, 46, width - margin, 46);
  doc.setFont('times', 'bold'); doc.setFontSize(6.5); doc.setCharSpace(1.4); doc.text('EDUCAÇÃO TRANSFORMA REALIDADES', width / 2, 48, { align: 'center' }); doc.setCharSpace(0);
  doc.setFontSize(19); doc.text('RECIBO DE CONTRIBUIÇÃO VOLUNTÁRIA', width / 2, 63, { align: 'center' });
  doc.setFont('times', 'normal'); doc.setFontSize(11.5); doc.text('Mensalidade voluntária – reconhecimento ao aluno contribuinte.', width / 2, 70, { align: 'center' });

  const tableY = 77; const rowHeight = 10; const dividerX = 82;
  doc.setFillColor(240, 247, 255); doc.setDrawColor(203, 213, 224); doc.roundedRect(margin, tableY, contentWidth, 51, 3, 3, 'FD');
  doc.setDrawColor(214, 224, 234); doc.line(dividerX, tableY, dividerX, tableY + 51);
  const rows = [['REG', 'Código de registro:', receiptCode], ['ALU', 'Aluno(a):', studentName], ['R$', 'Valor da contribuição:', amount], ['REF', 'Referente a:', referenceLabel || '-'], ['DATA', 'Data do pagamento:', paidDate]];
  rows.forEach(([icon, label, value], index) => {
    const y = tableY + 7 + index * rowHeight;
    if (index) { doc.setDrawColor(255, 255, 255); doc.line(margin + 2, tableY + index * rowHeight + 1, width - margin - 2, tableY + index * rowHeight + 1); }
    doc.setFillColor(...PRIMARY); doc.roundedRect(margin + 7, y - 4.6, 9, 7, 1, 1, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(icon === 'DATA' ? 4 : 5.5); doc.text(icon, margin + 11.5, y, { align: 'center' });
    doc.setTextColor(...PRIMARY); doc.setFont('times', 'normal'); doc.setFontSize(9.4); doc.text(label, margin + 22, y);
    doc.setFont('times', 'bold'); doc.setFontSize(9.7); doc.text(String(value), dividerX + 4, y);
  });

  const paragraphY = 139;
  doc.setTextColor(20, 42, 77); doc.setFont('times', 'normal'); doc.setFontSize(10.4);
  const declaration = `A ${BRAND_LEGAL_NAME}, inscrita no CNPJ ${BRAND_CNPJ}, declara, para os devidos fins, que recebeu de ${studentName}, código de registro ${receiptCode}, a contribuição voluntária no valor de ${amount}, referente a ${referenceLabel || '-'}, com pagamento realizado em ${paidDate}.`;
  doc.text(doc.splitTextToSize(declaration, contentWidth), margin, paragraphY, { lineHeightFactor: 1.3 });

  const recognitionY = 178;
  doc.setFillColor(240, 249, 240); doc.setDrawColor(208, 228, 211); doc.roundedRect(margin, recognitionY, contentWidth, 43, 3, 3, 'FD');
  doc.setFillColor(...GREEN); doc.roundedRect(margin, recognitionY, 3, 43, 2, 2, 'F');
  doc.setTextColor(...GREEN); doc.setFont('times', 'bold'); doc.setFontSize(10); doc.text('NOSSO RECONHECIMENTO', margin + 21, recognitionY + 10);
  doc.setFont('times', 'normal'); doc.setTextColor(20, 42, 77); doc.setFontSize(8.9);
  const recognition = 'Registramos nosso sincero reconhecimento pelo empenho intelectual, pela dedicação aos estudos e pela contribuição financeira realizada. Cada colaboração fortalece a continuidade das atividades formativas e demonstra compromisso com o próprio desenvolvimento e com a construção de oportunidades por meio da educação.';
  doc.text(doc.splitTextToSize(recognition, contentWidth - 30), margin + 21, recognitionY + 17, { lineHeightFactor: 1.28 });
  doc.setTextColor(...GREEN); doc.setFontSize(22); doc.text('❧', margin + 10, recognitionY + 20, { align: 'center' });

  const signatureY = 239;
  doc.setTextColor(...PRIMARY); doc.setFont('times', 'normal'); doc.setFontSize(8.7); doc.text('Atenciosamente,', margin, signatureY);
  addImageIfAvailable(doc, signatureData, margin + 10, signatureY + 3, 48, 15);
  doc.setDrawColor(...PRIMARY); doc.line(margin, signatureY + 20, margin + 62, signatureY + 20);
  doc.setFont('times', 'bold'); doc.setFontSize(9); doc.text(coordinatorName, margin + 31, signatureY + 26, { align: 'center' });
  doc.setFont('times', 'normal'); doc.text('Coordenador Geral', margin + 31, signatureY + 31, { align: 'center' });
  addImageIfAvailable(doc, sealData, 109, signatureY + 1, 34, 34);
  doc.setTextColor(...PRIMARY); doc.setFont('times', 'bold'); doc.setFontSize(7.5); doc.text(['OBRIGADO', 'POR', 'CONTRIBUIR'], 126, signatureY + 15, { align: 'center' });
  doc.setDrawColor(111, 181, 151); doc.line(153, signatureY + 4, 153, signatureY + 29);
  doc.setFont('times', 'italic'); doc.setFontSize(9); doc.text(['Sua participação', 'fortalece', 'este projeto.'], 170, signatureY + 13, { align: 'center' });

  doc.setFillColor(226, 240, 241); doc.rect(8, 273, width - 16, 16, 'F');
  doc.setFillColor(...PRIMARY); doc.triangle(8, 289, 8, 278, 70, 289, 'F');
  doc.setTextColor(...PRIMARY); doc.setFont('times', 'bold'); doc.setFontSize(5.8); doc.setCharSpace(1); doc.text('CONHECIMENTO   •   DESENVOLVIMENTO   •   OPORTUNIDADES', width / 2, 280, { align: 'center' }); doc.setCharSpace(0);
  doc.setFont('times', 'italic'); doc.setFontSize(7.2); doc.text('Documento de reconhecimento e recibo de contribuição voluntária.', width / 2, 286, { align: 'center' });
  doc.save(`recibo-contribuicao-${receiptCode}.pdf`);
  return { artworkGenerated: hasNewArtwork };
}