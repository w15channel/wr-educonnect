/**
 * ApostilaPrintModal — exportação da versão impressa da apostila em PDF A4.
 * O modelo PNG foi removido: a impressão acontece exclusivamente via PDF, com
 * visual profissional (moldura, cabeçalho institucional, rodapé numerado) e a
 * regra de um tópico por página: cada tópico começa no topo de uma página e o
 * corpo é ajustado automaticamente para terminar antes da quebra de página —
 * inclusive o último tópico.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, FileText, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, formatDocumentIssuer } from '@/lib/brand';

const PDF_PAGE_WIDTH_PT = 595.28;
const PDF_PAGE_HEIGHT_PT = 841.89;
const PDF_PAGE_MARGIN = 52;
const PDF_MARGIN_LEFT = PDF_PAGE_MARGIN;
const PDF_MARGIN_RIGHT = PDF_PAGE_MARGIN;
const PDF_FRAME_MARGIN = 22;
const PDF_BODY_FONT_SIZE = 10.8;
const PDF_BODY_MIN_FONT_SIZE = 8.2;
const PDF_BODY_FONT_STEP = 0.2;
const PDF_BODY_LINE_RATIO = 1.45;
const PDF_BODY_MIN_LINE_RATIO = 1.28;
const PDF_PARAGRAPH_GAP = 8;
const PDF_HEADING_FONT_SIZE = 13.2;
const PDF_HEADING_LINE_HEIGHT = PDF_HEADING_FONT_SIZE * 1.35;
const PDF_HEADING_AFTER_GAP = 14;
const PDF_HEADING_RULE_GAP = 6;
const PDF_FOOTER_FONT_SIZE = 7.6;
const PDF_DENSE_PARAGRAPH_MIN_CHARS = 850;
const PDF_DENSE_PARAGRAPH_TARGET_SENTENCES = 4;

const stripUnsafePrintCharacters = (value = '') => String(value)
  .replace(/^[^\p{L}\p{N}<#*]+(?=\s*(?:=====\s*Page|\d+[.)]|[A-ZÁÉÍÓÚÂÊÔÃÕÇ]))/gmu, '')
  .replace(/^\s*=====\s*Page\s*\d+\s*=====\s*$/gmi, '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
  .replace(/\u00AD/g, '')
  .replace(/[\u200B-\u200D\uFEFF]/g, '');

const repairSpacedLetters = (value = '') => String(value).replace(
  /(?<![\p{L}])(?:[\p{L}]\s+){2,}[\p{L}](?![\p{L}])/gu,
  (match) => match.replace(/\s+/g, '')
);

const normalizePdfSafeCharacters = (value = '') => String(value)
  .replace(/\u00A0/g, ' ')
  .replace(/[\u2010-\u2015\u2212]/g, '-')
  .replace(/[“”„]/g, '"')
  .replace(/[‘’‚]/g, "'")
  .replace(/\u2022/g, '-');

const normalizeExtractedApostilaText = (value = '') => repairSpacedLetters(normalizePdfSafeCharacters(stripUnsafePrintCharacters(value)))
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const normalizeParagraphKey = (value = '') => normalizeExtractedApostilaText(value)
  .toLocaleLowerCase('pt-BR')
  .replace(/[“”]/g, '"')
  .replace(/[‘’]/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const isNumberedTopicTitleLine = (line = '') => /^\s*\d{1,2}[.)]\s+\S/.test(line.trim()) && line.trim().length <= 120;
const hasLowercaseLetter = (value = '') => /[\p{Ll}]/u.test(value);
const isUppercaseTopicTitle = (value = '') => {
  const cleanValue = normalizeExtractedApostilaText(value)
    .replace(/^\d{1,2}[.)]\s+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return cleanValue.length >= 8 && cleanValue.length <= 150 && !hasLowercaseLetter(cleanValue);
};

function removePrintablePreamble(value = '') {
  const source = normalizeExtractedApostilaText(value);
  const firstTopic = source.match(/^\s*1[.)]\s+/m);
  if (!firstTopic || firstTopic.index > 700) return source;
  return source.slice(firstTopic.index).trim();
}

function breakEmbeddedNumberedTopics(value = '') {
  return normalizeExtractedApostilaText(value)
    .replace(/([.!?])\s+(\d{1,2}[.)]\s+(?=[A-Z0-9ÁÉÍÓÚÂÊÔÃÕÇ]))/g, '$1\n\n$2');
}

function splitNumberedHeadingLead(paragraph = '') {
  const source = normalizeExtractedApostilaText(paragraph).trim();
  if (!/^\d{1,2}[.)]\s+/.test(source)) return [source].filter(Boolean);

  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1 && isNumberedTopicTitleLine(lines[0]) && isUppercaseTopicTitle(lines[0])) {
    return [lines[0], lines.slice(1).join(' ')].filter(Boolean);
  }

  const flat = source.replace(/\s+/g, ' ').trim();
  const numberedPrefix = flat.match(/^\d{1,2}[.)]\s+/)?.[0] || '';
  if (!numberedPrefix) return [source].filter(Boolean);

  const textAfterNumber = flat.slice(numberedPrefix.length);
  const sentenceCaseBoundary = [...textAfterNumber.matchAll(/\s+(?=(?:[\p{Lu}][\p{Ll}])|(?:[AEOÀÁÉÍÓÚ]\s+[\p{Ll}]))/gu)]
    .find((match) => match.index >= 18);
  if (!sentenceCaseBoundary) return [source].filter(Boolean);

  const splitAt = numberedPrefix.length + sentenceCaseBoundary.index;
  const heading = flat.slice(0, splitAt).trim();
  const body = flat.slice(splitAt).trim();
  if (!body || !isUppercaseTopicTitle(heading)) return [source].filter(Boolean);
  return [heading, body];
}

const removeDuplicateParagraphs = (paragraphs = []) => {
  const seen = new Set();
  return paragraphs.filter((paragraph) => {
    const key = normalizeParagraphKey(paragraph);
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function splitDenseParagraph(paragraph = '') {
  const cleanParagraph = normalizeExtractedApostilaText(paragraph).replace(/[ \t]+/g, ' ').trim();
  if (!cleanParagraph || isApostilaPdfTopicHeading(cleanParagraph) || cleanParagraph.length < PDF_DENSE_PARAGRAPH_MIN_CHARS) {
    return cleanParagraph ? [cleanParagraph] : [];
  }

  const sentences = cleanParagraph
    .match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences || sentences.length <= PDF_DENSE_PARAGRAPH_TARGET_SENTENCES + 1) {
    return [cleanParagraph];
  }

  const chunks = [];
  let current = [];
  for (const sentence of sentences) {
    current.push(sentence);
    const currentText = current.join(' ');
    if (current.length >= PDF_DENSE_PARAGRAPH_TARGET_SENTENCES || currentText.length >= PDF_DENSE_PARAGRAPH_MIN_CHARS) {
      chunks.push(currentText);
      current = [];
    }
  }
  if (current.length) chunks.push(current.join(' '));
  return chunks;
}

function getPrintableParagraphs(printableText = '') {
  const paragraphs = breakEmbeddedNumberedTopics(removePrintablePreamble(printableText))
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap(splitNumberedHeadingLead)
    .flatMap(splitDenseParagraph);
  return removeDuplicateParagraphs(paragraphs).filter(Boolean);
}

const joinArtificialLineBreaks = (value = '') => normalizeExtractedApostilaText(value)
  .split(/\n{2,}/)
  .map((paragraph) => {
    const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length <= 1) return paragraph.trim();

    return lines.reduce((current, line, index) => {
      if (index === 0) return line;
      if (/-$/.test(current)) return `${current.slice(0, -1)}${line}`;
      if (isNumberedTopicTitleLine(current)) return `${current}\n\n${line}`;
      if (isNumberedTopicTitleLine(line)) return `${current}\n\n${line}`;
      if (/^\s*(?:[•-]|\d+[.)])\s+/.test(line)) return `${current}\n${line}`;
      return `${current} ${line}`;
    }, '');
  })
  .join('\n\n');

const isHtmlContent = (value = '') => /<[^>]+>/.test(value);

function decodeHtmlEntities(value = '') {
  if (typeof document === 'undefined') {
    return String(value)
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

function htmlToPrintableText(value = '') {
  const source = stripUnsafePrintCharacters(value).trim();
  if (!source) return '';

  const withBreaks = isHtmlContent(source)
    ? source
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\s*\/\s*(p|div|h[1-6]|li|blockquote)\s*>/gi, '\n\n')
        .replace(/<\s*li\b[^>]*>/gi, '• ')
        .replace(/<[^>]*>/g, '')
    : source;

  return joinArtificialLineBreaks(stripUnsafePrintCharacters(decodeHtmlEntities(withBreaks))
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim());
}

async function imageUrlToDataUrl(url) {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function resetPdfTextSpacing(pdf) {
  if (typeof pdf.setCharSpace === 'function') pdf.setCharSpace(0);
}

function setBodyFont(pdf, fontSize = PDF_BODY_FONT_SIZE) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(fontSize);
  resetPdfTextSpacing(pdf);
}

function setTitleFont(pdf) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(PDF_HEADING_FONT_SIZE);
  resetPdfTextSpacing(pdf);
}

function setFooterFont(pdf) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(PDF_FOOTER_FONT_SIZE);
  resetPdfTextSpacing(pdf);
}

function assertNoOverflow(pdf, line, maxWidth, context) {
  const width = pdf.getTextWidth(line);
  if (width > maxWidth + 0.25) {
    console.error(`[Apostila PDF] Overflow horizontal em ${context}: ${width.toFixed(2)}pt > ${maxWidth.toFixed(2)}pt`, line);
    return false;
  }
  return true;
}

function splitLongToken(pdf, token, maxWidth) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken || pdf.getTextWidth(cleanToken) <= maxWidth) return [cleanToken].filter(Boolean);

  const parts = [];
  let current = '';
  for (const char of cleanToken) {
    const candidate = `${current}${char}`;
    if (current && pdf.getTextWidth(candidate) > maxWidth) {
      parts.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapText(pdf, text, maxWidth, context = 'texto') {
  const source = normalizeExtractedApostilaText(text).replace(/[ \t]+/g, ' ').trim();
  if (!source) return [];

  const preliminaryLines = pdf.splitTextToSize(source, maxWidth)
    .map((line) => stripUnsafePrintCharacters(line).replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  const safeLines = [];
  for (const line of preliminaryLines) {
    if (assertNoOverflow(pdf, line, maxWidth, context)) {
      safeLines.push(line);
      continue;
    }

    const words = line.split(/\s+/).filter(Boolean).flatMap((word) => splitLongToken(pdf, word, maxWidth));
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (pdf.getTextWidth(candidate) <= maxWidth) {
        current = candidate;
      } else {
        if (current) safeLines.push(current);
        current = word;
      }
    }
    if (current) safeLines.push(current);
  }

  safeLines.forEach((line) => assertNoOverflow(pdf, line, maxWidth, context));
  return safeLines;
}

function getSingleLineFittingText(pdf, text, maxWidth, context) {
  const source = normalizeExtractedApostilaText(text).replace(/[ \t]+/g, ' ').trim();
  if (!source || pdf.getTextWidth(source) <= maxWidth) {
    if (source) assertNoOverflow(pdf, source, maxWidth, context);
    return source;
  }
  const ellipsis = '...';
  let fitted = source;
  while (fitted.length > 0 && pdf.getTextWidth(`${fitted}${ellipsis}`) > maxWidth) {
    fitted = fitted.slice(0, -1).trimEnd();
  }
  const result = fitted ? `${fitted}${ellipsis}` : ellipsis;
  assertNoOverflow(pdf, result, maxWidth, context);
  return result;
}

function createApostilaPdfLayout(pageWidth, pageHeight, pageNumber = 1) {
  const isFirstPage = pageNumber === 1;
  const headerHeight = isFirstPage ? 128 : 50;
  const footerY = pageHeight - PDF_FRAME_MARGIN - 18;
  return {
    pageWidth,
    pageHeight,
    marginLeft: PDF_MARGIN_LEFT,
    marginRight: PDF_MARGIN_RIGHT,
    contentWidth: pageWidth - PDF_MARGIN_LEFT - PDF_MARGIN_RIGHT,
    pageTop: PDF_FRAME_MARGIN,
    headerHeight,
    contentTop: PDF_FRAME_MARGIN + headerHeight + (isFirstPage ? 4 : 8),
    contentBottom: footerY - 32,
    footerY,
  };
}

function drawApostilaPdfPageFrame({ pdf, pageWidth, pageHeight, logoDataUrl, lessonTitle, chapterTitle, pageNumber = 1 }) {
  const navy = [30, 58, 95];
  const gold = [201, 168, 76];
  const lightBlue = [240, 244, 248];
  const isFirstPage = pageNumber === 1;
  const layout = createApostilaPdfLayout(pageWidth, pageHeight, pageNumber);
  const centerX = layout.marginLeft + layout.contentWidth / 2;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.55);
  pdf.rect(PDF_FRAME_MARGIN, PDF_FRAME_MARGIN, pageWidth - PDF_FRAME_MARGIN * 2, pageHeight - PDF_FRAME_MARGIN * 2);
  pdf.setDrawColor(...lightBlue);
  pdf.setLineWidth(1.1);
  pdf.rect(PDF_FRAME_MARGIN + 4, PDF_FRAME_MARGIN + 4, pageWidth - (PDF_FRAME_MARGIN + 4) * 2, pageHeight - (PDF_FRAME_MARGIN + 4) * 2);

  if (isFirstPage) {
    if (logoDataUrl) pdf.addImage(logoDataUrl, 'PNG', layout.marginLeft, 30, 30, 30, undefined, 'FAST');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...navy);
    wrapText(pdf, BRAND_LEGAL_NAME, layout.contentWidth - 88, 'cabeçalho institucional').forEach((line, index) => {
      pdf.text(line, centerX, 36 + index * 11.5, { align: 'center' });
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.setTextColor(136, 136, 136);
    pdf.text('Terapia · Educação · Desenvolvimento Pessoal', centerX, 62, { align: 'center' });

    pdf.setDrawColor(...navy);
    pdf.setLineWidth(0.35);
    pdf.line(layout.marginLeft, 72, pageWidth - layout.marginRight, 72);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(122, 106, 58);
    pdf.text('APOSTILA DE ESTUDOS', centerX, 86, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...navy);
    wrapText(pdf, lessonTitle || 'Aula da apostila', layout.contentWidth, 'título da aula').slice(0, 2).forEach((line, index) => {
      pdf.text(line, centerX, 103 + index * 14, { align: 'center' });
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(122, 106, 58);
    const chapter = getSingleLineFittingText(pdf, chapterTitle || 'Apostila', layout.contentWidth, 'módulo no cabeçalho');
    pdf.text(chapter, centerX, 132, { align: 'center' });
    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.6);
    pdf.line(centerX - 42, 142, centerX + 42, 142);
    return;
  }

  if (logoDataUrl) pdf.addImage(logoDataUrl, 'PNG', layout.marginLeft, 30, 18, 18, undefined, 'FAST');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.6);
  pdf.setTextColor(...navy);
  pdf.text(getSingleLineFittingText(pdf, BRAND_LEGAL_NAME, 245, 'cabeçalho compacto institucional'), layout.marginLeft + 27, 43);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(122, 106, 58);
  const shortTitle = getSingleLineFittingText(pdf, lessonTitle || 'Aula da apostila', 190, 'cabeçalho compacto título');
  pdf.text(shortTitle, pageWidth - layout.marginRight, 42, { align: 'right' });
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.3);
  pdf.line(layout.marginLeft, 58, pageWidth - layout.marginRight, 58);
}

function drawApostilaPdfFooter({ pdf, pageWidth, pageHeight, pageNumber, totalPages }) {
  const layout = createApostilaPdfLayout(pageWidth, pageHeight, pageNumber);
  const footerY = layout.footerY;
  const pageText = `Página ${pageNumber} de ${totalPages}`;
  setFooterFont(pdf);
  const pageTextWidth = pdf.getTextWidth(pageText);
  const leftMaxWidth = layout.contentWidth - pageTextWidth - 18;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.25);
  pdf.line(layout.marginLeft, footerY - 13, pageWidth - layout.marginRight, footerY - 13);
  pdf.setTextColor(120, 126, 138);
  const issuer = getSingleLineFittingText(pdf, formatDocumentIssuer(), leftMaxWidth, 'rodapé institucional')
    || getSingleLineFittingText(pdf, `Documento emitido digitalmente pela WR-EDU · CNPJ ${BRAND_CNPJ}`, leftMaxWidth, 'rodapé institucional curto');
  pdf.text(issuer, layout.marginLeft, footerY);
  assertNoOverflow(pdf, pageText, pageTextWidth, 'numeração do rodapé');
  pdf.text(pageText, pageWidth - layout.marginRight, footerY, { align: 'right' });
}

function isApostilaPdfTopicHeading(paragraph) {
  const cleanParagraph = normalizeExtractedApostilaText(paragraph).replace(/[ \t]+/g, ' ').trim();
  if (/^\d{1,2}[.)]\s+/.test(cleanParagraph)) {
    return isUppercaseTopicTitle(cleanParagraph);
  }
  return /^\d+[.)]\s+/.test(cleanParagraph) || /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ,:;—–-]{18,}$/.test(cleanParagraph);
}

/**
 * Agrupa os parágrafos em tópicos: cada título numerado abre um novo tópico e
 * carrega consigo os parágrafos seguintes até o próximo título. Conteúdo antes
 * do primeiro título vira um tópico sem cabeçalho.
 */
