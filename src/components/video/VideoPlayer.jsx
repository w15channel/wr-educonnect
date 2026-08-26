import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Rewind,
  FastForward,
  Volume2,
  Volume1,
  VolumeX,
  RotateCw,
  Minimize2,
  ExternalLink,
  Loader2,
  Captions,
  MonitorUp,
} from 'lucide-react';
import { getVideoSource } from '@/lib/videoEmbed';
import { loadYouTubeApi, loadVimeoApi } from '@/lib/videoProviderApi';

const SPEEDS = [1, 1.25, 1.5, 2, 2.5];
const SKIP_SECONDS = 10;
const YOUTUBE_QUALITY_LABELS = {
  highres: '2160p', hd2160: '2160p', hd1440: '1440p', hd1080: '1080p',
  hd720: '720p', large: '480p', medium: '360p', small: '240p', tiny: '144p', auto: 'Automática',
};

const qualityLabel = (value) => YOUTUBE_QUALITY_LABELS[value] || (/^\d+p$/.test(value) ? value : value || 'Automática');

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const youtubeCaptionId = (track, index) =>
  `${track.languageCode || 'track'}:${track.kind || 'standard'}:${track.vssId || index}`;

const normalizeYouTubeCaptionTracks = (tracks = []) => tracks.map((track, index) => ({
  id: youtubeCaptionId(track, index),
  label: track.languageName || track.name || track.languageCode || `Legenda ${index + 1}`,
  providerTrack: track,
}));

const isNativeFullscreen = () =>
  typeof document !== 'undefined' &&
  Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);

/**
 * VideoPlayer — player integrado da WR EduConnect.
 * ───────────────────────────────────────────────
 * Toda a interface (linha do tempo, volume, velocidade, tela cheia) é nossa.
 * O que muda por trás é apenas o "motor" de reprodução:
 *
 *  - arquivos diretos (mp4/webm/…)  → elemento <video> nativo, sem controles do navegador
 *  - YouTube                        → IFrame Player API oficial (controls=0)
 *  - Vimeo                          → Player SDK oficial (controls=false)
 *  - Rumble e demais embeds (Drive, Instagram, Facebook, TikTok…) → usamos os controles
 *    nativos do próprio embed e mostramos apenas ações que realmente funcionam.
 */
