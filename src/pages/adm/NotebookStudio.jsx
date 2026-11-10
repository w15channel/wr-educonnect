import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { adminApi } from '@/lib/adminApi';
import { useCustomAuth } from '@/lib/CustomAuthContext';
import {
  Sparkles,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  ExternalLink,
  FileText,
  Video,
  Mic,
  Presentation,
  Save,
  CheckCircle2,
  Layers,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { MOD1 } from '@/lib/apostila/mod1';
import { MOD2 } from '@/lib/apostila/mod2';
import { MOD3 } from '@/lib/apostila/mod3';
import { MOD4 } from '@/lib/apostila/mod4';
import { MOD5 } from '@/lib/apostila/mod5';
import { MOD6 } from '@/lib/apostila/mod6';
import { MOD7 } from '@/lib/apostila/mod7';
import { MOD8 } from '@/lib/apostila/mod8';
import { MOD9 } from '@/lib/apostila/mod9';
import { MOD10 } from '@/lib/apostila/mod10';

import {
  generateStructuredSource,
  generatePodcastPrompt,
  generateVideoLessonScript,
  generateSlideDeckOutline,
} from '@/lib/notebookLmPackager';
import {
  downloadNotebookPackage,
  openNotebookLmOfficial,
  openGoogleDocsNew,
  copyContentToClipboard,
} from '@/lib/googleDriveExport';
import { resolveAudioStreamUrl, detectMediaProvider } from '@/lib/mediaUrlResolver';
import VideoPlayer from '@/components/video/VideoPlayer';

const ALL_MODULES = [MOD1, MOD2, MOD3, MOD4, MOD5, MOD6, MOD7, MOD8, MOD9, MOD10];
const APOSTILA_BOOK_ID = 'apostila-tcc';

export default function NotebookStudio() {
  const { session } = useCustomAuth();
  const queryClient = useQueryClient();

  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('packager'); // 'packager' | 'publisher'
  const [packagerSubTab, setPackagerSubTab] = useState('source'); // 'source' | 'podcast' | 'video' | 'slides'
  const [copiedKey, setCopiedKey] = useState(null);

  // Form states for Publication
  const [podcastUrl, setPodcastUrl] = useState('');
  const [podcastTitle, setPodcastTitle] = useState('');
  const [podcastDuration, setPodcastDuration] = useState('');
  const [podcastSynopsis, setPodcastSynopsis] = useState('');

  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [slidesUrl, setSlidesUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');

  // Audio preview for podcast
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const audioPreviewRef = useRef(null);

  const currentModule = ALL_MODULES[selectedModuleIdx] || ALL_MODULES[0];
  const currentLesson = currentModule?.lessons?.[selectedLessonIdx] || currentModule?.lessons?.[0];

  const chapterId = currentModule.id;
  const lessonId = currentLesson.id;
  const moduleNumber = selectedModuleIdx + 1;
  const lessonOrder = selectedModuleIdx * 5 + selectedLessonIdx + 1;

  const podcastProvider = useMemo(() => detectMediaProvider(podcastUrl), [podcastUrl]);
  const videoProvider = useMemo(() => detectMediaProvider(videoUrl), [videoUrl]);

  // Query existing BookChapter
  const { data: bookChapters = [], refetch: refetchBookChapter } = useQuery({
    queryKey: ['admin-book-chapter', chapterId, lessonId],
    queryFn: async () => {
      const records = await base44.entities.BookChapter.filter({
        book_id: APOSTILA_BOOK_ID,
        chapter_id: chapterId,
        lesson_id: lessonId,
      }, '-updated_date', 1);
      return records || [];
    },
  });

  // Query existing RecordedLesson
  const { data: recordedLessons = [], refetch: refetchRecordedLesson } = useQuery({
    queryKey: ['admin-recorded-lessons', chapterId, lessonId],
    queryFn: async () => {
      const records = await base44.entities.RecordedLesson.filter({
        course: 'tcc',
        apostila_chapter_id: chapterId,
        apostila_lesson_id: lessonId,
      }, '-updated_date', 1);
      return records || [];
    },
  });

  const existingChapter = bookChapters[0] || null;
  const existingVideoLesson = recordedLessons[0] || null;

  // Sync form inputs when selection or queries change
  useEffect(() => {
    if (existingChapter) {
      setPodcastUrl(existingChapter.podcast_url || '');
      setPodcastTitle(existingChapter.podcast_title || `Podcast: ${currentLesson.title}`);
      setPodcastDuration(existingChapter.podcast_duration || '12:00');
      setPodcastSynopsis(existingChapter.podcast_synopsis || '');
    } else {
      setPodcastUrl('');
      setPodcastTitle(`Podcast: ${currentLesson.title}`);
      setPodcastDuration('12:00');
      setPodcastSynopsis('');
    }

    if (existingVideoLesson) {
      setVideoUrl(existingVideoLesson.video_url || '');
      setVideoTitle(existingVideoLesson.title || currentLesson.title);
      setVideoDescription(existingVideoLesson.description || '');
      setSlidesUrl(existingVideoLesson.material_links || '');
      setVideoDuration(existingVideoLesson.duration || '30:00');
    } else {
      setVideoUrl('');
      setVideoTitle(currentLesson.title);
      setVideoDescription(`Videoaula do ${currentModule.title} abordando ${currentLesson.title}.`);
      setSlidesUrl('');
      setVideoDuration('30:00');
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setPreviewPlaying(false);
    }
  }, [existingChapter, existingVideoLesson, currentLesson, currentModule]);

  // Packaged contents
  const structuredSource = useMemo(
    () => generateStructuredSource(currentModule, currentLesson),
    [currentModule, currentLesson]
  );
  const podcastPrompt = useMemo(
    () => generatePodcastPrompt(currentModule, currentLesson),
    [currentModule, currentLesson]
  );
  const videoScript = useMemo(
    () => generateVideoLessonScript(currentModule, currentLesson),
    [currentModule, currentLesson]
  );
  const slideDeckOutline = useMemo(
    () => generateSlideDeckOutline(currentModule, currentLesson),
    [currentModule, currentLesson]
  );

  const wordCount = useMemo(() => {
    return (currentLesson.content || '').split(/\s+/).filter(Boolean).length;
  }, [currentLesson]);

  // Copy handler with visual feedback
  const handleCopy = async (key, content, label) => {
    const success = await copyContentToClipboard(content);
    if (success) {
      setCopiedKey(key);
      toast.success(`${label} copiado para a área de transferência!`);
      setTimeout(() => setCopiedKey(null), 2500);
    } else {
      toast.error('Não foi possível copiar. Selecione o texto manualmente.');
    }
  };

  // Download handler
  const handleDownloadSource = () => {
    const filename = `NotebookLM-Fonte-${chapterId}-${lessonId}.txt`;
    downloadNotebookPackage(filename, structuredSource, 'text/plain;charset=utf-8');
    toast.success(`Download iniciado: ${filename}`);
  };

  const handleDownloadPromptsPackage = () => {
    const fullPackage = `# PACOTE COMPLETO DE CONTEÚDO PARA NOTEBOOKLM
${currentModule.title} — ${currentLesson.title}

============================================================
1. FONTE DO CAPÍTULO
============================================================
${structuredSource}

============================================================
2. PROMPT MESTRE: PODCAST (AUDIO OVERVIEW)
============================================================
${podcastPrompt}

============================================================
3. ROTEIRO DE VIDEOAULA
============================================================
${videoScript}

============================================================
4. ESTRUTURA DE SLIDES POWERPOINT
============================================================
${slideDeckOutline}
`;
    const filename = `Kit-Completo-NotebookLM-${chapterId}-${lessonId}.md`;
    downloadNotebookPackage(filename, fullPackage, 'text/markdown;charset=utf-8');
    toast.success(`Download do Kit Completo iniciado: ${filename}`);
  };

  // Audio preview toggle with stream resolution and NotebookLM support
  const togglePreviewAudio = () => {
    if (!podcastUrl) {
      toast.info('Informe a URL do áudio do podcast para testar.');
      return;
    }

    if (podcastProvider.provider === 'NotebookLM') {
      window.open(podcastUrl, '_blank', 'noopener,noreferrer');
      toast.info('Abrindo podcast diretamente no Google NotebookLM...');
      return;
    }

    const resolvedStreamUrl = resolveAudioStreamUrl(podcastUrl);
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(resolvedStreamUrl);
      audioPreviewRef.current.onended = () => setPreviewPlaying(false);
      audioPreviewRef.current.onerror = () => {
        toast.error('Erro ao reproduzir o áudio. Verifique se o link possui permissão pública de acesso.');
        setPreviewPlaying(false);
      };
    } else if (audioPreviewRef.current.src !== resolvedStreamUrl) {
      audioPreviewRef.current.src = resolvedStreamUrl;
    }

    if (previewPlaying) {
      audioPreviewRef.current.pause();
      setPreviewPlaying(false);
    } else {
      audioPreviewRef.current.play()
        .then(() => setPreviewPlaying(true))
        .catch((err) => {
          toast.error(`Falha ao tocar áudio: ${err.message || 'link restrito ou bloqueado'}`);
          setPreviewPlaying(false);
        });
    }
  };

  // Local file upload handler for podcast (enviando para /api/upload-media para stream infalível)
  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading(`Enviando áudio "${file.name}" para a plataforma...`);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        const base64Data = dataUrl.split(',')[1];
        try {
          const res = await fetch('/api/upload-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              dataBase64: base64Data,
              mimeType: file.type || 'audio/mpeg',
            }),
          });
          const data = await res.json();
          if (data?.url) {
            setPodcastUrl(data.url);
            toast.success(`🎙️ Áudio salvo no servidor (${(file.size / 1024 / 1024).toFixed(1)} MB)! Pronto para tocar na apostila.`, { id: toastId });
          } else {
            throw new Error(data?.error || 'Erro no upload');
          }
        } catch {
          setPodcastUrl(dataUrl);
          toast.success(`Arquivo carregado (${(file.size / 1024 / 1024).toFixed(1)} MB).`, { id: toastId });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Mutation: Save Podcast to BookChapter (preservando o texto integral da aula)
  const savePodcastMutation = useMutation({
    mutationFn: async () => {
      if (!podcastUrl.trim()) {
        throw new Error('Informe a URL ou carregue o arquivo de áudio do podcast.');
      }

      const podcastData = {
        podcast_url: podcastUrl.trim(),
        podcast_title: podcastTitle.trim() || `Podcast: ${currentLesson.title}`,
        podcast_duration: podcastDuration.trim() || '12:00',
        podcast_synopsis: podcastSynopsis.trim(),
      };

      let result;
      if (existingChapter?.id) {
        // Atualiza cirurgicamente apenas os campos de podcast sem tocar no texto didático
        result = await adminApi.update('BookChapter', existingChapter.id, podcastData);
      } else {
        const payload = {
          book_id: APOSTILA_BOOK_ID,
          book_title: 'Apostila',
          chapter_id: chapterId,
          chapter_title: currentModule.title,
          lesson_id: lessonId,
          title: currentLesson.title,
          content: currentLesson.content || '',
          order: lessonOrder,
          ...podcastData,
        };
        result = await adminApi.create('BookChapter', payload);
      }

      // Sincroniza com RecordedLesson se já existir para este capítulo
      if (existingVideoLesson?.id) {
        await adminApi.update('RecordedLesson', existingVideoLesson.id, {
          podcast_url: podcastUrl.trim(),
          podcast_title: podcastTitle.trim(),
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-book-chapter'] });
      queryClient.invalidateQueries({ queryKey: ['apostila-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      toast.success('🎙️ Podcast publicado com sucesso! Ao clicar em Play na Apostila, o aluno ouvirá este podcast.');
    },
    onError: (err) => {
      toast.error(`Erro ao salvar podcast: ${err.message}`);
    },
  });

  // Mutation: Save Video Lesson to RecordedLesson (vinculado ao módulo e capítulo)
  const saveVideoLessonMutation = useMutation({
    mutationFn: async () => {
      if (!videoUrl.trim()) {
        throw new Error('Informe a URL do vídeo da aula (YouTube, Vimeo, Google Drive ou OneDrive).');
      }

      const lessonData = {
        module_type: 'apostila',
        module_number: Number(moduleNumber),
        order: Number(lessonOrder),
        course: 'tcc',
        title: videoTitle.trim() || currentLesson.title,
        description: videoDescription.trim() || `Videoaula do ${currentModule.title}.`,
        video_url: videoUrl.trim(),
        material_links: slidesUrl.trim(),
        duration: videoDuration.trim() || '30:00',
        apostila_chapter_id: chapterId,
        apostila_lesson_id: lessonId,
        lesson_type: 'video_external',
        is_hidden: false,
        podcast_url: podcastUrl.trim() || existingChapter?.podcast_url || '',
      };

      let result;
      if (existingVideoLesson?.id) {
        result = await adminApi.update('RecordedLesson', existingVideoLesson.id, lessonData);
      } else {
        result = await adminApi.create('RecordedLesson', lessonData);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recorded-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['apostila-recorded-lessons'] });
      toast.success('🎬 Videoaula publicada com sucesso em "Aulas Gravadas"! Já visível para os alunos.');
    },
    onError: (err) => {
      toast.error(`Erro ao publicar videoaula: ${err.message}`);
    },
  });

  return (
    <div className="min-h-screen bg-[#07080f] text-[#f1ede2] p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b2238] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Sparkles size={12} />
              Estúdio de Produção Pedagógica
            </span>
            <span className="text-xs text-[#a09a8a]">• WR-EDU®</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Estúdio NotebookLM & Central de Produção
          </h1>
          <p className="text-sm text-[#a09a8a] mt-1 max-w-2xl">
            Gere fontes de alto nível para o Google NotebookLM, monte roteiros de videoaulas e apresentações, e publique podcasts diretamente no botão de Play da Apostila e em Aulas Gravadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={openNotebookLmOfficial}
            className="border-purple-500/30 text-purple-200 hover:bg-purple-950/40 gap-1.5 bg-[#0f1424]"
          >
            <ExternalLink size={14} className="text-purple-400" />
            Abrir Google NotebookLM
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={openGoogleDocsNew}
            className="border-[#253052] text-[#d6cebf] hover:bg-white/5 gap-1.5 bg-[#0f1424]"
          >
            <FileText size={14} className="text-blue-400" />
            Criar Google Doc
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPromptsPackage}
            className="bg-[#d4b96a] hover:bg-[#c4a95a] text-[#07080f] font-semibold gap-1.5"
          >
            <Download size={14} />
            Baixar Kit Completo (.md)
          </Button>
        </div>
      </div>

      {/* Module and Lesson Selectors */}
      <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d4b96a]">
            <Layers size={14} />
            <span>Passo 1: Selecionar o Módulo e Capítulo da Apostila</span>
          </div>
          <span className="text-xs text-[#8e8777]">
            {ALL_MODULES.length} Módulos Disponíveis • 50 Aulas Catalogadas
          </span>
        </div>

        {/* Modules Horizontal Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {ALL_MODULES.map((mod, idx) => {
            const isSelected = selectedModuleIdx === idx;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setSelectedModuleIdx(idx);
                  setSelectedLessonIdx(0);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-950/40 font-semibold'
                    : 'bg-[#12172a] border-[#1d2640] text-[#aba495] hover:border-[#2d3a60] hover:text-white'
                }`}
              >
                Módulo {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Lessons Sub-selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1 border-t border-[#182035]">
          {currentModule.lessons.map((lesson, lIdx) => {
            const isSelected = selectedLessonIdx === lIdx;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedLessonIdx(lIdx)}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'bg-[#1b233d] border-[#d4b96a] text-white shadow-md'
                    : 'bg-[#0f1424] border-[#1a233b] text-[#9c9586] hover:border-[#293659] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#d4b96a] font-bold mb-1">
                  <span>Aula {lIdx + 1}</span>
                  {existingChapter?.podcast_url && <Mic size={11} className="text-purple-400" />}
                </div>
                <div className="font-medium line-clamp-2 leading-relaxed">
                  {lesson.title.replace(/^Aula\s+\d+\s*[-—]\s*/i, '')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Chapter Meta Card */}
        <div className="bg-[#12182b] border border-[#202b47] rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[#d4b96a] font-semibold">{currentModule.title}</span>
            <h2 className="text-sm font-bold text-white mt-0.5">{currentLesson.title}</h2>
            <p className="text-[11px] text-[#8e8777] mt-0.5">
              Tamanho do conteúdo original: ~{wordCount} palavras • Módulo {moduleNumber}, Ordem {lessonOrder}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a0d18] border border-[#1b233a]">
              <Mic size={13} className={existingChapter?.podcast_url ? 'text-emerald-400' : 'text-zinc-600'} />
              <span className="text-[11px]">
                Podcast:{' '}
                <strong className={existingChapter?.podcast_url ? 'text-emerald-300' : 'text-zinc-500'}>
                  {existingChapter?.podcast_url ? 'Publicado' : 'Pendente'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a0d18] border border-[#1b233a]">
              <Video size={13} className={existingVideoLesson?.video_url ? 'text-purple-400' : 'text-zinc-600'} />
              <span className="text-[11px]">
                Videoaula:{' '}
                <strong className={existingVideoLesson?.video_url ? 'text-purple-300' : 'text-zinc-500'}>
                  {existingVideoLesson?.video_url ? 'Publicada' : 'Pendente'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs: Packager vs Publisher */}
      <div className="flex border-b border-[#1b2238] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('packager')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors relative ${
            activeTab === 'packager'
              ? 'text-[#d4b96a]'
              : 'text-[#8e8777] hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          1. Fontes & Prompts para o NotebookLM
          {activeTab === 'packager' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4b96a]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('publisher')}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold transition-colors relative ${
            activeTab === 'publisher'
              ? 'text-[#d4b96a]'
              : 'text-[#8e8777] hover:text-white'
          }`}
        >
          <Save size={16} />
          2. Central de Publicação (Apostila & Aulas Gravadas)
          {activeTab === 'publisher' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4b96a]" />
          )}
        </button>
      </div>

      {/* TAB 1: NotebookLM Packager */}
      {activeTab === 'packager' && (
        <div className="space-y-4">
          {/* Sub-tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPackagerSubTab('source')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                packagerSubTab === 'source'
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-[#0f1424] border-[#1b233a] text-[#a09a8a] hover:text-white'
              }`}
            >
              <FileText size={14} className="text-purple-400" />
              Fonte Estruturada do Capítulo
            </button>

            <button
              type="button"
              onClick={() => setPackagerSubTab('podcast')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                packagerSubTab === 'podcast'
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-[#0f1424] border-[#1b233a] text-[#a09a8a] hover:text-white'
              }`}
            >
              <Mic size={14} className="text-emerald-400" />
              Prompt Mestre: Podcast (Audio Overview)
            </button>

            <button
              type="button"
              onClick={() => setPackagerSubTab('video')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                packagerSubTab === 'video'
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-[#0f1424] border-[#1b233a] text-[#a09a8a] hover:text-white'
              }`}
            >
              <Video size={14} className="text-blue-400" />
              Roteiro de Videoaula (3 Blocos)
            </button>

            <button
              type="button"
              onClick={() => setPackagerSubTab('slides')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                packagerSubTab === 'slides'
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-[#0f1424] border-[#1b233a] text-[#a09a8a] hover:text-white'
              }`}
            >
              <Presentation size={14} className="text-amber-400" />
              Estrutura de Slides (PowerPoint)
            </button>
          </div>

          {/* Sub-tab 1: Source */}
          {packagerSubTab === 'source' && (
            <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b2238] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText size={16} className="text-purple-400" />
                    Fonte Completa Formatada para o Google NotebookLM
                  </h3>
                  <p className="text-xs text-[#8e8777] mt-0.5">
                    Carregue este texto no NotebookLM como fonte primária para que a IA gere com precisão o podcast e os materiais.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy('source', structuredSource, 'Fonte do Capítulo')}
                    className="border-[#253052] bg-[#12182b] hover:bg-white/5 text-xs gap-1.5"
                  >
                    {copiedKey === 'source' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'source' ? 'Copiado!' : 'Copiar Fonte'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleDownloadSource}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                  >
                    <Download size={13} />
                    Baixar Arquivo (.txt)
                  </Button>
                </div>
              </div>

              {/* Instructions Tip Box */}
              <div className="bg-[#12172a] border border-[#202a45] rounded-xl p-3.5 flex items-start gap-3 text-xs text-[#c8c0af]">
                <HelpCircle size={16} className="text-[#d4b96a] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">Como usar no Google NotebookLM:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-[#a09a8a]">
                    <li>Clique em <strong>"Abrir Google NotebookLM"</strong> no topo da tela (e escolha a conta Google de sua preferência).</li>
                    <li>Crie um novo caderno e clique em <strong>"Adicionar Fontes"</strong> &gt; <strong>"Texto colado"</strong> ou suba o arquivo <code>.txt</code> baixado aqui.</li>
                    <li>No menu do NotebookLM, selecione <strong>"Audio Overview" (Podcast)</strong> ou use os prompts das outras abas abaixo!</li>
                  </ol>
                </div>
              </div>

              {/* Pre-formatted source preview */}
              <div className="bg-[#080b14] border border-[#182035] rounded-xl p-4 font-mono text-xs text-[#c4bcab] max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {structuredSource}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Podcast Prompt */}
          {packagerSubTab === 'podcast' && (
            <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b2238] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mic size={16} className="text-emerald-400" />
                    Prompt Mestre para o Podcast (Audio Overview)
                  </h3>
                  <p className="text-xs text-[#8e8777] mt-0.5">
                    Instruções calibradas para a opção "Personalizar" (Customize) do Audio Overview no NotebookLM.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy('podcast', podcastPrompt, 'Prompt de Podcast')}
                    className="border-[#253052] bg-[#12182b] hover:bg-white/5 text-xs gap-1.5"
                  >
                    {copiedKey === 'podcast' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'podcast' ? 'Copiado!' : 'Copiar Prompt'}
                  </Button>
                </div>
              </div>

              <div className="bg-[#080b14] border border-[#182035] rounded-xl p-4 font-mono text-xs text-[#a7f3d0] max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {podcastPrompt}
              </div>
            </div>
          )}

          {/* Sub-tab 3: Video Script */}
          {packagerSubTab === 'video' && (
            <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b2238] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Video size={16} className="text-blue-400" />
                    Roteiro Estruturado de Gravação de Videoaula
                  </h3>
                  <p className="text-xs text-[#8e8777] mt-0.5">
                    Estrutura com gancho inicial, 3 atos pedagógicos, estudos de caso e chamada para ação prática.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy('video', videoScript, 'Roteiro de Videoaula')}
                    className="border-[#253052] bg-[#12182b] hover:bg-white/5 text-xs gap-1.5"
                  >
                    {copiedKey === 'video' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'video' ? 'Copiado!' : 'Copiar Roteiro'}
                  </Button>
                </div>
              </div>

              <div className="bg-[#080b14] border border-[#182035] rounded-xl p-4 font-mono text-xs text-[#bae6fd] max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {videoScript}
              </div>
            </div>
          )}

          {/* Sub-tab 4: Slide Deck Outline */}
          {packagerSubTab === 'slides' && (
            <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1b2238] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Presentation size={16} className="text-amber-400" />
                    Estrutura de Slides PowerPoint (10 Slides com Anotações)
                  </h3>
                  <p className="text-xs text-[#8e8777] mt-0.5">
                    Decks prontos para o apresentador com bullets conceituais e notas de orador.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy('slides', slideDeckOutline, 'Estrutura de Slides')}
                    className="border-[#253052] bg-[#12182b] hover:bg-white/5 text-xs gap-1.5"
                  >
                    {copiedKey === 'slides' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copiedKey === 'slides' ? 'Copiado!' : 'Copiar Slides'}
                  </Button>
                </div>
              </div>

              <div className="bg-[#080b14] border border-[#182035] rounded-xl p-4 font-mono text-xs text-[#fde68a] max-h-[460px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {slideDeckOutline}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Publication Central */}
      {activeTab === 'publisher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Podcast (Apostila Play Button) */}
          <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-5 md:p-6 space-y-5">
            <div className="border-b border-[#1b2238] pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Mic size={13} />
                  Destino: Botão de Play da Apostila
                </span>
                {existingChapter?.podcast_url && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    Ativo na Apostila
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Publicar Podcast da Aula
              </h3>
              <p className="text-xs text-[#8e8777] mt-0.5">
                Ao publicar aqui, quando o aluno clicar no botão de Play na leitura da Apostila, ouvirá este podcast ao invés da narração genérica.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                  URL do Áudio do Podcast (MP3 / Google Drive / Dropbox / CDN)
                </label>
                <Input
                  value={podcastUrl}
                  onChange={(e) => setPodcastUrl(e.target.value)}
                  placeholder="https://.../podcast-aula-1.mp3 ou link de compartilhamento"
                  className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                />
                {podcastUrl && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {podcastProvider.provider === 'Google Drive' && (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Google Drive detectado — Transmissão e avanço otimizados ativos
                      </span>
                    )}
                    {podcastProvider.provider === 'OneDrive' && (
                      <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Microsoft OneDrive detectado — Conversão para stream ativada
                      </span>
                    )}
                    {podcastProvider.provider === 'Dropbox' && (
                      <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Dropbox detectado — Streaming raw ativo
                      </span>
                    )}
                    {podcastProvider.provider === 'Direct' && (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Arquivo de áudio direto detectado
                      </span>
                    )}
                  </div>
                )}

                {/* NotebookLM Specific Guidance */}
                {podcastProvider.provider === 'NotebookLM' && (
                  <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertCircle size={15} /> Link do Google NotebookLM detectado!
                    </div>
                    <p className="text-[#c8bfa8] text-[11px] leading-relaxed">
                      O NotebookLM não permite reprodução direta de áudio embutido via web por exigência de autenticação da Google.
                    </p>
                    <div className="bg-[#080b14] border border-amber-500/20 rounded-lg p-2.5 space-y-1.5 text-[11px]">
                      <div className="font-semibold text-white">Como fazer o podcast tocar direto no botão Play da apostila?</div>
                      <ol className="list-decimal list-inside space-y-1 text-[#d6cebf]">
                        <li>No seu caderno do NotebookLM, no card do Audio Overview, clique no menu de 3 pontinhos (<strong className="text-white">⋮</strong>).</li>
                        <li>Clique em <strong className="text-white">"Fazer download"</strong> (ou "Baixar") para salvar o arquivo de áudio no seu computador.</li>
                        <li>Clique no botão <strong className="text-emerald-400">"Carregar Áudio Local"</strong> abaixo e escolha o arquivo baixado. Ele será enviado ao servidor e tocará nativamente na apostila!</li>
                      </ol>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={podcastUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all"
                      >
                        <ExternalLink size={13} /> Abrir no NotebookLM para Baixar o Áudio
                      </a>
                      <span className="text-[10px] text-[#8e8777]">Se mantiver este link, o aluno terá um botão direto para abrir no NotebookLM.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Local File upload option */}
              <div className="border border-dashed border-[#202a45] rounded-xl p-3 bg-[#090d18] text-center">
                <p className="text-[11px] text-[#8e8777] mb-2">
                  Ou selecione um arquivo de áudio do seu computador para teste imediato:
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141b30] hover:bg-[#1a2340] text-xs font-medium text-white cursor-pointer transition-colors border border-[#253052]">
                  <Mic size={13} className="text-emerald-400" />
                  Carregar Áudio Local (.mp3 / .m4a)
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                    Título de Exibição
                  </label>
                  <Input
                    value={podcastTitle}
                    onChange={(e) => setPodcastTitle(e.target.value)}
                    placeholder="Podcast: Nome da Aula"
                    className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                    Duração Estimada
                  </label>
                  <Input
                    value={podcastDuration}
                    onChange={(e) => setPodcastDuration(e.target.value)}
                    placeholder="Ex: 14:30"
                    className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                  Sinopse / Destaques do Podcast
                </label>
                <Textarea
                  value={podcastSynopsis}
                  onChange={(e) => setPodcastSynopsis(e.target.value)}
                  placeholder="Pontos mais marcantes abordados neste episódio..."
                  rows={2}
                  className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                />
              </div>

              {/* Audio Preview Player */}
              {podcastUrl && (
                <div className="bg-[#12182b] border border-[#202b47] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={togglePreviewAudio}
                      className="h-8 w-8 p-0 rounded-full bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                    >
                      {previewPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </Button>
                    <div>
                      <div className="text-xs font-semibold text-white">{podcastTitle || 'Podcast da Aula'}</div>
                      <div className="text-[10px] text-[#8e8777]">Prévia do áudio configurado</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-400 font-medium">
                    {podcastDuration || 'Áudio carregado'}
                  </span>
                </div>
              )}

              <Button
                onClick={() => savePodcastMutation.mutate()}
                disabled={savePodcastMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 text-xs py-2.5"
              >
                <Save size={14} />
                {savePodcastMutation.isPending ? 'Salvando...' : 'Publicar Podcast no Play da Apostila'}
              </Button>
            </div>
          </div>

          {/* Card 2: Recorded Lesson (Aulas Gravadas /lessons) */}
          <div className="bg-[#0c101d] border border-[#1b2238] rounded-2xl p-5 md:p-6 space-y-5">
            <div className="border-b border-[#1b2238] pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Video size={13} />
                  Destino: Aulas Gravadas (/lessons)
                </span>
                {existingVideoLesson?.video_url && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    <CheckCircle2 size={12} />
                    Publicada em Aulas
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Publicar em Aulas Gravadas
              </h3>
              <p className="text-xs text-[#8e8777] mt-0.5">
                Alimente o acervo oficial de videoaulas. Os alunos assistirão ao vídeo e terão acesso aos slides diretamente em <strong>/lessons</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                  URL do Vídeo (YouTube, Google Drive, OneDrive, Vimeo ou link direto MP4)
                </label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/... ou Google Drive / OneDrive"
                  className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                />
                {videoUrl && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {videoProvider.provider === 'Google Drive' && (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Google Drive detectado — Visualizador preview ativo
                      </span>
                    )}
                    {videoProvider.provider === 'OneDrive' && (
                      <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Microsoft OneDrive detectado — Embed integrado ativo
                      </span>
                    )}
                    {videoProvider.provider === 'YouTube' && (
                      <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> YouTube detectado — Player integrado ativo
                      </span>
                    )}
                    {videoProvider.provider === 'Vimeo' && (
                      <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Vimeo detectado — Player integrado ativo
                      </span>
                    )}
                    {videoProvider.provider === 'Direct' && (
                      <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={11} /> Arquivo de vídeo direto detectado
                      </span>
                    )}
                  </div>
                )}

                {/* NotebookLM Specific Guidance for Video */}
                {videoProvider.provider === 'NotebookLM' && (
                  <div className="mt-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-purple-300">
                      <Sparkles size={15} /> Caderno do Google NotebookLM detectado!
                    </div>
                    <p className="text-[#c8bfa8] text-[11px] leading-relaxed">
                      Em <strong>Aulas Gravadas (/lessons)</strong>, os alunos verão um card interativo com o título da aula e botão com 1 clique para acessar o caderno completo no NotebookLM.
                    </p>
                    <div className="text-[11px] text-[#8e8777]">
                      💡 Para exibir um reprodutor de vídeo tradicional com controles de play e pausa, utilize o link de uma gravação no YouTube, Google Drive ou Vimeo.
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                  Título da Videoaula
                </label>
                <Input
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Título da Aula Gravada"
                  className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                    Link dos Slides (PowerPoint / Google Slides / PDF)
                  </label>
                  <Input
                    value={slidesUrl}
                    onChange={(e) => setSlidesUrl(e.target.value)}
                    placeholder="https://docs.google.com/presentation/..."
                    className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                    Duração da Videoaula
                  </label>
                  <Input
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="Ex: 35:00"
                    className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d6cebf] mb-1.5">
                  Descrição e Resumo Pedagógico da Aula
                </label>
                <Textarea
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Resumo dos tópicos discutidos na aula..."
                  rows={3}
                  className="bg-[#080b14] border-[#1b233a] text-xs text-white"
                />
              </div>

              {/* Video Preview Player */}
              {videoUrl && (
                <div className="bg-[#12182b] border border-[#202b47] rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8e8777]">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Video size={13} className="text-purple-400" />
                      Prévia da Videoaula
                    </span>
                    <span className="text-[11px] text-purple-300 font-mono">{videoProvider.provider}</span>
                  </div>
                  <div className="rounded-lg overflow-hidden bg-black/60 aspect-video max-h-56">
                    <VideoPlayer url={videoUrl} title={videoTitle || currentLesson.title} />
                  </div>
                </div>
              )}

              <Button
                onClick={() => saveVideoLessonMutation.mutate()}
                disabled={saveVideoLessonMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold gap-2 text-xs py-2.5"
              >
                <Video size={14} />
                {saveVideoLessonMutation.isPending ? 'Publicando...' : 'Publicar em Aulas Gravadas (/lessons)'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