function groupParagraphsIntoTopics(paragraphs = []) {
  const topics = [];
  let current = null;

  for (const paragraph of paragraphs) {
    if (isApostilaPdfTopicHeading(paragraph)) {
      if (current && (current.heading || current.paragraphs.length)) topics.push(current);
      current = { heading: paragraph, paragraphs: [] };
    } else {
      if (!current) current = { heading: null, paragraphs: [] };
      current.paragraphs.push(paragraph);
    }
  }
  if (current && (current.heading || current.paragraphs.length)) topics.push(current);
  return topics;
}

function getTopicHeadingBlockHeight(pdf, topic, contentWidth) {
  if (!topic.heading) return 0;
  setTitleFont(pdf);
  const headingLines = wrapText(pdf, topic.heading, contentWidth, 'título de tópico');
  return headingLines.length * PDF_HEADING_LINE_HEIGHT + PDF_HEADING_RULE_GAP + PDF_HEADING_AFTER_GAP;
}

function measureTopicBodyHeight(pdf, topic, contentWidth, bodyFontSize, lineRatio) {
  setBodyFont(pdf, bodyFontSize);
  const lineHeight = bodyFontSize * lineRatio;
  return topic.paragraphs.reduce((height, paragraph, index) => {
    const lines = wrapText(pdf, paragraph, contentWidth, 'corpo');
    return height + lines.length * lineHeight + (index < topic.paragraphs.length - 1 ? PDF_PARAGRAPH_GAP : 0);
  }, 0);
}