export default function VideoPlayer({
  url,
  title = 'Vídeo',
  poster = '',
  className = '',
  onPlay = undefined,
  onPause = undefined,
}) {
  const source = useMemo(() => getVideoSource(url), [url]);
  const canControl = source.kind === 'file' || source.kind === 'youtube' || source.kind === 'vimeo';

  const containerRef = useRef(null);
  const hostRef = useRef(null);
  const videoRef = useRef(null);
  const apiRef = useRef(null);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const captionTracksRef = useRef([]);

  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
  }, [onPlay, onPause]);

  const [ready, setReady] = useState(!canControl);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateNotice, setRateNotice] = useState('');
  const [seeking, setSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [qualities, setQualities] = useState([]);
  const [quality, setQuality] = useState('');
  const [captionTracks, setCaptionTracks] = useState([]);
  const [captionTrack, setCaptionTrack] = useState('off');
  const [settingsNotice, setSettingsNotice] = useState('');
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(orientation: portrait)').matches : false
  );

  const fullscreen = nativeFullscreen || cssFullscreen;

  useEffect(() => {
    captionTracksRef.current = captionTracks;
  }, [captionTracks]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Reinicia o estado sempre que outro vídeo é aberto.
  useEffect(() => {
    setReady(!canControl);
    setStarted(false);
    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setRate(1);
    setRateNotice('');
    setLoadError('');
    setQualities([]);
    setQuality('');
    setCaptionTracks([]);
    setCaptionTrack('off');
    setSettingsNotice('');
  }, [url, canControl]);

  // ── Motor: arquivo de vídeo nativo ──────────────────────────────────────────
  useEffect(() => {
    if (source.kind !== 'file') return undefined;
    const el = videoRef.current;
    if (!el) return undefined;

    apiRef.current = {
      play: () => { const p = el.play(); if (p?.catch) p.catch(() => {}); },
      pause: () => el.pause(),
      seek: (time) => { el.currentTime = time; },
      setVolume: (value) => { el.volume = value; },
      setMuted: (value) => { el.muted = value; },
      setRate: (value) => { el.playbackRate = value; return value; },
    };

    const onLoaded = () => {
      setDuration(el.duration || 0);
      const tracks = Array.from(el.textTracks || []);
      tracks.forEach((track) => { track.mode = 'disabled'; });
      setCaptionTracks(tracks.map((track, index) => ({
        id: String(index), label: track.label || track.language || `Legenda ${index + 1}`,
      })));
      // Um arquivo direto tem somente a representação enviada pelo servidor;
      // não exibimos um seletor que não teria como trocar a qualidade.
      setQualities([]);
      setQuality('');
    };
    const onTime = () => setCurrentTime(el.currentTime || 0);
    const onPlayEvent = () => { setPlaying(true); setStarted(true); onPlayRef.current?.(); };
    const onPauseEvent = () => { setPlaying(false); onPauseRef.current?.(); };
    const onEnded = () => setPlaying(false);
    const onVolumeEvent = () => { setVolume(el.volume); setMuted(el.muted); };
    const onRateChange = () => setRate(el.playbackRate);
    const onError = () => setLoadError('Não foi possível carregar este vídeo.');

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('durationchange', onLoaded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlayEvent);
    el.addEventListener('pause', onPauseEvent);
    el.addEventListener('ended', onEnded);
    el.addEventListener('volumechange', onVolumeEvent);
    el.addEventListener('ratechange', onRateChange);
    el.addEventListener('error', onError);
    setReady(true);

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('durationchange', onLoaded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlayEvent);
      el.removeEventListener('pause', onPauseEvent);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('volumechange', onVolumeEvent);
      el.removeEventListener('ratechange', onRateChange);
      el.removeEventListener('error', onError);
      apiRef.current = null;
    };
  }, [source.kind, source.src]);

  // ── Motor: YouTube (IFrame Player API) ──────────────────────────────────────
  useEffect(() => {
    if (source.kind !== 'youtube' || !source.videoId) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;

    let player = null;
    let ticker = null;
    let cancelled = false;
    let captionsInitialized = false;
    let pendingCaption = null;

    const refreshCaptions = (target) => {
      if (cancelled || !target?.getOptions?.().includes('captions')) return;
      const tracks = normalizeYouTubeCaptionTracks(target.getOption('captions', 'tracklist') || []);
      captionTracksRef.current = tracks;
      setCaptionTracks(tracks);

      // Carregar o módulo pode restaurar a preferência de CC da conta do
      // usuário. Na primeira carga sempre a anulamos, conforme o padrão da
      // plataforma. Nas próximas mudanças preservamos a escolha feita aqui.
      if (!captionsInitialized) {
        target.setOption('captions', 'track', {});
        captionsInitialized = true;
        setCaptionTrack('off');
      }

      if (pendingCaption) {
        const { value, resolve, reject } = pendingCaption;
        pendingCaption = null;
        try {
          const selected = tracks.find((track) => track.id === value);
          target.setOption('captions', 'track', value === 'off' ? {} : selected?.providerTrack || {});
          if (value !== 'off' && !selected) throw new Error('Caption track unavailable');
          resolve(value);
        } catch (error) {
          reject(error);
        }
      }
    };

    // A API substitui o elemento passado por um <iframe>. Criamos um filho
    // descartável para o React nunca perder a referência do container.
    host.innerHTML = '';
    const mount = document.createElement('div');
    host.appendChild(mount);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(mount, {
          videoId: source.videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            cc_load_policy: 0,
            iv_load_policy: 3,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              apiRef.current = {
                play: () => event.target.playVideo(),
                pause: () => event.target.pauseVideo(),
                seek: (time) => event.target.seekTo(time, true),
                setVolume: (value) => event.target.setVolume(Math.round(value * 100)),
                setMuted: (value) => (value ? event.target.mute() : event.target.unMute()),
                setRate: (value) => {
                  event.target.setPlaybackRate(value);
                  return event.target.getPlaybackRate?.() ?? value;
                },
                setCaption: (value) => new Promise((resolve, reject) => {
                  const tracks = captionTracksRef.current;
                  const selected = tracks.find((track) => track.id === value);
                  if (event.target.getOptions?.().includes('captions')) {
                    try {
                      event.target.setOption('captions', 'track', value === 'off' ? {} : selected?.providerTrack || {});
                      if (value !== 'off' && !selected) throw new Error('Caption track unavailable');
                      resolve(value);
                    } catch (error) {
                      reject(error);
                    }
                    return;
                  }
                  pendingCaption = { value, resolve, reject };
                  event.target.loadModule?.('captions');
                }),
              };
              setDuration(event.target.getDuration?.() || 0);
              setVolume((event.target.getVolume?.() ?? 100) / 100);
              setMuted(Boolean(event.target.isMuted?.()));
              // O módulo é necessário para consultar as faixas disponíveis e
              // controlar o CC pelo botão do player virtual.
              event.target.loadModule?.('captions');
              setReady(true);
            },
            onApiChange: (event) => refreshCaptions(event.target),
            onStateChange: (event) => {
              if (cancelled) return;
              const states = window.YT?.PlayerState || {};
              const isPlaying = event.data === states.PLAYING;
              setPlaying(isPlaying);
              if (isPlaying) {
                setStarted(true);
                setDuration(event.target.getDuration?.() || 0);
                onPlayRef.current?.();
              } else if (event.data === states.PAUSED) {
                onPauseRef.current?.();
              }
            },
            onPlaybackRateChange: (event) => setRate(event.data || 1),
            onError: () => setLoadError('O YouTube não permitiu a reprodução deste vídeo aqui.'),
          },
        });

        ticker = window.setInterval(() => {
          if (cancelled || !player?.getCurrentTime) return;
          setCurrentTime(player.getCurrentTime() || 0);
          const total = player.getDuration?.() || 0;
          if (total) setDuration(total);
        }, 250);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Falha ao carregar o player do YouTube.');
      });

    return () => {
      cancelled = true;
      if (ticker) window.clearInterval(ticker);
      try { player?.destroy?.(); } catch { /* iframe já removido */ }
      host.innerHTML = '';
      apiRef.current = null;
    };
  }, [source.kind, source.videoId]);

  // ── Motor: Vimeo (Player SDK) ───────────────────────────────────────────────
  useEffect(() => {
    if (source.kind !== 'vimeo' || !source.videoId) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;

    let player = null;
    let cancelled = false;

    host.innerHTML = '';
    const mount = document.createElement('div');
    host.appendChild(mount);

    loadVimeoApi()
      .then((Vimeo) => {
        if (cancelled) return;
        player = new Vimeo.Player(mount, {
          id: Number(source.videoId),
          controls: false,
          playsinline: true,
          responsive: false,
          width: 1280,
        });

        apiRef.current = {
          play: () => player.play().catch(() => {}),
          pause: () => player.pause().catch(() => {}),
          seek: (time) => player.setCurrentTime(time).catch(() => {}),
          setVolume: (value) => player.setVolume(value).catch(() => {}),
          setMuted: (value) => player.setMuted(value).catch(() => {}),
          setRate: (value) => {
            player.setPlaybackRate(value).catch(() => {
              setRateNotice('Este provedor aceita no máximo 2x.');
              player.setPlaybackRate(2).catch(() => {});
              setRate(2);
            });
            return value;
          },
          setQuality: async (value) => {
            await player.setQuality(value);
            return player.getQuality();
          },
          setCaption: (value) => value === 'off'
            ? player.disableTextTrack()
            : (() => {
              const track = captionTracksRef.current.find((item) => item.id === value);
              return player.enableTextTrack(track?.language || value, track?.kind);
            })(),
        };

        player.on('timeupdate', (data) => {
          if (cancelled) return;
          setCurrentTime(data?.seconds || 0);
          if (data?.duration) setDuration(data.duration);
        });
        player.on('loaded', () => {
          if (cancelled) return;
          player.getDuration().then((value) => setDuration(value || 0)).catch(() => {});
          player.disableTextTrack().catch(() => {});
          player.getTextTracks().then((tracks) => setCaptionTracks(tracks.map((track, trackIndex) => ({
            id: `${track.language}:${track.kind || trackIndex}`,
            language: track.language,
            kind: track.kind,
            label: track.label || track.language,
          })))).catch(() => {});
          player.getQualities().then((items) => {
            const available = items.filter((item) => item.id !== 'auto');
            setQualities(items.map((item) => ({ id: item.id, label: item.label || qualityLabel(item.id) })));
            const preferred = available.find((item) => item.id === '720p')?.id || 'auto';
            player.setQuality(preferred).catch(() => {});
            setQuality(preferred);
          }).catch(() => {});
          setReady(true);
        });
        player.on('play', () => { if (!cancelled) { setPlaying(true); setStarted(true); onPlayRef.current?.(); } });
        player.on('pause', () => { if (!cancelled) { setPlaying(false); onPauseRef.current?.(); } });
        player.on('ended', () => { if (!cancelled) setPlaying(false); });
        player.on('volumechange', (data) => { if (!cancelled && typeof data?.volume === 'number') setVolume(data.volume); });
        player.on('qualitychange', (data) => { if (!cancelled && data?.id) setQuality(data.id); });
        player.on('texttrackchange', (data) => {
          if (cancelled) return;
          if (!data?.language) setCaptionTrack('off');
          else {
            const selected = captionTracksRef.current.find(
              (track) => track.language === data.language && (!data.kind || track.kind === data.kind)
            );
            setCaptionTrack(selected?.id || 'off');
          }
        });
        player.on('error', () => { if (!cancelled) setLoadError('O Vimeo não permitiu a reprodução deste vídeo aqui.'); });
        player.ready().then(() => { if (!cancelled) setReady(true); }).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setLoadError('Falha ao carregar o player do Vimeo.');
      });

    return () => {
      cancelled = true;
      try { player?.destroy?.(); } catch { /* iframe já removido */ }
      host.innerHTML = '';
      apiRef.current = null;
    };
  }, [source.kind, source.videoId]);

  // ── Sincronização de tela cheia nativa ──────────────────────────────────────
  useEffect(() => {
    const sync = () => setNativeFullscreen(isNativeFullscreen());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // Nunca deixar o overlay de tela cheia preso ao desmontar o player.
  useEffect(() => () => { setCssFullscreen(false); }, []);

  // ── Ações ───────────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    if (playing) api.pause();
    else api.play();
  }, [playing]);

  const handleStop = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    api.pause();
    api.seek(0);
    setCurrentTime(0);
    setStarted(false);
  }, []);

  const handleSkip = useCallback((offset) => {
    const api = apiRef.current;
    if (!api) return;
    const limit = duration > 0 ? duration : Number.MAX_SAFE_INTEGER;
    const target = clamp(currentTime + offset, 0, limit);
    api.seek(target);
    setCurrentTime(target);
  }, [currentTime, duration]);

  const commitSeek = useCallback(() => {
    if (!seeking) return;
    const api = apiRef.current;
    setSeeking(false);
    if (!api) return;
    api.seek(seekPreview);
    setCurrentTime(seekPreview);
  }, [seeking, seekPreview]);

  const handleVolume = useCallback((value) => {
    const api = apiRef.current;
    const next = clamp(value, 0, 1);
    setVolume(next);
    if (!api) return;
    api.setVolume(next);
    if (next === 0 && !muted) { api.setMuted(true); setMuted(true); }
    if (next > 0 && muted) { api.setMuted(false); setMuted(false); }
  }, [muted]);

  const toggleMuted = useCallback(() => {
    const api = apiRef.current;
    const next = !muted;
    setMuted(next);
    api?.setMuted(next);
    if (!next && volume === 0) { setVolume(0.5); api?.setVolume(0.5); }
  }, [muted, volume]);

  const handleRate = useCallback((value) => {
    const api = apiRef.current;
    setRateNotice('');
    setRate(value);
    if (!api) return;
    const applied = api.setRate(value);
    // O YouTube só aceita as taxas da lista dele (até 2x) e devolve a taxa real.
    if (typeof applied === 'number' && Math.abs(applied - value) > 0.001) {
      setRate(applied);
      setRateNotice(`Este provedor aceita no máximo ${applied}x.`);
    }
  }, []);

  const handleQuality = useCallback((value) => {
    const result = apiRef.current?.setQuality?.(value);
    result?.then?.((applied) => {
      const actual = applied || value;
      setQuality(actual);
      setSettingsNotice(`Qualidade alterada para ${qualityLabel(actual)}.`);
    }).catch?.(() => setSettingsNotice('Não foi possível alterar a qualidade neste vídeo.'));
  }, []);

  const handleCaption = useCallback((value) => {
    setCaptionTrack(value);
    setSettingsNotice(value === 'off' ? 'Legendas desligadas.' : 'Legendas ativadas.');
    if (source.kind === 'file') {
      Array.from(videoRef.current?.textTracks || []).forEach((track, index) => {
        track.mode = value === String(index) ? 'showing' : 'disabled';
      });
      return;
    }
    const result = apiRef.current?.setCaption?.(value);
    result?.catch?.(() => setSettingsNotice('Não foi possível alterar a legenda neste vídeo.'));
  }, [source.kind]);

  const handleOpenSource = useCallback(() => {
    if (!source.originalUrl) return;
    window.open(source.originalUrl, '_blank', 'noopener,noreferrer');
  }, [source.originalUrl]);

  const enterFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element) return;
    const request =
      element.requestFullscreen || element.webkitRequestFullscreen || element.msRequestFullscreen;
    if (request) {
      try {
        await request.call(element);
        try { await window.screen?.orientation?.lock?.('landscape'); } catch { /* sem suporte */ }
        return;
      } catch { /* cai no fallback abaixo */ }
    }
    // iOS Safari não permite tela cheia em elementos comuns: tentamos o vídeo
    // nativo e, se nem isso existir, usamos o overlay em CSS (funciona sempre).
    const videoElement = videoRef.current;
    if (videoElement?.webkitEnterFullscreen) {
      try { videoElement.webkitEnterFullscreen(); return; } catch { /* fallback */ }
    }
    setCssFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    if (isNativeFullscreen()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      try { exit?.call(document); } catch { /* ignora */ }
      try { window.screen?.orientation?.unlock?.(); } catch { /* sem suporte */ }
    }
    setCssFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (fullscreen) exitFullscreen();
    else enterFullscreen();
  }, [fullscreen, enterFullscreen, exitFullscreen]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const displayTime = seeking ? seekPreview : currentTime;
  const progressPct = duration > 0 ? clamp((displayTime / duration) * 100, 0, 100) : 0;
  const volumePct = clamp((muted ? 0 : volume) * 100, 0, 100);
  const rangeBackground = (pct) =>
    `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, rgba(255,255,255,0.22) ${pct}%, rgba(255,255,255,0.22) 100%)`;

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const showPoster = Boolean(poster) && !started && canControl;

  const containerClass = [
    'wr-video-player bg-black',
    cssFullscreen ? 'wr-video-player--css-fullscreen' : '',
    cssFullscreen && isPortrait ? 'wr-video-player--rotated' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={containerRef} className={containerClass}>
      <div className="wr-video-surface">
        {source.kind === 'file' && (
          <video
            ref={videoRef}
            src={source.src}
            poster={poster || undefined}
            className="object-contain"
            playsInline
            preload="metadata"
          />
        )}

        {(source.kind === 'youtube' || source.kind === 'vimeo') && (
          <div ref={hostRef} className="absolute inset-0" />
        )}

        {/* O embedJS oficial só carrega vídeos do publisher configurado; o iframe
            /embed/<id>/ funciona para qualquer vídeo público do Rumble. */}
        {source.kind === 'rumble' && (
          <iframe
            title={title}
            src={source.embedSrc}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}

        {source.kind === 'iframe' && (
          <iframe
            title={title}
            src={source.embedSrc}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}

        {source.kind === 'unsupported' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-4 text-center">
            <p className="text-sm text-muted-foreground">Vídeo não disponível para reprodução integrada.</p>
          </div>
        )}

        {canControl && !ready && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
            <Loader2 size={26} className="animate-spin" />
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center text-white">
            <p className="text-sm">{loadError}</p>
            {source.originalUrl && (
              <button
                type="button"
                onClick={handleOpenSource}
                className="wr-video-source-btn"
              >
                <ExternalLink size={14} /> Abrir no site de origem
              </button>
            )}
          </div>
        )}

        {showPoster && ready && !loadError && (
          <button
            type="button"
            onClick={() => apiRef.current?.play()}
            className="absolute inset-0 z-[2] flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url("${poster}")` }}
            aria-label={`Reproduzir ${title}`}
          >
            <span className="absolute inset-0 bg-black/35" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-transform hover:scale-105">
              <Play size={28} className="ml-1" fill="currentColor" />
            </span>
          </button>
        )}

        {cssFullscreen && (
          <button
            type="button"
            onClick={exitFullscreen}
            aria-label="Sair da tela cheia"
            className="absolute right-3 top-3 z-[5] rounded-full bg-black/60 p-2 text-white"
          >
            <Minimize2 size={18} />
          </button>
        )}
      </div>

      {/* Embeds sem API (inclusive Drive) preservam os controles nativos. */}
      {!canControl && source.kind !== 'unsupported' && (
        <div className="wr-video-controls wr-video-controls--compact px-3 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/75">
              Controles do {source.provider || 'provedor'} disponíveis no próprio vídeo
            </span>
            {source.originalUrl && (
              <button type="button" onClick={handleOpenSource} className="wr-video-btn gap-1.5 px-2.5 text-[11px] font-semibold">
                <ExternalLink size={14} /> <span className="hidden sm:inline">Abrir original</span>
              </button>
            )}
            <button type="button" onClick={toggleFullscreen} title={fullscreen ? 'Sair da tela cheia' : 'Girar tela (tela cheia)'} className="wr-video-btn gap-1.5 px-2.5 text-[11px] font-semibold">
              {fullscreen ? <Minimize2 size={15} /> : <RotateCw size={15} />}
              <span>{fullscreen ? 'Sair' : 'Girar tela'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Controles integrados para provedores com API pública de reprodução. */}
      {canControl && <div className="wr-video-controls px-3 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <span className="w-11 shrink-0 text-[11px] font-semibold tabular-nums text-white/70">
            {formatTime(displayTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.1}
            value={duration > 0 ? displayTime : 0}
            disabled={!canControl || duration <= 0}
            onChange={(e) => { setSeeking(true); setSeekPreview(Number(e.target.value)); }}
            onPointerUp={commitSeek}
            onPointerCancel={commitSeek}
            onTouchEnd={commitSeek}
            onMouseUp={commitSeek}
            onKeyUp={commitSeek}
            onBlur={commitSeek}
            aria-label="Linha do tempo do vídeo"
            className="wr-video-range flex-1 disabled:opacity-40"
            style={{ background: rangeBackground(progressPct) }}
          />
          <span className="w-11 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/70">
            {formatTime(duration)}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-2">
          <button type="button" onClick={handlePlayPause} disabled={!canControl} title={playing ? 'Pausar' : 'Reproduzir'} aria-label={playing ? 'Pausar' : 'Reproduzir'} className="wr-video-btn">
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={handleStop} disabled={!canControl} title="Parar" aria-label="Parar" className="wr-video-btn">
            <Square size={15} />
          </button>
          <button type="button" onClick={() => handleSkip(-SKIP_SECONDS)} disabled={!canControl} title={`Retroceder ${SKIP_SECONDS}s`} aria-label={`Retroceder ${SKIP_SECONDS} segundos`} className="wr-video-btn">
            <Rewind size={16} />
          </button>
          <button type="button" onClick={() => handleSkip(SKIP_SECONDS)} disabled={!canControl} title={`Avançar ${SKIP_SECONDS}s`} aria-label={`Avançar ${SKIP_SECONDS} segundos`} className="wr-video-btn">
            <FastForward size={16} />
          </button>

          <div className="ml-1 flex items-center gap-1.5">
            <button type="button" onClick={toggleMuted} disabled={!canControl} title={muted ? 'Ativar som' : 'Mutar'} aria-label={muted ? 'Ativar som' : 'Mutar'} className="wr-video-btn">
              <VolumeIcon size={16} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              disabled={!canControl}
              onChange={(e) => handleVolume(Number(e.target.value))}
              aria-label="Volume"
              className="wr-video-range w-16 disabled:opacity-40 sm:w-20"
              style={{ background: rangeBackground(volumePct) }}
            />
          </div>

          <div className="flex items-center gap-1">
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleRate(speed)}
                disabled={!canControl}
                title={`Velocidade ${speed}x`}
                className={`wr-video-speed ${Math.abs(rate - speed) < 0.001 ? 'wr-video-speed--active' : ''}`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {qualities.length > 0 && (
            <label className="wr-video-select-wrap" title="Qualidade do vídeo">
              <MonitorUp size={15} aria-hidden="true" />
              <span className="sr-only">Qualidade</span>
              <select value={quality} onChange={(event) => handleQuality(event.target.value)} aria-label="Qualidade do vídeo" className="wr-video-select">
                {qualities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          )}

          <label className={`wr-video-select-wrap ${captionTrack !== 'off' ? 'wr-video-select-wrap--active' : ''}`} title="Legendas">
            <Captions size={16} aria-hidden="true" />
            <span className="sr-only">Legendas</span>
            <select value={captionTrack} onChange={(event) => handleCaption(event.target.value)} aria-label="Legendas" className="wr-video-select">
              <option value="off">Legendas: desligadas</option>
              {captionTracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
            </select>
          </label>

          {source.originalUrl && (
            <button
              type="button"
              onClick={handleOpenSource}
              title={`Abrir vídeo no site de origem${source.provider ? ` (${source.provider})` : ''}`}
              aria-label={`Abrir vídeo no site de origem${source.provider ? `: ${source.provider}` : ''}`}
              className="wr-video-btn gap-1.5 px-2.5 text-[11px] font-semibold"
            >
              <ExternalLink size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Abrir original</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title={fullscreen ? 'Sair da tela cheia' : 'Girar tela (tela cheia)'}
            className="wr-video-btn ml-auto gap-1.5 px-2.5 text-[11px] font-semibold"
          >
            {fullscreen ? <Minimize2 size={15} /> : <RotateCw size={15} />}
            <span className="hidden sm:inline">{fullscreen ? 'Sair da tela cheia' : 'Girar tela'}</span>
          </button>
        </div>

        {rateNotice && <p className="mt-1.5 text-[11px] text-amber-300">{rateNotice}</p>}
        <p className="sr-only" role="status" aria-live="polite">{settingsNotice}</p>

      </div>}

      {/* Pergunta de qualidade + link original */}
      {!fullscreen && (
        <div className="wr-video-quality px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            A visualização da aula está em boa qualidade? Se preferir, você pode abrir esse vídeo externamente
            no site de origem pelo botão abaixo:{' '}
            {source.originalUrl ? (
              <button
                type="button"
                onClick={handleOpenSource}
                className="wr-video-source-btn ml-1"
              >
                <ExternalLink size={12} />
                abrir no site de origem{source.provider ? ` (${source.provider})` : ''}
              </button>
            ) : (
              <span className="italic">link original não informado nesta aula.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}