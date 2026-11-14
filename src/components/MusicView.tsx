import React, { useState } from 'react';
import {
  FileText,
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

interface MusicViewProps {
  music: MusicState;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onCycleTrack: (step: number) => void;
  onSelectTrack: (trackId: string) => void;
  onChangeVolume: (vol: number) => void;
  onToggleFavTrack: (trackId: string) => void;
  onToggleOnlyFavs: () => void;
  onSetSleepTimer: (minutes: number) => void;
}

export const MusicView: React.FC<MusicViewProps> = ({
  music,
  onTogglePlay,
  onToggleMute,
  onCycleTrack,
  onSelectTrack,
  onChangeVolume,
  onToggleFavTrack,
  onToggleOnlyFavs,
  onSetSleepTimer,
}) => {
  const [creditsOpen, setCreditsOpen] = useState(false);

  const currentTrack =
    SOUND_TRACKS.find((t) => t.id === music.currentTrackId) || SOUND_TRACKS[0];
  const isFavCurrent = music.favTrackIds.includes(currentTrack.id);
  const visibleTracks = SOUND_TRACKS.filter(
    (t) => !music.onlyFavs || music.favTrackIds.includes(t.id)
  );

  const sleepMinutesLeft =
    music.sleepSecondsLeft > 0 ? Math.ceil(music.sleepSecondsLeft / 60) : 0;

  return (
    <section className="space-y-6">
      <div className="glass-surface rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-500">
            Áudio Procedural & Foco Contínuo
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Músicas & Paisagens Sonoras
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Toque em segundo plano durante tarefas, leituras ou meditação (100% livre de licença).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleOnlyFavs}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              music.onlyFavs
                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${music.onlyFavs ? 'fill-rose-500' : ''}`} />
            <span>Favoritas</span>
          </button>
          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Créditos</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Master Audio Player */}
        <div className="lg:col-span-5 glass-surface rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl ${currentTrack.grad} text-white flex items-center justify-center text-3xl shadow-md shrink-0`}
            >
              {currentTrack.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className={`text-xs font-semibold ${
                  music.playing ? 'text-emerald-500' : 'text-slate-400'
                }`}
              >
                {music.playing
                  ? music.muted
                    ? 'Tocando (Mudo)'
                    : 'Tocando em 2º plano'
                  : 'Pausado'}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-slate-400 truncate">{currentTrack.origin}</p>
            </div>
            <button
              type="button"
              onClick={() => onToggleFavTrack(currentTrack.id)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.07] text-slate-400 hover:text-rose-500"
              aria-label="Favoritar faixa atual"
            >
              <Heart
                className={`w-4 h-4 ${isFavCurrent ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08]">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate pr-2">
              {music.playing
                ? music.muted
                  ? 'Áudio silenciado (Mute ativo)'
                  : `Reproduzindo: ${currentTrack.title}`
                : 'Motor de áudio pronto'}
            </span>
            <div
              className={`flex items-end gap-1 h-4 shrink-0 ${
                music.playing && !music.muted ? 'eq-playing' : ''
              }`}
            >
              <span className="w-1 bg-emerald-500 rounded-full h-2" />
              <span className="w-1 bg-indigo-500 rounded-full h-3" />
              <span className="w-1 bg-purple-500 rounded-full h-1.5" />
              <span className="w-1 bg-rose-500 rounded-full h-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCycleTrack(-1)}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 transition"
              title="Faixa Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onTogglePlay}
              className="flex-1 min-h-[44px] py-3 px-4 rounded-xl pyr-grad-estima text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition"
            >
              {music.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{music.playing ? 'Pausar Som' : 'Reproduzir Agora'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold transition ${
                music.muted
                  ? 'bg-rose-500/15 text-rose-500'
                  : 'bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-200'
              }`}
              title="Silenciar / Ativar Som"
            >
              {music.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => onCycleTrack(1)}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 transition"
              title="Próxima Faixa"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Volume do Ambiente</span>
              <span className="font-mono-num">{music.volume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={music.volume}
              onChange={(e) => onChangeVolume(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                Temporizador de Desligamento
              </span>
              <span className="font-mono-num font-bold text-indigo-500">
                {sleepMinutesLeft > 0 ? `${sleepMinutesLeft}m restantes` : 'Desativado'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 10, 20, 30, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSetSleepTimer(m)}
                  className={`min-h-[36px] py-1.5 rounded-xl text-xs font-semibold transition ${
                    (m === 0 && sleepMinutesLeft === 0) ||
                    (m > 0 && sleepMinutesLeft > 0 && sleepMinutesLeft <= m && sleepMinutesLeft > m - 10)
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m === 0 ? 'Off' : `${m}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tracks Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleTracks.map((tr) => {
            const active = tr.id === music.currentTrackId;
            const fav = music.favTrackIds.includes(tr.id);
            return (
              <div
                key={tr.id}
                onClick={() => onSelectTrack(tr.id)}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                  active
                    ? 'bg-indigo-500/10 border-indigo-500/40'
                    : 'glass-surface hover:opacity-90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl ${tr.grad} text-white flex items-center justify-center text-lg shrink-0`}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavTrack(tr.id);
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-500 shrink-0"
                  aria-label="Favoritar faixa"
                >
                  <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {creditsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCreditsOpen(false)}
        >
          <div
            className="glass-surface rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Créditos de Áudio & Licenças
              </h3>
              <button
                type="button"
                onClick={() => setCreditsOpen(false)}
                className="p-1.5 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-3 text-xs text-slate-600 dark:text-slate-300 pr-1">
              <p className="leading-relaxed">
                <strong>Geração Nativa (Domínio Público / CC0):</strong> Todos os ruídos (Branco, Marrom e Rosa) e sintetizadores acústicos (Chuva, Ondas, Floresta, Piano, Instrumental e Meditação 432Hz) são gerados matematicamente em tempo real via Web Audio API diretamente no navegador — 100% livres de direitos autorais e funcionam offline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreditsOpen(false)}
              className="w-full min-h-[42px] py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
