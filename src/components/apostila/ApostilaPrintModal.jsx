import React, { useEffect, useRef, useState } from 'react';
import { X, Printer, Loader2, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

// ─── Background (new, exact pixel spec) ──────────────────────────────────────
const APOSTILA_BG = 'https://media.base44.com/images/public/69f55577840a3c93cee191be/b553e29d9_Fundo_Apostila.png';

// Full image canvas (px)
const IMG_W = 2250;
const IMG_H = 1591;

// Grey content square
const SQUARE_W    = 2168;
const SQUARE_H    = 1178;
const SQUARE_LEFT = 41;   // (2250 - 2168) / 2
const SQUARE_TOP  = 207;  // (1591 - 1178) / 2

// "APOSTILA DE ESTUDOS" baked into BG ends at ~282px from image top.
// We add a small title block (lesson name + chapter + divider) in a 72px zone.
const HEADER_ZONE_H = 72;
const CONTENT_TOP   = SQUARE_TOP + HEADER_ZONE_H; // 279

// Content area height (usable for text)
const CONTENT_H = SQUARE_H - HEADER_ZONE_H; // 1106px

// ── Two columns with 10% central gap ─────────────────────────────────────────
// Total usable width inside square (minus 31px inner margin each side)
const INNER_MARGIN   = 31;
const USABLE_W       = SQUARE_W - INNER_MARGIN * 2; // 2106px
const CENTER_GAP     = Math.round(USABLE_W * 0.10);  // 10% = ~211px
const COL_W          = Math.round((USABLE_W - CENTER_GAP) / 2); // ~948px
const COL_LEFT_X     = SQUARE_LEFT + INNER_MARGIN;          // 72
const COL_RIGHT_X    = COL_LEFT_X + COL_W + CENTER_GAP;    // 72 + 948 + 211 = 1231

// Typography tuned to COL_W≈948 at IMG_W=2250
const FONT_SIZE   = 18;    // px
const LINE_HEIGHT = 1.85;
const LINE_PX     = Math.round(FONT_SIZE * LINE_HEIGHT); // ~33px
const MAX_LINES   = 20;
// Max chars per column: ~20 lines at ~52 chars/line (18px Georgia, col 948px)
const CHARS_PER_LINE = Math.floor(COL_W / (FONT_SIZE * 0.515)); // ~102
const MAX_CHARS_PER_COL = CHARS_PER_LINE * MAX_LINES; // ~2040  (≥1700 spec)

// Each page shows exactly 2 topics side-by-side (1 per column)
// paginateTopics splits lesson.content into topics of ~1700 chars each
// and pairs them: [[topic0, topic1], [topic2, topic3], [topic4, topic5]]

/**
 * Split content into 6 topics of ≥1700 chars, preserving paragraph breaks.
 * Returns array of strings (up to 6).
 */
function splitIntoTopics(content, targetChars = 1700) {
  if (!content || !content.trim()) {
    return Array(6).fill('Conteúdo desta aula será disponibilizado em breve.');
  }

  // Split by double-newline (paragraphs) or by topic headings (numbered / bolded lines)
  const paragraphs = content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

  // Try to form 6 chunks of roughly equal size
  const totalChars = content.replace(/\s+/g, ' ').length;
  const chunkSize  = Math.max(targetChars, Math.ceil(totalChars / 6));

  const topics = [];
  let current  = '';

  for (const para of paragraphs) {
    const candidate = current ? current + '\n\n' + para : para;
    // Start a new topic when we've accumulated enough and haven't hit 6 yet
    if (current.length >= chunkSize && topics.length < 5) {
      topics.push(current.trim());
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) topics.push(current.trim());

  // Ensure exactly 6 topics (pad or merge)
  while (topics.length < 6) topics.push('');
  // If we ended up with more than 6, merge excess into topic 6
  if (topics.length > 6) {
    const extra = topics.splice(6);
    topics[5] = topics[5] + '\n\n' + extra.join('\n\n');
  }

  return topics;
}

// ─── Single page (2 topics side by side) ─────────────────────────────────────
const ApostilaPage = React.forwardRef(function ApostilaPage(
  { lesson, chapterTitle, topicLeft, topicRight, pageNum, totalPages },
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
      }}
    >
      {/* Full-bleed background — objectFit:fill keeps exact pixel alignment */}
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

      {/* ── Header block (inside grey square, above text) ── */}
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

      {/* ── Left column (topic A) ── */}
      <div style={{
        position: 'absolute',
        top: CONTENT_TOP,
        left: COL_LEFT_X,
        width: COL_W,
        height: CONTENT_H,
        overflow: 'hidden',
        zIndex: 2,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        color: '#1a2d5a',
        textAlign: 'justify',
        letterSpacing: 0.3,
        hyphens: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {topicLeft || ''}
      </div>

      {/* ── Right column (topic B) ── */}
      <div style={{
        position: 'absolute',
        top: CONTENT_TOP,
        left: COL_RIGHT_X,
        width: COL_W,
        height: CONTENT_H,
        overflow: 'hidden',
        zIndex: 2,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        color: '#1a2d5a',
        textAlign: 'justify',
        letterSpacing: 0.3,
        hyphens: 'auto',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}>
        {topicRight || ''}
      </div>

      {/* ── Page indicator ── */}
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
  // 6 topics → 3 pages
  const [topics, setTopics] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  // 3 refs, one per page
  const pageRefs = useRef([React.createRef(), React.createRef(), React.createRef()]);

  useEffect(() => {
    setTopics(splitIntoTopics(lesson.content));
    setCurrentPage(0);
  }, [lesson.content]);

  // Pages: [[t0,t1], [t2,t3], [t4,t5]]
  const pages = [
    [topics[0] || '', topics[1] || ''],
    [topics[2] || '', topics[3] || ''],
    [topics[4] || '', topics[5] || ''],
  ];
  const totalPages = 3;

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
    const canvas = await html2canvas(node, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
      width: IMG_W,
      height: IMG_H,
      backgroundColor: '#fff',
    });
    return canvas;
  };

  // Export current page as PNG (pixel-perfect, exactly what's visible)
  const handleExportPng = async () => {
    setLoading(true);
    try {
      const node = pageRefs.current[currentPage]?.current;
      if (!node) { toast.error('Página não encontrada.'); return; }
      const canvas = await captureNode(node);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = (lesson.title || 'aula')
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();
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

  // Export all 3 pages as PNGs (sequentially)
  const handleExportAllPng = async () => {
    setLoading(true);
    try {
      const safeName = (lesson.title || 'aula')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '-').toLowerCase();

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
            setTimeout(resolve, 400); // small delay between downloads
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

  // Visual preview scale
  const SCALE = Math.min(0.40, (typeof window !== 'undefined' ? window.innerWidth * 0.86 : 900) / IMG_W);

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

        {/* Page nav */}
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

        {/* PNG exports */}
        <button
          onClick={handleExportPng}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
          PNG (esta pág.)
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

      {/* Preview — current page */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ width: IMG_W * SCALE, height: IMG_H * SCALE, flexShrink: 0 }}
      >
        <div style={{ width: IMG_W, height: IMG_H, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>
          <ApostilaPage
            lesson={lesson}
            chapterTitle={chapterTitle}
            topicLeft={pages[currentPage][0]}
            topicRight={pages[currentPage][1]}
            pageNum={currentPage + 1}
            totalPages={totalPages}
            ref={pageRefs.current[currentPage]}
          />
        </div>
      </div>

      {/* Hidden pages for capture — all 3 always mounted */}
      <div style={{ position: 'fixed', top: -99999, left: -99999, pointerEvents: 'none', zIndex: -1 }}>
        {pages.map((pair, i) =>
          i !== currentPage ? (
            <ApostilaPage
              key={i}
              lesson={lesson}
              chapterTitle={chapterTitle}
              topicLeft={pair[0]}
              topicRight={pair[1]}
              pageNum={i + 1}
              totalPages={totalPages}
              ref={pageRefs.current[i]}
            />
          ) : null
        )}
      </div>
    </div>
  );
}