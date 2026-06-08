import React, { useEffect, useRef, useState } from 'react';
import { X, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

// ─── Background & geometry (exact pixel specification) ───────────────────────
const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/ac615f227_Fundo_Apostila.png';

const IMG_W = 2250;
const IMG_H = 1591;

// Grey content square
const SQUARE_LEFT = 41;
const SQUARE_TOP  = 207;
const SQUARE_W    = 2168;
const SQUARE_H    = 1178;

// Content starts below the "APOSTILA DE ESTUDOS" heading baked into the BG
// Heading top ≈235, height 47 → bottom 282, +18 safety = 300
const CONTENT_TOP_Y = 300;

// 10% centre gap between columns
// Total usable width inside square = 2168 - 2*31 (inner margins) = 2106
const INNER_MARGIN = 31;
const USABLE_W     = SQUARE_W - 2 * INNER_MARGIN;           // 2106
const CENTER_GAP   = Math.round(USABLE_W * 0.10);           // ~211px  (10%)
const COL_W        = Math.round((USABLE_W - CENTER_GAP) / 2); // ~947px each
const COL_LEFT_X   = SQUARE_LEFT + INNER_MARGIN;             // 72
const COL_RIGHT_X  = COL_LEFT_X + COL_W + CENTER_GAP;       // 72 + 947 + 211 = 1230
const COL_H        = SQUARE_TOP + SQUARE_H - CONTENT_TOP_Y; // 207+1178-300=1085

// Typography tuned for COL_W≈947
const FONT_SIZE   = 16;
const LINE_HEIGHT = 1.85;

// ─── Split lesson content into exactly 6 topics ──────────────────────────────
// Topics are separated by numbered headings like "1.", "2.", etc.
function splitIntoTopics(content) {
  if (!content || !content.trim()) {
    return Array(6).fill('Conteúdo ainda não disponível.');
  }
  // Split on lines that start with a digit + dot (topic headers)
  const raw = content.split(/\n(?=\d+\.)/g).map(s => s.trim()).filter(Boolean);
  // Pad to exactly 6 (or trim if more)
  while (raw.length < 6) raw.push('');
  return raw.slice(0, 6);
}

// ─── Single page: two topics side by side ────────────────────────────────────
function ApostilaPage({ lesson, chapterTitle, topicLeft, topicRight, pageNum, totalPages, pageRef }) {
  return (
    <div
      ref={pageRef}
      style={{
        position: 'relative',
        width: IMG_W,
        height: IMG_H,
        overflow: 'hidden',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      {/* Background */}
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

      {/* Lesson title inside grey square */}
      <div style={{
        position: 'absolute',
        top: SQUARE_TOP + 8,
        left: SQUARE_LEFT,
        width: SQUARE_W,
        zIndex: 2,
        textAlign: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: 20,
          fontWeight: 700,
          color: '#1a2d5a',
          letterSpacing: 2,
          textTransform: 'uppercase',
          lineHeight: 1.3,
        }}>
          {lesson.title}
          {pageNum > 1 && (
            <span style={{ fontSize: 13, fontWeight: 400, color: '#7a6a3a', marginLeft: 12 }}>
              · Página {pageNum}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontSize: 12,
          color: '#7a6a3a',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginTop: 3,
        }}>
          {chapterTitle}
        </div>
        <div style={{ width: 80, height: 2, background: '#c9a84c', margin: '5px auto 0' }} />
      </div>

      {/* ── Left column (topic) ── */}
      <div style={{
        position: 'absolute',
        top: CONTENT_TOP_Y,
        left: COL_LEFT_X,
        width: COL_W,
        height: COL_H,
        overflow: 'hidden',
        zIndex: 2,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        color: '#1a2d5a',
        textAlign: 'justify',
        letterSpacing: 0.2,
        hyphens: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {topicLeft}
      </div>

      {/* ── Right column (topic) ── */}
      <div style={{
        position: 'absolute',
        top: CONTENT_TOP_Y,
        left: COL_RIGHT_X,
        width: COL_W,
        height: COL_H,
        overflow: 'hidden',
        zIndex: 2,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        color: '#1a2d5a',
        textAlign: 'justify',
        letterSpacing: 0.2,
        hyphens: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {topicRight}
      </div>

      {/* Page indicator */}
      <div style={{
        position: 'absolute',
        bottom: 38,
        right: SQUARE_LEFT + 28,
        zIndex: 3,
        fontFamily: 'Georgia, serif',
        fontSize: 11,
        color: '#7a6a3a',
        letterSpacing: 1,
      }}>
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export default function ApostilaPrintModal({ lesson, chapterTitle, onClose }) {
  // topics[0..5] → 6 topics → 3 pages (pairs: 0+1, 2+3, 4+5)
  const [topics, setTopics]   = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageRefs = useRef([]);

  useEffect(() => {
    const t = splitIntoTopics(lesson.content);
    setTopics(t);
    setCurrentPage(0);
    // 3 pages
    pageRefs.current = [React.createRef(), React.createRef(), React.createRef()];
  }, [lesson.content]);

  const totalPages = 3;

  // Pair for each page: page 0 → topics 0+1, page 1 → topics 2+3, page 2 → topics 4+5
  const getTopicPair = (pageIdx) => [
    topics[pageIdx * 2] || '',
    topics[pageIdx * 2 + 1] || '',
  ];

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
    return html2canvas(node, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
      width: IMG_W,
      height: IMG_H,
      backgroundColor: '#fff',
    });
  };

  // Export current page as PNG
  const handleExportPng = async () => {
    const node = pageRefs.current[currentPage]?.current;
    if (!node) return;
    setLoading(true);
    try {
      const canvas = await captureNode(node);
      const safeName = (lesson.title || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `apostila-${safeName}-p${currentPage + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Página ${currentPage + 1} salva como PNG!`);
    } catch (e) {
      toast.error('Erro ao gerar PNG: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // Export all 3 pages as individual PNGs
  const handleExportAll = async () => {
    setLoading(true);
    try {
      // ensure all hidden nodes exist by briefly showing them — they're always mounted
      const allRefs = pageRefs.current.map(r => r?.current).filter(Boolean);
      const safeName = (lesson.title || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

      for (let i = 0; i < allRefs.length; i++) {
        const canvas = await captureNode(allRefs[i]);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `apostila-${safeName}-p${i + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // small delay between downloads so browser doesn't block
        await new Promise(r => setTimeout(r, 400));
      }
      toast.success('3 imagens PNG salvas!');
    } catch (e) {
      toast.error('Erro: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const PREVIEW_SCALE = Math.min(0.40, (window.innerWidth * 0.86) / IMG_W);

  const [topL, topR] = getTopicPair(currentPage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/82 backdrop-blur-sm p-3">
      {/* Controls */}
      <div
        className="flex items-center gap-2 mb-3 w-full flex-wrap"
        style={{ maxWidth: IMG_W * PREVIEW_SCALE + 40 }}
      >
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors shrink-0">
          <X size={15} /> Fechar
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 transition"
          >
            <ChevronLeft size={15} className="text-white" />
          </button>
          <span className="text-white/70 text-sm min-w-[100px] text-center">
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
          onClick={handleExportPng}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-60 transition-colors shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          PNG desta página
        </button>

        <button
          onClick={handleExportAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          Baixar 3 PNGs
        </button>
      </div>

      {/* Preview — current page, pixel-perfect scaled */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ width: IMG_W * PREVIEW_SCALE, height: IMG_H * PREVIEW_SCALE, flexShrink: 0 }}
      >
        <div style={{ width: IMG_W, height: IMG_H, transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
          {topics.length > 0 && (
            <ApostilaPage
              lesson={lesson}
              chapterTitle={chapterTitle}
              topicLeft={topL}
              topicRight={topR}
              pageNum={currentPage + 1}
              totalPages={totalPages}
              pageRef={pageRefs.current[currentPage]}
            />
          )}
        </div>
      </div>

      {/* Hidden pages for capture (all 3 always mounted) */}
      <div style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none', zIndex: -1 }}>
        {[0, 1, 2].map(i => {
          if (i === currentPage) return null;
          const [tL, tR] = getTopicPair(i);
          return (
            <ApostilaPage
              key={i}
              lesson={lesson}
              chapterTitle={chapterTitle}
              topicLeft={tL}
              topicRight={tR}
              pageNum={i + 1}
              totalPages={totalPages}
              pageRef={pageRefs.current[i]}
            />
          );
        })}
      </div>
    </div>
  );
}