/**
 * Encontra o maior tamanho de fonte (e, em último caso, a menor entrelinha)
 * que faz o tópico inteiro caber na área útil de uma única página, garantindo
 * que ele termine antes da quebra de página.
 */
function fitTopicToPage(pdf, topic, layout) {
  const capacity = layout.contentBottom - layout.contentTop;
  const bodyCapacity = capacity - getTopicHeadingBlockHeight(pdf, topic, layout.contentWidth);

  for (let fontSize = PDF_BODY_FONT_SIZE; fontSize >= PDF_BODY_MIN_FONT_SIZE - 0.001; fontSize -= PDF_BODY_FONT_STEP) {
    const roundedSize = Math.round(fontSize * 10) / 10;
    if (measureTopicBodyHeight(pdf, topic, layout.contentWidth, roundedSize, PDF_BODY_LINE_RATIO) <= bodyCapacity) {
      return { fontSize: roundedSize, lineRatio: PDF_BODY_LINE_RATIO, fits: true };
    }
  }

  for (let ratio = PDF_BODY_LINE_RATIO - 0.03; ratio >= PDF_BODY_MIN_LINE_RATIO - 0.001; ratio -= 0.03) {
    const roundedRatio = Math.round(ratio * 100) / 100;
    if (measureTopicBodyHeight(pdf, topic, layout.contentWidth, PDF_BODY_MIN_FONT_SIZE, roundedRatio) <= bodyCapacity) {
      return { fontSize: PDF_BODY_MIN_FONT_SIZE, lineRatio: roundedRatio, fits: true };
    }
  }

  return { fontSize: PDF_BODY_MIN_FONT_SIZE, lineRatio: PDF_BODY_MIN_LINE_RATIO, fits: false };
}

