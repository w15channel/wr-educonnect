import jsPDF from 'jspdf';
import { BRAND_LEGAL_NAME, BRAND_CNPJ } from '@/lib/brand';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Gera um código de registro estável para o recibo, ex: EDU-9PWT-EXEC */
export function generateReceiptCode() {
  const block = (len) => Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  return `EDU-${block(4)}-${block(4)}`;
}

/** Monta e baixa o PDF do recibo de contribuição voluntária. */
export function generateTuitionReceiptPdf({ studentName, receiptCode, amount, referenceLabel, paidDate, coordinatorName = 'William Ribeiro' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 20;
  const primary = [26, 45, 90];
  const green = [16, 122, 87];
  const boxW = pageWidth - marginX * 2;

  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('WR EDU ®', marginX, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Instituto de Desenvolvimento Humano', marginX, 21);
  doc.setFontSize(8);
  doc.text(`CNPJ: ${BRAND_CNPJ}`, marginX, 26);

  let y = 44;
  doc.setTextColor(...primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('RECIBO DE CONTRIBUIÇÃO VOLUNTÁRIA', pageWidth / 2, y, { align: 'center' });
  y += 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text('Mensalidade voluntária – reconhecimento ao aluno contribuinte.', pageWidth / 2, y, { align: 'center' });

  y += 12;
  const rows = [
    ['Código de registro:', receiptCode],
    ['Aluno(a):', studentName],
    ['Valor da contribuição:', amount],
    ['Referente a:', referenceLabel || '-'],
    ['Data do pagamento:', paidDate],
  ];
  const rowH = 9;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(246, 248, 251);
  doc.roundedRect(marginX, y, boxW, rowH * rows.length + 6, 3, 3, 'FD');
  let ry = y + 8;
  rows.forEach(([label, value]) => {
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(label, marginX + 6, ry);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), marginX + 62, ry);
    ry += rowH;
  });

  y = ry + 8;
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const paragraph = `A ${BRAND_LEGAL_NAME}, inscrita no CNPJ ${BRAND_CNPJ}, declara, para os devidos fins, que recebeu de ${studentName}, código de registro ${receiptCode}, a contribuição voluntária no valor de ${amount}, referente a ${referenceLabel || '-'}, com pagamento realizado em ${paidDate}.`;
  const paragraphLines = doc.splitTextToSize(paragraph, boxW);
  doc.text(paragraphLines, marginX, y);
  y += paragraphLines.length * 5.5 + 10;

  const reconText = 'Registramos nosso sincero reconhecimento pelo empenho intelectual, pela dedicação aos estudos e pela contribuição financeira realizada. Cada colaboração fortalece a continuidade das atividades formativas e demonstra compromisso com o próprio desenvolvimento e com a construção de oportunidades por meio da educação.';
  const reconLines = doc.splitTextToSize(reconText, boxW - 12);
  const reconH = reconLines.length * 5.2 + 14;
  doc.setFillColor(240, 250, 244);
  doc.setDrawColor(...green);
  doc.roundedRect(marginX, y, boxW, reconH, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...green);
  doc.text('NOSSO RECONHECIMENTO', marginX + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(50, 60, 55);
  doc.text(reconLines, marginX + 6, y + 15);

  y += reconH + 20;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(coordinatorName, marginX, y);
  doc.setDrawColor(120, 120, 120);
  doc.line(marginX, y + 2, marginX + 60, y + 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(coordinatorName, marginX, y + 8);
  doc.text('Coordenador Geral', marginX, y + 13);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Sua participação fortalece este projeto.', pageWidth - marginX, y + 8, { align: 'right' });

  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, 280, pageWidth - marginX, 280);
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Documento de reconhecimento e recibo de contribuição voluntária.', pageWidth / 2, 285, { align: 'center' });

  doc.save(`recibo-contribuicao-${receiptCode}.pdf`);
}