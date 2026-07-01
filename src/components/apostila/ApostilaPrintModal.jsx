import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Printer, Loader2, ChevronLeft, ChevronRight, Image, Move, RotateCcw, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { BRAND_CNPJ, BRAND_LEGAL_NAME, WR_CERTIFICATE_LOGO, formatDocumentIssuer } from '@/lib/brand';

// ─── Background ───────────────────────────────────────────────────────────────
const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/b553e29d9_Fundo_Apostila.png';

const IMG_W = 2250;
const IMG_H = 1591;

const SQUARE_W    = 2168;
const SQUARE_H    = 1178;
const SQUARE_LEFT = 41;
const SQUARE_TOP  = 207;

const HEADER_ZONE_H = 72;
const LINE_SHIFT    = Math.round(18 * 1.85); // ~33px — one line up
const CONTENT_TOP   = SQUARE_TOP + HEADER_ZONE_H - LINE_SHIFT;
const CONTENT_H     = SQUARE_H - HEADER_ZONE_H + LINE_SHIFT;

const INNER_MARGIN = 31;
const USABLE_W     = SQUARE_W - INNER_MARGIN * 2;
const CENTER_GAP   = Math.round(USABLE_W * 0.10);
const COL_W        = Math.round((USABLE_W - CENTER_GAP) / 2);
const COL_LEFT_X   = SQUARE_LEFT + INNER_MARGIN;
const COL_RIGHT_X  = COL_LEFT_X + COL_W + CENTER_GAP;

const FONT_SIZE   = 18;
const LINE_HEIGHT = 1.85;
const TOPIC_TARGET_CHARS = 2500;

const PDF_PAGE_WIDTH_PT = 595.28;
const PDF_PAGE_HEIGHT_PT = 841.89;
const PDF_MARGIN_LEFT = 52;
const PDF_MARGIN_RIGHT = 52;
const PDF_FRAME_MARGIN = 22;
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH_PT - PDF_MARGIN_LEFT - PDF_MARGIN_RIGHT;
const PDF_BODY_FONT_SIZE = 11;
const PDF_BODY_LINE_HEIGHT = PDF_BODY_FONT_SIZE * 1.4;
const PDF_PARAGRAPH_GAP = 7;
const PDF_HEADING_FONT_SIZE = 13.5;
const PDF_HEADING_LINE_HEIGHT = PDF_HEADING_FONT_SIZE * 1.35;
const PDF_HEADING_BEFORE_GAP = 15;
const PDF_HEADING_AFTER_GAP = 8;
const PDF_FOOTER_FONT_SIZE = 7.4;

const HIGHLIGHT_TERMS = [
  'padrão comportamental',
  'comportamento',
  'ambiente',
  'reforço',
  'função',
];

const stripUnsafePrintCharacters = (value = '') => String(value)
  // Keep line breaks and tabs, but remove binary/control characters that can be
  // emitted by the PDF text renderer as visible percent-control artifacts.
  .replace(/^[^\p{L}\p{N}<#*]+(?=\s*(?:=====\s*Page|\d+[.)]|[A-ZÁÉÍÓÚÂÊÔÃÕÇ]))/gmu, '')
  .replace(/^\s*=====\s*Page\s*\d+\s*=====\s*$/gmi, '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
  .replace(/\u00AD/g, '')
  .replace(/[\u200B-\u200D\uFEFF]/g, '');

const repairSpacedLetters = (value = '') => String(value).replace(
  /(?<![\p{L}])(?:[\p{L}]\s+){2,}[\p{L}](?![\p{L}])/gu,
  (match) => match.replace(/\s+/g, '')
);

const normalizeExtractedApostilaText = (value = '') => repairSpacedLetters(stripUnsafePrintCharacters(value))
  .replace(/\r\n?/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const POSITIONS_KEY = 'wr_apostila_print_layout_positions_v2';
const LEGACY_TEXT_POSITION_KEY = 'wr_apostila_print_text_position_v1';
const DEFAULT_LAYER_POSITION = { x: 0, y: 0 };
const DEFAULT_POSITIONS = {
  title: { ...DEFAULT_LAYER_POSITION },
  text: { ...DEFAULT_LAYER_POSITION },
};

function normalizePosition(value) {
  return {
    x: Number.isFinite(value?.x) ? value.x : 0,
    y: Number.isFinite(value?.y) ? value.y : 0,
  };
}

function loadPrintPositions() {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        title: normalizePosition(parsed.title),
        text: normalizePosition(parsed.text),
      };
    }

    const legacyTextPosition = localStorage.getItem(LEGACY_TEXT_POSITION_KEY);
    if (legacyTextPosition) {
      return {
        ...DEFAULT_POSITIONS,
        text: normalizePosition(JSON.parse(legacyTextPosition)),
      };
    }
  } catch {}
  return {
    title: { ...DEFAULT_LAYER_POSITION },
    text: { ...DEFAULT_LAYER_POSITION },
  };
}

function savePrintPositions(positions) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify({
    title: normalizePosition(positions.title),
    text: normalizePosition(positions.text),
  }));
}