function renderTopicOnPage({ pdf, topic, layout, fit, onOverflowPage }) {
  const navy = [30, 58, 95];
  const gold = [201, 168, 76];
  let y = layout.contentTop;
  let activeLayout = layout;

  if (topic.heading) {
    setTitleFont(pdf);
    pdf.setTextColor(...navy);
    const headingLines = wrapText(pdf, topic.heading, activeLayout.contentWidth, 'título de tópico');
    for (const line of headingLines) {
      y += PDF_HEADING_LINE_HEIGHT;
      pdf.text(line, activeLayout.marginLeft, y - PDF_HEADING_LINE_HEIGHT * 0.28, { baseline: 'alphabetic' });
    }
    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.8);
    pdf.line(activeLayout.marginLeft, y + PDF_HEADING_RULE_GAP - 3, activeLayout.marginLeft + 64, y + PDF_HEADING_RULE_GAP - 3);
    y += PDF_HEADING_RULE_GAP + PDF_HEADING_AFTER_GAP;
  }

  const lineHeight = fit.fontSize * fit.lineRatio;
  setBodyFont(pdf, fit.fontSize);
  pdf.setTextColor(38, 52, 64);

  for (let index = 0; index < topic.paragraphs.length; index += 1) {
    const lines = wrapText(pdf, topic.paragraphs[index], activeLayout.contentWidth, 'corpo');
    for (const line of lines) {
      if (y + lineHeight > activeLayout.contentBottom) {
        // Salvaguarda: se mesmo no ajuste mínimo o tópico não coube, continua
        // em nova página em vez de cortar conteúdo.
        activeLayout = onOverflowPage();
        y = activeLayout.contentTop;
        setBodyFont(pdf, fit.fontSize);
        pdf.setTextColor(38, 52, 64);
      }
      pdf.text(line, activeLayout.marginLeft, y + lineHeight * 0.72, { baseline: 'alphabetic' });
      y += lineHeight;
    }
    if (index < topic.paragraphs.length - 1) y += PDF_PARAGRAPH_GAP;
  }
}

