import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Heart,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { SOUND_TRACKS } from '../data/ideas';
import type { MusicState } from '../types/impulso';

interface MusicPopupModalProps {
  open: boolean;
  music: MusicState;
  onClose: () => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onCycleTrack: (step: number) => void;
  onSelectTrack: (trackId: string) => void;
  onChangeVolume: (vol: number) => void;
  onToggleFavTrack: (trackId: string) => void;
}

export const MusicPopupModal: React.FC<MusicPopupModalProps> = ({
  open,
  music,
  onClose,
  onTogglePlay,
  onToggleMute,
  onCycleTrack,
  onSelectTrack,
  onChangeVolume,
  onToggleFavTrack,
}) => {
  const shouldReduceMotion = useReducedMotion();
  if (!open) return null;

  const currentTrack =
    SOUND_TRACKS.find((t) => t.id === music.currentTrackId) || SOUND_TRACKS[0];
  const isFav = music.favTrackIds.includes(currentTrack.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Trilha Sonora & Músicas Geradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Áudios de apoio para foco e conexão
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar player de música"
            className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Now Playing Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] space-y-3.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${currentTrack.grad} text-white flex items-center justify-center text-2xl shrink-0`}
            >
              {currentTrack.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold accent-text">
                {music.playing ? (music.muted ? 'Mudo' : 'Tocando agora') : 'Pausado'}
              </p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {currentTrack.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onToggleFavTrack(currentTrack.id)}
              className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500"
              aria-label="Favoritar música"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCycleTrack(-1)}
              aria-label="Música anterior"
              className="min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl accent-bg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {music.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{music.playing ? 'Pausar' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label="Silenciar áudio"
              className="min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200"
            >
              {music.muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onCycleTrack(1)}
              aria-label="Passar música"
              className="min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-500">Volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={music.volume}
              onChange={(e) => onChangeVolume(parseInt(e.target.value, 10))}
              className="flex-1 accent-[var(--accent)] cursor-pointer"
            />
            <span className="font-mono-num text-[11px] text-slate-500 w-8 text-right">
              {music.volume}%
            </span>
          </div>
        </div>

        {/* All Generated Tracks */}
        <div className="overflow-y-auto space-y-2 pr-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Todas as músicas geradas ({SOUND_TRACKS.length})
          </p>
          {SOUND_TRACKS.map((tr) => {
            const active = tr.id === music.currentTrackId;
            return (
              <button
                key={tr.id}
                type="button"
                onClick={() => onSelectTrack(tr.id)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition ${
                  active
                    ? 'accent-soft-bg accent-border'
                    : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.08] hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl ${tr.grad} text-white flex items-center justify-center text-base shrink-0`}
                  >
                    {tr.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tr.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{tr.origin}</p>
                  </div>
                </div>
                {active && music.playing && (
                  <div className="flex items-end gap-0.5 h-3.5 shrink-0 eq-playing">
                    <span className="w-1 bg-current rounded-full h-2" />
                    <span className="w-1 bg-current rounded-full h-3" />
                    <span className="w-1 bg-current rounded-full h-1.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