function DraggableTextLayer({ position, editMode, onMove, zIndex = 2, children }) {
  const layerRef = useRef(null);
  const dragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPosition = useRef(position);

  const onMouseDown = useCallback((e) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPosition.current = position;

    const onMouseMove = (me) => {
      if (!dragging.current) return;
      const rect = layerRef.current?.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = IMG_W / rect.width;
      const scaleY = IMG_H / rect.height;
      onMove({
        x: Math.round(startPosition.current.x + (me.clientX - startMouse.current.x) * scaleX),
        y: Math.round(startPosition.current.y + (me.clientY - startMouse.current.y) * scaleY),
      });
    };
    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [editMode, onMove, position]);

  return (
    <div
      ref={layerRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex,
        cursor: editMode ? 'grab' : 'default',
        outline: editMode ? '3px dashed rgba(16, 185, 129, 0.85)' : 'none',
        outlineOffset: -CONTENT_TOP,
        userSelect: editMode ? 'none' : 'auto',
      }}
    >
      {children}
    </div>
  );
}

// ─── Split content into 6 topics ─────────────────────────────────────────────
const isHtmlContent = (value = '') => /<[^>]+>/.test(value);

const plainTextToHtml = (value = '') => value
  .split(/\n{2,}/)
  .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
  .join('');

const getVisibleText = (value = '') => value
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const visibleCharCount = (value = '') => getVisibleText(value).length;

function normalizeTopicContent(topic) {
  return topic?.trim() || '';
}

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const applyInlineHighlights = (html = '') => HIGHLIGHT_TERMS.reduce((current, term) => {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return current.replace(new RegExp(`\\b(${escapedTerm})\\b`, 'giu'), '<strong>$1</strong>');
}, html);

const formatPlainTopic = (value = '') => normalizeExtractedApostilaText(value)
  .split(/\n{2,}/)
  .map((paragraph) => paragraph.trim())
  .filter(Boolean)
  .map((paragraph, index) => {
    const escaped = applyInlineHighlights(escapeHtml(paragraph).replace(/\n/g, '<br>'));
    const isNumberedHeading = /^\d+[.)]\s+/.test(paragraph);
    const tag = index === 0 && isNumberedHeading ? 'h2' : 'p';
    return `<${tag}>${escaped}</${tag}>`;
  })
  .join('');

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

  return stripUnsafePrintCharacters(decodeHtmlEntities(withBreaks))
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
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