const getTopicPreviewTitle = (topic, index) => {
  if (topic.heading) return normalizeExtractedApostilaText(topic.heading).replace(/\s+/g, ' ').trim();
  return `Introdução do capítulo (tópico ${index + 1})`;
};

export default function ApostilaPrintModal({ lesson, chapterTitle, onClose }) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    const printableText = htmlToPrintableText(lesson.content || '');
    setTopics(groupParagraphsIntoTopics(getPrintableParagraphs(printableText)));
  }, [lesson.content]);

  const safeName = useMemo(() => (lesson.title || 'aula')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase(), [lesson.title]);

  const handleExportPdf = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PDF_PAGE_WIDTH_PT, PDF_PAGE_HEIGHT_PT], putOnlyUsedFonts: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const logoDataUrl = await imageUrlToDataUrl(WR_CERTIFICATE_LOGO);

      pdf.setProperties({
        title: `${lesson.title || 'Aula da apostila'} — ${chapterTitle || 'Apostila'}`,
        subject: 'Apostila de estudos em PDF A4 retrato — um tópico por página',
        creator: 'WR EduConnect',
      });

      let activePageNumber = 1;
      const drawFrame = () => {
        drawApostilaPdfPageFrame({ pdf, pageWidth, pageHeight, logoDataUrl, lessonTitle: lesson.title, chapterTitle, pageNumber: activePageNumber });
        return createApostilaPdfLayout(pageWidth, pageHeight, activePageNumber);
      };
      const addContinuationPage = () => {
        pdf.addPage('a4', 'portrait');
        activePageNumber += 1;
        return drawFrame();
      };

      let layout = drawFrame();

      if (!topics.length) {
        setBodyFont(pdf);
        pdf.setTextColor(38, 52, 64);
        wrapText(pdf, 'Esta aula ainda não possui conteúdo para exportar.', layout.contentWidth, 'mensagem vazia')
          .forEach((line, lineIndex) => pdf.text(line, layout.marginLeft, layout.contentTop + lineIndex * PDF_BODY_LINE_RATIO * PDF_BODY_FONT_SIZE));
      } else {
        for (let index = 0; index < topics.length; index += 1) {
          if (index > 0) layout = addContinuationPage();
          const topic = topics[index];
          const fit = fitTopicToPage(pdf, topic, layout);
          renderTopicOnPage({ pdf, topic, layout, fit, onOverflowPage: addContinuationPage });
        }
      }

      const total = pdf.getNumberOfPages();
      for (let i = 1; i <= total; i += 1) {
        pdf.setPage(i);
        drawApostilaPdfFooter({ pdf, pageWidth, pageHeight, pageNumber: i, totalPages: total });
      }

      pdf.save(`apostila-${safeName}-a4-retrato.pdf`);
      toast.success('PDF exportado: um tópico por página, sem quebras no meio do tópico.');
    } catch (e) {
      toast.error('Erro ao exportar PDF: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-emerald-500/30 bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Versão impressa em PDF</h2>
              <p className="text-xs text-muted-foreground">A4 retrato · layout profissional · um tópico por página</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-sm font-bold text-foreground leading-tight">{lesson.title || 'Aula da apostila'}</p>
            <p className="text-xs text-muted-foreground mt-1">{chapterTitle || 'Apostila'}</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            Cada tópico do capítulo ocupa exatamente uma página do PDF: começa no topo da página e o texto é
            ajustado automaticamente para terminar antes da quebra — inclusive o último tópico. A exportação em
            PNG foi descontinuada; a impressão acontece somente pelo PDF.
          </div>

          {topics.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Páginas do PDF</p>
              <ul className="space-y-1">
                {topics.map((topic, index) => (
                  <li key={index} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/10 px-3 py-2 text-xs text-foreground/90">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 font-bold text-emerald-500">{index + 1}</span>
                    <span className="truncate">{getTopicPreviewTitle(topic, index)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              <BookOpen size={14} /> Esta aula ainda não possui conteúdo para exportar.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportPdf}
              disabled={loading || !topics.length}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Baixar PDF (A4 retrato)
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/30 px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
