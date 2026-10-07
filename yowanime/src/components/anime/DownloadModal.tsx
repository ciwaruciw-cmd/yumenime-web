import { useState, useMemo, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import type { Anime } from '@/types/anime';
import type { Episode, VideoSource, VideoQuality } from '@/types/episode';
import {
  formatEpisodeFilename,
  estimateEpisodeSize,
  buildDownloadUrl,
  triggerDownloadFile,
  copyToClipboard,
} from '@/utils/downloadHelper';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime;
  episode?: Episode;
  allEpisodes?: Episode[];
  currentSources?: VideoSource[];
  defaultTab?: 'single' | 'batch';
}

interface QualityOption {
  quality: VideoQuality | string;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  url: string;
  size: string;
  isReal: boolean;
}

export function DownloadModal({
  isOpen,
  onClose,
  anime,
  episode,
  allEpisodes = [],
  currentSources = [],
  defaultTab = 'single',
}: DownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>(defaultTab);
  const [selectedBatchQuality, setSelectedBatchQuality] = useState<string>('720p');
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Sync tab with defaultTab when opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      // Select all episodes by default in batch mode
      if (allEpisodes.length > 0) {
        setSelectedEpisodes(allEpisodes.map((e) => e.number));
      }
    }
  }, [isOpen, defaultTab, allEpisodes]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Determine current episode to display
  const currentEp = episode || allEpisodes[0] || {
    id: `${anime.id}-ep-1`,
    animeId: anime.id,
    number: 1,
    title: `Episode 1`,
    duration: anime.duration ? anime.duration * 60 : 1440,
    sources: [],
  };

  const isRealSource = (url?: string) =>
    url &&
    !url.includes('w3.org') &&
    !url.includes('zencdn') &&
    !url.includes('w3schools') &&
    !url.includes('commondatastorage') &&
    !url.includes('interactive-examples.mdn') &&
    !url.includes('filedon.co') &&
    !url.includes('files.im') &&
    !url.includes('mega.nz') &&
    !url.includes('gdriveplayer.me') &&
    !url.includes('meownime.ltd') &&
    !url.includes('link.desustream.com') &&
    !url.includes('otakufiles.net') &&
    !url.includes('krakenfiles.com') &&
    !url.includes('.mkv');

  // Build available qualities for single episode
  const qualityOptions: QualityOption[] = useMemo(() => {
    const sources = (currentSources && currentSources.length > 0)
      ? currentSources
      : (currentEp.sources && currentEp.sources.length > 0)
      ? currentEp.sources
      : [];

    const real1080 = sources.find((s) => s.quality === '1080p' && isRealSource(s.url))?.url;
    const real720 = sources.find((s) => s.quality === '720p' && isRealSource(s.url))?.url;
    const real480 = sources.find((s) => s.quality === '480p' && isRealSource(s.url))?.url;
    const fallbackStream = sources.find((s) => isRealSource(s.url))?.url || sources[0]?.url || '';

    const dur = currentEp.duration || 1440;

    return [
      {
        quality: '1080p',
        label: '1080p Full HD',
        badge: 'FHD',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        description: 'Kualitas video paling tajam dan jernih untuk PC & Smart TV.',
        url: real1080 || fallbackStream,
        size: estimateEpisodeSize(dur, '1080p'),
        isReal: Boolean(real1080 || fallbackStream),
      },
      {
        quality: '720p',
        label: '720p High Definition',
        badge: 'HD (Rekomendasi)',
        badgeColor: 'bg-sunset/20 text-sunset border-sunset/40',
        description: 'Kualitas seimbang, lancar dan jernih untuk HP, tablet & laptop.',
        url: real720 || real1080 || fallbackStream,
        size: estimateEpisodeSize(dur, '720p'),
        isReal: Boolean(real720 || real1080 || fallbackStream),
      },
      {
        quality: '480p',
        label: '480p Standar',
        badge: 'SD',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        description: 'Hemat kuota data dan hemat penyimpanan memori internal.',
        url: real480 || real720 || fallbackStream,
        size: estimateEpisodeSize(dur, '480p'),
        isReal: Boolean(real480 || real720 || fallbackStream),
      },
      {
        quality: '360p',
        label: '360p Hemat Kuota',
        badge: 'Lite',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        description: 'Ukuran file sangat kecil untuk jaringan internet terbatas.',
        url: real480 || fallbackStream,
        size: estimateEpisodeSize(dur, '360p'),
        isReal: Boolean(real480 || fallbackStream),
      },
    ];
  }, [currentSources, currentEp]);

  // Handle single download
  const handleDownload = useCallback((opt: QualityOption) => {
    const filename = formatEpisodeFilename(anime.title, currentEp.number, String(opt.quality));
    const downloadUrl = buildDownloadUrl(opt.url, filename);

    setDownloadToast(`Memulai unduhan EP ${currentEp.number} (${opt.quality})...`);
    triggerDownloadFile(downloadUrl, filename);

    setTimeout(() => {
      setDownloadToast(null);
    }, 4000);
  }, [anime.title, currentEp.number]);

  // Handle copy single download link
  const handleCopyLink = useCallback(async (opt: QualityOption, id: string) => {
    const filename = formatEpisodeFilename(anime.title, currentEp.number, String(opt.quality));
    const downloadUrl = buildDownloadUrl(opt.url, filename);
    const fullUrl = downloadUrl.startsWith('http')
      ? downloadUrl
      : `${window.location.origin}${downloadUrl}`;

    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }, [anime.title, currentEp.number]);

  // Toggle selection for batch episode
  const toggleEpisodeSelect = (epNum: number) => {
    setSelectedEpisodes((prev) =>
      prev.includes(epNum) ? prev.filter((n) => n !== epNum) : [...prev, epNum].sort((a, b) => a - b)
    );
  };

  const handleSelectAllEpisodes = () => {
    if (selectedEpisodes.length === allEpisodes.length) {
      setSelectedEpisodes([]);
    } else {
      setSelectedEpisodes(allEpisodes.map((e) => e.number));
    }
  };

  // Generate batch links formatted text
  const generateBatchLinksText = useCallback(() => {
    const epsToExport = allEpisodes.filter((e) => selectedEpisodes.includes(e.number));
    const lines: string[] = [];

    lines.push(`# ========================================================`);
    lines.push(`# YOWANIME DOWNLOAD LINKS`);
    lines.push(`# Anime: ${anime.title}`);
    lines.push(`# Kualitas: ${selectedBatchQuality}`);
    lines.push(`# Total: ${epsToExport.length} Episode`);
    lines.push(`# ========================================================\n`);

    for (const ep of epsToExport) {
      const src =
        ep.sources?.find((s) => s.quality === selectedBatchQuality)?.url ||
        ep.sources?.[0]?.url ||
        '';
      const filename = formatEpisodeFilename(anime.title, ep.number, selectedBatchQuality);
      const dlUrl = buildDownloadUrl(src, filename);
      const fullUrl = dlUrl.startsWith('http') ? dlUrl : `${window.location.origin}${dlUrl}`;

      lines.push(`# Episode ${ep.number}: ${ep.title || `Episode ${ep.number}`}`);
      lines.push(fullUrl);
      lines.push('');
    }

    return lines.join('\n');
  }, [allEpisodes, selectedEpisodes, anime.title, selectedBatchQuality]);

  // Copy batch links to clipboard
  const handleCopyBatchLinks = async () => {
    const text = generateBatchLinksText();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId('batch-all');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Download links as a .txt file
  const handleDownloadBatchTxt = () => {
    const text = generateBatchLinksText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `[Yowanime] ${anime.title} - Download Links [${selectedBatchQuality}].txt`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  };

  // Sequential batch browser download
  const handleRunBatchDownload = async () => {
    const epsToDownload = allEpisodes.filter((e) => selectedEpisodes.includes(e.number));
    if (epsToDownload.length === 0) return;

    setIsBatchDownloading(true);
    setBatchProgress({ current: 0, total: epsToDownload.length });

    for (let i = 0; i < epsToDownload.length; i++) {
      const ep = epsToDownload[i];
      setBatchProgress({ current: i + 1, total: epsToDownload.length });

      const src =
        ep.sources?.find((s) => s.quality === selectedBatchQuality)?.url ||
        ep.sources?.[0]?.url ||
        '';
      const filename = formatEpisodeFilename(anime.title, ep.number, selectedBatchQuality);
      const dlUrl = buildDownloadUrl(src, filename);

      triggerDownloadFile(dlUrl, filename);

      // Wait 1.4s between downloads so browser doesn't block spam downloads
      if (i < epsToDownload.length - 1) {
        await new Promise((r) => setTimeout(r, 1400));
      }
    }

    setIsBatchDownloading(false);
    setBatchProgress(null);
    setDownloadToast(`Selesai memicu unduhan ${epsToDownload.length} episode!`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl bg-canvas-card border border-hairline/80 rounded-[14px] sm:rounded-[16px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Toast Notification inside modal */}
        {downloadToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-emerald-500/95 text-white text-xs font-display px-4 py-2 rounded-full shadow-xl backdrop-blur-md border border-emerald-400/30 animate-fade-in-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{downloadToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-hairline/60 bg-gradient-to-r from-canvas-soft via-canvas-card to-canvas-soft flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-full bg-sunset/20 border border-sunset/30 flex items-center justify-center text-sunset shrink-0 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="eyebrow-mono text-sunset text-[10px]">DOWNLOAD CENTER</span>
                <span className="text-[10px] font-mono text-mute">· Subtitle Indonesia</span>
              </div>
              <h2 id="download-modal-title" className="text-sm sm:text-base font-display font-bold text-white truncate leading-tight">
                {anime.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-mute hover:text-white bg-white/5 hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher (Episode Ini vs Batch Download) */}
        <div className="flex border-b border-hairline/60 bg-canvas/60 px-4 sm:px-5 shrink-0">
          <button
            onClick={() => setActiveTab('single')}
            className={clsx(
              'py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-display font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
              activeTab === 'single'
                ? 'border-sunset text-sunset'
                : 'border-transparent text-mute hover:text-white'
            )}
          >
            <span>Unduh Episode {currentEp.number}</span>
            <span className="text-[10px] font-mono bg-sunset/15 text-sunset px-1.5 py-0.5 rounded-full">
              EP {currentEp.number}
            </span>
          </button>

          {allEpisodes.length > 1 && (
            <button
              onClick={() => setActiveTab('batch')}
              className={clsx(
                'py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-display font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'batch'
                  ? 'border-sunset text-sunset'
                  : 'border-transparent text-mute hover:text-white'
              )}
            >
              <span>Batch Download</span>
              <span className="text-[10px] font-mono bg-white/10 text-white/80 px-1.5 py-0.5 rounded-full">
                {allEpisodes.length} EP
              </span>
            </button>
          )}
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* ════ TAB 1: SINGLE EPISODE DOWNLOAD ════ */}
          {activeTab === 'single' && (
            <div className="space-y-4">
              {/* Episode Info Banner */}
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-canvas-soft border border-hairline">
                <div className="relative w-20 h-12 rounded-[6px] overflow-hidden bg-black shrink-0 border border-white/10">
                  <img
                    src={currentEp.thumbnail || anime.poster}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[8px] font-mono font-bold px-1 rounded">
                    EP {currentEp.number}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sunset font-bold text-xs">Episode {currentEp.number}</span>
                    <span className="text-mute text-xs">·</span>
                    <span className="text-[11px] font-mono text-mute">{anime.type}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-display font-medium text-white truncate">
                    {currentEp.title || `Episode ${currentEp.number}`}
                  </p>
                </div>
              </div>

              {/* Quality Options List */}
              <div className="space-y-2.5">
                <p className="eyebrow-mono text-mute text-[10px]">PILIH KUALITAS VIDEO MP4</p>

                {qualityOptions.map((opt) => {
                  const isCopied = copiedId === `single-${opt.quality}`;

                  return (
                    <div
                      key={opt.quality}
                      className="p-3 sm:p-3.5 rounded-[10px] bg-canvas-soft border border-hairline/80 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      {/* Quality Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('text-[10px] font-mono font-bold px-2 py-0.5 rounded border', opt.badgeColor)}>
                            {opt.badge}
                          </span>
                          <span className="text-xs sm:text-sm font-display font-semibold text-white">
                            {opt.label}
                          </span>
                          <span className="text-[10px] font-mono bg-white/5 text-white/70 px-1.5 py-0.5 rounded border border-white/10">
                            {opt.size}
                          </span>
                        </div>
                        <p className="text-[11px] text-body font-display mt-1">
                          {opt.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Copy Link Button */}
                        <button
                          onClick={() => handleCopyLink(opt, `single-${opt.quality}`)}
                          title="Salin link download"
                          className={clsx(
                            'p-2 rounded-full border text-xs font-display flex items-center gap-1.5 transition-colors cursor-pointer',
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-canvas border-hairline text-mute hover:text-white hover:border-white/30'
                          )}
                        >
                          {isCopied ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                              <span className="text-[10px] font-mono font-bold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span className="text-[10px] font-mono">Salin</span>
                            </>
                          )}
                        </button>

                        {/* Direct Download Button */}
                        <button
                          onClick={() => handleDownload(opt)}
                          className="bg-sunset hover:bg-sunset/90 text-white font-display font-medium text-xs px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-md shadow-sunset/20 cursor-pointer active:scale-95"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>Unduh</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ TAB 2: BATCH DOWNLOAD ════ */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              {/* Batch Controls: Quality & Select All */}
              <div className="p-3 rounded-[10px] bg-canvas-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-display text-mute">Pilih Kualitas:</span>
                  <div className="flex items-center gap-1 bg-canvas p-1 rounded-[8px] border border-hairline">
                    {['1080p', '720p', '480p'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setSelectedBatchQuality(q)}
                        className={clsx(
                          'px-2.5 py-1 text-[11px] font-mono rounded-[6px] transition-colors cursor-pointer',
                          selectedBatchQuality === q
                            ? 'bg-sunset text-white font-bold shadow-sm'
                            : 'text-mute hover:text-white'
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllEpisodes}
                    className="text-xs font-display text-sunset hover:underline cursor-pointer font-medium"
                  >
                    {selectedEpisodes.length === allEpisodes.length ? 'Batalkan Semua' : 'Pilih Semua'}
                  </button>
                  <span className="text-[11px] font-mono text-mute">
                    ({selectedEpisodes.length}/{allEpisodes.length} Terpilih)
                  </span>
                </div>
              </div>

              {/* Episode Checkboxes Grid */}
              <div className="space-y-1.5">
                <p className="eyebrow-mono text-mute text-[10px]">PILIH EPISODE UNTUK DIUNDUH</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar p-1">
                  {allEpisodes.map((ep) => {
                    const isSelected = selectedEpisodes.includes(ep.number);
                    return (
                      <button
                        key={ep.id}
                        onClick={() => toggleEpisodeSelect(ep.number)}
                        className={clsx(
                          'h-9 rounded-[6px] text-xs font-mono font-bold transition-all border cursor-pointer flex items-center justify-center relative',
                          isSelected
                            ? 'bg-sunset text-white border-sunset shadow-sm'
                            : 'bg-canvas-soft text-mute border-hairline hover:text-white hover:border-white/30'
                        )}
                      >
                        <span>EP {ep.number}</span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center text-[7px] text-sunset">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Batch Actions Bar */}
              <div className="pt-2 border-t border-hairline/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Copy All Links */}
                  <button
                    onClick={handleCopyBatchLinks}
                    disabled={selectedEpisodes.length === 0}
                    className="w-full sm:flex-1 bg-canvas-soft border border-hairline hover:border-white/30 text-white font-display text-xs px-4 py-2.5 rounded-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>
                      {copiedId === 'batch-all'
                        ? 'Semua Link Berhasil Disalin! ✓'
                        : `Salin Link Batch (${selectedEpisodes.length} EP)`}
                    </span>
                  </button>

                  {/* Export as .txt */}
                  <button
                    onClick={handleDownloadBatchTxt}
                    disabled={selectedEpisodes.length === 0}
                    title="Unduh daftar URL sebagai file teks untuk IDM"
                    className="w-full sm:w-auto bg-canvas-soft border border-hairline hover:border-white/30 text-white font-display text-xs px-3.5 py-2.5 rounded-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>File .txt</span>
                  </button>

                  {/* Sequential Batch Download */}
                  <button
                    onClick={handleRunBatchDownload}
                    disabled={selectedEpisodes.length === 0 || isBatchDownloading}
                    className="w-full sm:flex-1 bg-sunset hover:bg-sunset/90 text-white font-display font-semibold text-xs px-4 py-2.5 rounded-[10px] flex items-center justify-center gap-2 transition-all shadow-md shadow-sunset/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isBatchDownloading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mengunduh {batchProgress?.current}/{batchProgress?.total}...</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Download Beruntun</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Download Tips & Recommendations */}
          <div className="p-3 rounded-[10px] bg-canvas/40 border border-hairline/60 text-[11px] text-mute font-display space-y-1">
            <div className="flex items-center gap-1.5 text-white/90 font-medium">
              <span>💡</span>
              <span>Tips Pengunduhan:</span>
            </div>
            <p className="leading-relaxed">
              Gunakan fitur <strong className="text-white">"Salin"</strong> lalu paste link ke download manager seperti <strong className="text-sunset">IDM</strong> (PC) atau <strong className="text-sunset">1DM</strong> (Android) untuk kecepatan download hingga 5x lebih kencang serta mendukung jeda (pause) & lanjutkan (resume).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-hairline/60 bg-canvas-soft/80 flex items-center justify-between shrink-0 text-[10px] sm:text-[11px] text-mute font-mono">
          <span>Format: MP4 (H.264 / AAC)</span>
          <button
            onClick={onClose}
            className="text-white hover:text-sunset transition-colors cursor-pointer font-display"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