function setBodyFont(pdf) {
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(PDF_BODY_FONT_SIZE);
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

function splitLongWordSafely(pdf, word, maxWidth) {
  const chunks = [];
  let chunk = '';
  for (const char of String(word)) {
    const candidate = `${chunk}${char}`;
    if (chunk && pdf.getTextWidth(candidate) > maxWidth) {
      chunks.push(chunk);
      chunk = char;
    } else {
      chunk = candidate;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
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

    const words = line.split(/\s+/).filter(Boolean);
    let current = '';
    for (const word of words) {
      if (pdf.getTextWidth(word) > maxWidth) {
        if (current) {
          safeLines.push(current);
          current = '';
        }
        safeLines.push(...splitLongWordSafely(pdf, word, maxWidth));
        continue;
      }
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

function getBlockHeight(lines, lineHeight) {
  return lines.length * lineHeight;
}

function ensureFits(pdf, cursor, layout, height, onPageBreak) {
  if (cursor.y + height <= layout.contentBottom) return cursor;
  pdf.addPage('a4', 'portrait');
  onPageBreak?.();
  return { y: layout.contentTop };
}

function getSingleLineFittingText(pdf, text, maxWidth, context) {
  const source = normalizeExtractedApostilaText(text).replace(/[ \t]+/g, ' ').trim();
  if (!source || pdf.getTextWidth(source) <= maxWidth) {
    if (source) assertNoOverflow(pdf, source, maxWidth, context);
    return source;
  }
  const ellipsis = '…';
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
  const headerHeight = isFirstPage ? 150 : 62;
  const footerHeight = 50;
  return {
    pageWidth,
    pageHeight,
    marginLeft: PDF_MARGIN_LEFT,
    marginRight: PDF_MARGIN_RIGHT,
    contentWidth: pageWidth - PDF_MARGIN_LEFT - PDF_MARGIN_RIGHT,
    pageTop: PDF_FRAME_MARGIN,
    headerHeight,
    footerHeight,
    contentTop: PDF_FRAME_MARGIN + headerHeight,
    contentBottom: pageHeight - PDF_FRAME_MARGIN - footerHeight,
    footerY: pageHeight - 35,
    lineHeight: PDF_BODY_LINE_HEIGHT,
    paragraphGap: PDF_PARAGRAPH_GAP,
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
    if (logoDataUrl) pdf.addImage(logoDataUrl, 'PNG', layout.marginLeft, 34, 34, 34, undefined, 'FAST');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...navy);
    wrapText(pdf, BRAND_LEGAL_NAME, layout.contentWidth - 88, 'cabeçalho institucional').forEach((line, index) => {
      pdf.text(line, centerX, 40 + index * 11.5, { align: 'center' });
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.setTextColor(136, 136, 136);
    pdf.text('Terapia · Educação · Desenvolvimento Pessoal', centerX, 62, { align: 'center' });

    pdf.setDrawColor(...navy);
    pdf.setLineWidth(0.35);
    pdf.line(layout.marginLeft, 82, pageWidth - layout.marginRight, 82);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(122, 106, 58);
    pdf.text('APOSTILA DE ESTUDOS', centerX, 96, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(...navy);
    wrapText(pdf, lessonTitle || 'Aula da apostila', layout.contentWidth, 'título da aula').slice(0, 2).forEach((line, index) => {
      pdf.text(line, centerX, 113 + index * 16, { align: 'center' });
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(122, 106, 58);
    const chapter = getSingleLineFittingText(pdf, chapterTitle || 'Apostila', layout.contentWidth, 'módulo no cabeçalho');
    pdf.text(chapter, centerX, 146, { align: 'center' });
    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.6);
    pdf.line(centerX - 42, 158, centerX + 42, 158);
    return;
  }

  if (logoDataUrl) pdf.addImage(logoDataUrl, 'PNG', layout.marginLeft, 32, 20, 20, undefined, 'FAST');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.6);
  pdf.setTextColor(...navy);
  pdf.text(getSingleLineFittingText(pdf, BRAND_LEGAL_NAME, 245, 'cabeçalho compacto institucional'), layout.marginLeft + 27, 43);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(122, 106, 58);
  const shortTitle = getSingleLineFittingText(pdf, lessonTitle || 'Aula da apostila', 190, 'cabeçalho compacto título');
  pdf.text(shortTitle, pageWidth - layout.marginRight, 43, { align: 'right' });
  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.3);
  pdf.line(layout.marginLeft, 62, pageWidth - layout.marginRight, 62);
}

function drawApostilaPdfFooter({ pdf, pageWidth, pageHeight, pageNumber, totalPages }) {
  const layout = createApostilaPdfLayout(pageWidth, pageHeight, pageNumber);
  const footerY = layout.footerY;
  const pageText = `Página ${pageNumber} de ${totalPages}`;
  const pageTextWidth = pdf.getTextWidth(pageText);
  const leftMaxWidth = layout.contentWidth - pageTextWidth - 18;

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.25);
  pdf.line(layout.marginLeft, footerY - 13, pageWidth - layout.marginRight, footerY - 13);
  setFooterFont(pdf);
  pdf.setTextColor(120, 126, 138);
  const issuer = getSingleLineFittingText(pdf, formatDocumentIssuer(), leftMaxWidth, 'rodapé institucional')
    || getSingleLineFittingText(pdf, `Documento emitido digitalmente pela WR-EDU · CNPJ ${BRAND_CNPJ}`, leftMaxWidth, 'rodapé institucional curto');
  pdf.text(issuer, layout.marginLeft, footerY);
  assertNoOverflow(pdf, pageText, pageTextWidth, 'numeração do rodapé');
  pdf.text(pageText, pageWidth - layout.marginRight, footerY, { align: 'right' });
}

function isApostilaPdfTopicHeading(paragraph) {
  const cleanParagraph = normalizeExtractedApostilaText(paragraph).replace(/[ \t]+/g, ' ').trim();
  return /^\d+[.)]\s+/.test(cleanParagraph) || /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ,:;—–-]{18,}$/.test(cleanParagraph);
}

function getParagraphPdfMetrics({ pdf, paragraph, layout, isHeading = isApostilaPdfTopicHeading(paragraph) }) {
  const cleanParagraph = normalizeExtractedApostilaText(paragraph).replace(/[ \t]+/g, ' ').trim();
  if (!cleanParagraph) return { lines: [], height: 0, lineHeight: layout.lineHeight, beforeGap: 0, afterGap: 0 };
  if (isHeading) setTitleFont(pdf); else setBodyFont(pdf);
  pdf.setTextColor(isHeading ? 30 : 38, isHeading ? 58 : 52, isHeading ? 95 : 64);
  const lineHeight = isHeading ? PDF_HEADING_LINE_HEIGHT : layout.lineHeight;
  const lines = wrapText(pdf, cleanParagraph, layout.contentWidth, isHeading ? 'título de tópico' : 'corpo');
  const beforeGap = isHeading ? PDF_HEADING_BEFORE_GAP : 0;
  const afterGap = isHeading ? PDF_HEADING_AFTER_GAP : layout.paragraphGap;
  return { lines, height: beforeGap + getBlockHeight(lines, lineHeight) + afterGap, lineHeight, beforeGap, afterGap };
}

function getParagraphPdfHeight(args) {
  return getParagraphPdfMetrics(args).height;
}

function addWrappedParagraphToPdf({ pdf, paragraph, cursor, layout, onPageBreak, forcePageBreak = false }) {
  const cleanParagraph = normalizeExtractedApostilaText(paragraph).replace(/[ \t]+/g, ' ').trim();
  if (!cleanParagraph) return cursor;

  const isHeading = isApostilaPdfTopicHeading(cleanParagraph);
  const metrics = getParagraphPdfMetrics({ pdf, paragraph: cleanParagraph, layout, isHeading });
  let activeCursor = forcePageBreak
    ? ensureFits(pdf, { y: layout.contentBottom + 1 }, layout, metrics.height, onPageBreak)
    : ensureFits(pdf, cursor, layout, metrics.height, onPageBreak);
  let y = activeCursor.y + metrics.beforeGap;

  if (isHeading) setTitleFont(pdf); else setBodyFont(pdf);
  pdf.setTextColor(isHeading ? 30 : 38, isHeading ? 58 : 52, isHeading ? 95 : 64);

  for (const line of metrics.lines) {
    if (y + metrics.lineHeight > layout.contentBottom) {
      activeCursor = ensureFits(pdf, { y: layout.contentBottom + 1 }, layout, metrics.lineHeight, onPageBreak);
      y = activeCursor.y;
      if (isHeading) setTitleFont(pdf); else setBodyFont(pdf);
      pdf.setTextColor(isHeading ? 30 : 38, isHeading ? 58 : 52, isHeading ? 95 : 64);
    }
    assertNoOverflow(pdf, line, layout.contentWidth, isHeading ? 'título de tópico' : 'corpo');
    pdf.text(line, layout.marginLeft, y, { baseline: 'alphabetic' });
    y += metrics.lineHeight;
  }

  return { y: y + metrics.afterGap };
}

function splitPlainContentByNumberedTopics(content) {
  const source = normalizeExtractedApostilaText(content);
  if (!source || isHtmlContent(source)) return null;

  const matches = [...source.matchAll(/^\s*([1-6])[.)]\s+.+$/gm)];
  const sequentialMatches = matches
    .filter((match, index) => Number(match[1]) === index + 1)
    .slice(0, 6);

  if (sequentialMatches.length < 6) return null;

  return sequentialMatches.map((match, index) => {
    const start = match.index;
    const end = sequentialMatches[index + 1]?.index ?? source.length;
    return formatPlainTopic(source.slice(start, end).trim());
  });
}

function splitHtmlContentByNumberedTopics(paragraphs) {
  const topicStarts = paragraphs
    .map((paragraph, index) => ({ index, match: getVisibleText(paragraph).match(/^([1-6])[.)]\s+/) }))
    .filter(({ match }) => Boolean(match))
    .filter(({ match }, index) => Number(match[1]) === index + 1)
    .slice(0, 6);

  if (topicStarts.length < 6) return null;

  return topicStarts.map(({ index: start }, topicIndex) => {
    const end = topicStarts[topicIndex + 1]?.index ?? paragraphs.length;
    return paragraphs.slice(start, end).join('');
  });
}

function splitIntoTopics(content, targetChars = TOPIC_TARGET_CHARS) {
  if (!content || !content.trim()) {
    return Array.from({ length: 6 }, () => '');
  }

  const numberedTopics = splitPlainContentByNumberedTopics(content);
  if (numberedTopics) return numberedTopics.map((topic) => normalizeTopicContent(topic));

  const htmlContent = isHtmlContent(content) ? content : plainTextToHtml(content);
  const paragraphs = htmlContent
    .split(/(?=<\/?(?:p|h[1-6]|ul|ol|blockquote)\b)/i)
    .map(p => p.trim())
    .filter(Boolean);

  const htmlNumberedTopics = splitHtmlContentByNumberedTopics(paragraphs);
  if (htmlNumberedTopics) return htmlNumberedTopics.map((topic) => normalizeTopicContent(topic));

  const totalChars = visibleCharCount(htmlContent);
  const chunkSize  = Math.max(targetChars, Math.ceil(totalChars / 6));

  const topics = [];
  let current  = '';

  for (const para of paragraphs) {
    const candidate = current ? current + para : para;
    if (current.length >= chunkSize && topics.length < 5) {
      topics.push(current.trim());
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) topics.push(current.trim());

  while (topics.length < 6) topics.push('');
  if (topics.length > 6) {
    const extra = topics.splice(6);
    topics[5] = topics[5] + extra.join('');
  }

  return topics.map((topic) => normalizeTopicContent(topic));
}

// ─── Page component ───────────────────────────────────────────────────────────
// No transform/scale ever applied here — only raw pixel sizes
const ApostilaPage = React.forwardRef(function ApostilaPage(
  { lesson, chapterTitle, topicLeft, topicRight, pageNum, totalPages, positions = DEFAULT_POSITIONS, editMode = false, onPositionChange },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: IMG_W,
        height: IMG_H,
        overflow: 'hidden',
        background: '#fff',
        boxSizing: 'border-box',
        flexShrink: 0,
        // CRITICAL: no transform, no scale — full pixel size always
      }}
    >
      <img
        src={APOSTILA_BG}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: IMG_W, height: IMG_H,
          objectFit: 'fill',
          pointerEvents: 'none',
          zIndex: 0,
          display: 'block',
        }}
      />


      <style>{`
        .apostila-print-column h2 {
          margin: 0 0 18px;
          font-family: Arial, Verdana, sans-serif;
          font-size: 26px;
          line-height: 1.35;
          font-weight: 800;
          color: #1a2d5a;
          text-align: left;
          letter-spacing: 0;
        }
        .apostila-print-column p {
          margin: 0 0 16px;
          font-family: Arial, Verdana, sans-serif;
          font-size: ${FONT_SIZE}px;
          line-height: ${LINE_HEIGHT};
          letter-spacing: 0;
        }
        .apostila-print-column strong {
          font-weight: 800;
          color: #102348;
        }
      `}</style>

      {/* Header */}
      <DraggableTextLayer
        position={positions.title}
        editMode={editMode}
        onMove={(nextPosition) => onPositionChange?.('title', nextPosition)}
        zIndex={4}
      >
      <div style={{
        position: 'absolute',
        top: SQUARE_TOP + 4,
        left: SQUARE_LEFT,
        width: SQUARE_W,
        height: HEADER_ZONE_H - 4,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 6,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: 19,
          fontWeight: 700,
          color: '#1a2d5a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}>
          {lesson.title}
          {pageNum > 1 && (
            <span style={{ fontSize: 12, fontWeight: 400, color: '#7a6a3a', marginLeft: 12 }}>
              · Parte {pageNum}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 11,
          color: '#7a6a3a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginTop: 2,
        }}>
          {chapterTitle}
        </div>
        <div style={{ width: 80, height: 2, background: '#c9a84c', marginTop: 5 }} />
      </div>
      </DraggableTextLayer>

      <DraggableTextLayer
        position={positions.text}
        editMode={editMode}
        onMove={(nextPosition) => onPositionChange?.('text', nextPosition)}
        zIndex={2}
      >
        {/* Left column */}
        <div style={{
          position: 'absolute',
          top: CONTENT_TOP,
          left: COL_LEFT_X,
          width: COL_W,
          height: CONTENT_H,
          overflow: 'hidden',
          fontFamily: "Arial, Verdana, sans-serif",
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: '#1a2d5a',
          textAlign: 'justify',
          letterSpacing: 0,
          hyphens: 'auto',
          wordBreak: 'break-word',
        }}
        className="apostila-print-column"
        dangerouslySetInnerHTML={{ __html: topicLeft || '' }}
        />

        {/* Right column */}
        <div style={{
          position: 'absolute',
          top: CONTENT_TOP,
          left: COL_RIGHT_X,
          width: COL_W,
          height: CONTENT_H,
          overflow: 'hidden',
          fontFamily: "Arial, Verdana, sans-serif",
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: '#1a2d5a',
          textAlign: 'justify',
          letterSpacing: 0,
          hyphens: 'auto',
          wordBreak: 'break-word',
        }}
        className="apostila-print-column"
        dangerouslySetInnerHTML={{ __html: topicRight || '' }}
        />
      </DraggableTextLayer>

      {/* Page number */}
      <div style={{
        position: 'absolute',
        bottom: 38,
        right: SQUARE_LEFT + 28,
        zIndex: 3,
        fontFamily: 'Georgia, serif',
        fontSize: 12,
        color: '#7a6a3a',
        letterSpacing: 1,
      }}>
        {pageNum} / {totalPages}
      </div>
    </div>
  );
});

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function ApostilaPrintModal({ lesson, chapterTitle, onClose }) {
  const [topics, setTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [positions, setPositions] = useState(loadPrintPositions);

  // Refs for capture — always full-size, never scaled
  const pageRefs = useRef([React.createRef(), React.createRef(), React.createRef()]);

  useEffect(() => {
    setTopics(splitIntoTopics(lesson.content));
    setCurrentPage(0);
  }, [lesson.content]);

  const pages = [
    [topics[0] || '', topics[1] || ''],
    [topics[2] || '', topics[3] || ''],
    [topics[4] || '', topics[5] || ''],
  ];
  const totalPages = 3;

  const handlePositionChange = (layer, nextPosition) => {
    setPositions((current) => ({
      ...current,
      [layer]: normalizePosition(nextPosition),
    }));
  };

  const handleSavePositions = () => {
    savePrintPositions(positions);
    toast.success('Posições salvas para este modelo.');
  };

  const handleApplyPositionsToAll = () => {
    savePrintPositions(positions);
    toast.success('Posições aplicadas e salvas para todos os modelos.');
  };

  const handleResetPositions = () => {
    setPositions(DEFAULT_POSITIONS);
    savePrintPositions(DEFAULT_POSITIONS);
    toast.success('Posições redefinidas.');
  };

  // Visual scale for preview only — NOT applied to capture nodes
  const SCALE = Math.min(0.40, (typeof window !== 'undefined' ? window.innerWidth * 0.86 : 900) / IMG_W);

  const waitImages = (node) => {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(imgs.map(img =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise(res => { img.onload = res; img.onerror = res; })
    ));
  };

  const captureNode = async (node) => {
    await waitImages(node);
    // Capture at 2× for crisp background + text, then downscale to native resolution
    const hiRes = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      width: IMG_W,
      height: IMG_H,
      windowWidth: IMG_W,
      windowHeight: IMG_H,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      backgroundColor: '#fff',
      logging: false,
      imageTimeout: 15000,
    });
    // Draw back to 1× canvas so the final PNG is exactly IMG_W × IMG_H
    const out = document.createElement('canvas');
    out.width  = IMG_W;
    out.height = IMG_H;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(hiRes, 0, 0, IMG_W, IMG_H);
    return out;
  };

  const safeName = (lesson.title || 'aula')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

  const handleExportPng = async () => {
    setLoading(true);
    try {
      const node = pageRefs.current[currentPage]?.current;
      if (!node) { toast.error('Página não encontrada.'); return; }
      const canvas = await captureNode(node);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apostila-${safeName}-p${currentPage + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('PNG exportado!');
      }, 'image/png');
    } catch (e) {
      toast.error('Erro ao exportar PNG: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };


  const handleExportTextPdf = async () => {
    setLoading(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PDF_PAGE_WIDTH_PT, PDF_PAGE_HEIGHT_PT], putOnlyUsedFonts: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const logoDataUrl = await imageUrlToDataUrl(WR_CERTIFICATE_LOGO);
      let layout = createApostilaPdfLayout(pageWidth, pageHeight, 1);

      const printableText = htmlToPrintableText(normalizeExtractedApostilaText(lesson.content));
      const paragraphs = printableText.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

      pdf.setProperties({
        title: `${lesson.title || 'Aula da apostila'} — ${chapterTitle || 'Apostila'}`,
        subject: 'Apostila de estudos em PDF A4 retrato',
        creator: 'WR EduConnect',
      });

      drawApostilaPdfPageFrame({ pdf, pageWidth, pageHeight, logoDataUrl, lessonTitle: lesson.title, chapterTitle, pageNumber: 1 });
      setBodyFont(pdf);
      pdf.setTextColor(38, 52, 64);

      let activePageNumber = 1;
      let cursor = { y: layout.contentTop };
      const prepareTextPage = () => {
        activePageNumber += 1;
        layout = createApostilaPdfLayout(pageWidth, pageHeight, activePageNumber);
        drawApostilaPdfPageFrame({ pdf, pageWidth, pageHeight, logoDataUrl, lessonTitle: lesson.title, chapterTitle, pageNumber: activePageNumber });
        setBodyFont(pdf);
        pdf.setTextColor(38, 52, 64);
      };

      if (paragraphs.length === 0) {
        setBodyFont(pdf);
        const emptyLines = wrapText(pdf, 'Esta aula ainda não possui conteúdo para exportar.', layout.contentWidth, 'mensagem vazia');
        emptyLines.forEach((line, lineIndex) => pdf.text(line, layout.marginLeft, cursor.y + lineIndex * layout.lineHeight));
      } else {
        for (let index = 0; index < paragraphs.length; index += 1) {
          const paragraph = paragraphs[index];
          const isHeading = isApostilaPdfTopicHeading(paragraph);
          let forcePageBreak = false;

          if (isHeading) {
            const nextParagraph = paragraphs.slice(index + 1).find((candidate) => !isApostilaPdfTopicHeading(candidate));
            const headingAndFirstParagraphHeight = getParagraphPdfHeight({ pdf, paragraph, layout, isHeading: true })
              + (nextParagraph ? getParagraphPdfHeight({ pdf, paragraph: nextParagraph, layout, isHeading: false }) : 0);
            forcePageBreak = cursor.y + headingAndFirstParagraphHeight > layout.contentBottom;
          }

          cursor = addWrappedParagraphToPdf({ pdf, paragraph, cursor, layout, onPageBreak: prepareTextPage, forcePageBreak });
        }
      }

      const total = pdf.getNumberOfPages();
      for (let i = 1; i <= total; i += 1) {
        pdf.setPage(i);
        drawApostilaPdfFooter({ pdf, pageWidth, pageHeight, pageNumber: i, totalPages: total });
      }

      pdf.save(`apostila-${safeName}-a4-retrato.pdf`);
      toast.success('PDF A4 retrato exportado com o novo layout!');
    } catch (e) {
      toast.error('Erro ao exportar PDF: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleExportAllPng = async () => {
    setLoading(true);
    try {
      for (let i = 0; i < totalPages; i++) {
        const node = pageRefs.current[i]?.current;
        if (!node) continue;
        const canvas = await captureNode(node);
        await new Promise((resolve) => {
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `apostila-${safeName}-p${i + 1}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setTimeout(resolve, 400);
          }, 'image/png');
        });
      }
      toast.success('Todas as 3 páginas exportadas como PNG!');
    } catch (e) {
      toast.error('Erro: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/82 backdrop-blur-sm p-3">
      {/* Controls */}
      <div
        className="flex flex-wrap items-center gap-2 mb-3 w-full justify-center"
        style={{ maxWidth: IMG_W * SCALE + 40 }}
      >
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors shrink-0">
          <X size={15} /> Fechar
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronLeft size={15} className="text-white" />
          </button>
          <span className="text-white/70 text-sm min-w-[80px] text-center">
            Pág. {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronRight size={15} className="text-white" />
          </button>
        </div>

        <button
          onClick={() => setEditMode((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-bold transition-colors ${editMode ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100' : 'border-white/20 bg-white/10 text-white hover:bg-white/20'}`}
        >
          <Move size={14} /> {editMode ? 'Movendo itens' : 'Mover itens'}
        </button>
        {editMode && (
          <>
            <button
              onClick={handleSavePositions}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Save size={14} /> Salvar posições
            </button>
            <button
              onClick={handleApplyPositionsToAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
            >
              <Save size={14} /> Reposicionar para todos
            </button>
            <button
              onClick={handleResetPositions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20 transition-colors"
            >
              <RotateCcw size={14} /> Resetar
            </button>
            <span className="text-xs text-white/60">Título X: {positions.title.x}px · Y: {positions.title.y}px | Texto X: {positions.text.x}px · Y: {positions.text.y}px</span>
          </>
        )}

        <button
          onClick={handleExportPng}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
          PNG (esta pág.)
        </button>
        <button
          onClick={handleExportTextPdf}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          PDF A4 retrato
        </button>
        <button
          onClick={handleExportAllPng}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
          PNG (3 páginas)
        </button>
      </div>

      {/* ── PREVIEW ONLY — visual scale via CSS, no ref ── */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ width: IMG_W * SCALE, height: IMG_H * SCALE, flexShrink: 0 }}
      >
        <div style={{ width: IMG_W, height: IMG_H, transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: editMode ? 'auto' : 'none' }}>
          {/* Preview page — NO ref, just visual */}
          <ApostilaPage
            lesson={lesson}
            chapterTitle={chapterTitle}
            topicLeft={pages[currentPage][0]}
            topicRight={pages[currentPage][1]}
            pageNum={currentPage + 1}
            totalPages={totalPages}
            positions={positions}
            editMode={editMode}
            onPositionChange={handlePositionChange}
          />
        </div>
      </div>

      {/* ── CAPTURE NODES — full pixel size, off-screen, NO transform, WITH refs ── */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          width: IMG_W,
          pointerEvents: 'none',
          zIndex: -10,
          opacity: 0,
          // NO transform here — ever
        }}
      >
        {pages.map((pair, i) => (
          <ApostilaPage
            key={i}
            lesson={lesson}
            chapterTitle={chapterTitle}
            topicLeft={pair[0]}
            topicRight={pair[1]}
            pageNum={i + 1}
            totalPages={totalPages}
            ref={pageRefs.current[i]}
            positions={positions}
          />
        ))}
      </div>
    </div>
  );
}
