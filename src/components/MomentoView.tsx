import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Camera,
  Check,
  Clock,
  FileText,
  ListTodo,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { CATEGORY_META, ENERGY_META, PYRAMID_FIXED_PALETTE } from '../data/ideas';
import { formatTimeClock } from '../utils/profileCorrelation';
import type {
  FocusTarget,
  Idea,
  IndependentReminderCard,
  QueueItem,
  TimerState,
} from '../types/impulso';

interface MomentoViewProps {
  target: FocusTarget;
  matchedQueue: QueueItem[];
  favoriteIdeas: Idea[];
  favoriteReminders: IndependentReminderCard[];
  rejectedIdeas: Idea[];
  checkedSteps: Record<number, boolean>;
  scratchpad: string;
  timer: TimerState;
  musicPlaying: boolean;
  onToggleStep: (stepIdx: number) => void;
  onAddSubStep: (text: string) => void;
  onUpdateScratchpad: (text: string) => void;
  onCompleteTaskWithRatings: (mastery: number, pleasure: number) => void;
  onFinishCelebration?: () => void;
  onCreateMemory: () => void;
  onSelectQueueItemToFocus: (item: QueueItem) => void;
  onToggleQueueItem: (id: string) => void;
  onDeleteQueueItem: (id: string) => void;
  onSelectFavoriteIdeaToFocus: (idea: Idea) => void;
  onSelectFavoriteReminderToFocus: (rem: IndependentReminderCard) => void;
  onToggleFavoriteIdea: (id: string) => void;
  onToggleFavoriteReminder: (id: string) => void;
  onRestoreRejectedIdea: (id: string) => void;
  onMatchRejectedIdea: (idea: Idea) => void;
  onRestoreAllRejected: () => void;
  onOpenTimerPopup: () => void;
  onToggleTimerPlay: () => void;
  onOpenMusicPopup: () => void;
}

const CONFETTI_COLORS = [
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  'var(--accent)',
];

const CONFETTI_PARTICLES = Array.from({ length: 38 }, (_, idx) => {
  const angle = (idx * 137.5 * Math.PI) / 180;
  const dist = 90 + ((idx * 37) % 165);
  const peakX = Math.cos(angle) * dist;
  const peakY = Math.sin(angle) * dist - 65;
  const endY = peakY + 135 + ((idx * 29) % 95);
  const rotate = (idx % 2 === 0 ? 1 : -1) * (220 + ((idx * 53) % 320));
  const width = idx % 3 === 0 ? 10 : idx % 3 === 1 ? 8 : 12;
  const height = idx % 3 === 0 ? 10 : idx % 3 === 1 ? 14 : 6;
  const isCircle = idx % 4 === 0;
  return {
    id: idx,
    peakX,
    peakY,
    endY,
    rotate,
    width,
    height,
    isCircle,
    color: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
    delay: (idx % 6) * 0.028,
    duration: 1.15 + (idx % 5) * 0.14,
  };
});

export const MomentoView: React.FC<MomentoViewProps> = ({
  target,
  matchedQueue,
  favoriteIdeas,
  favoriteReminders,
  rejectedIdeas,
  checkedSteps,
  scratchpad,
  timer,
  musicPlaying,
  onToggleStep,
  onAddSubStep,
  onUpdateScratchpad,
  onCompleteTaskWithRatings,
  onFinishCelebration,
  onCreateMemory,
  onSelectQueueItemToFocus,
  onToggleQueueItem,
  onDeleteQueueItem,
  onSelectFavoriteIdeaToFocus,
  onSelectFavoriteReminderToFocus,
  onToggleFavoriteIdea,
  onToggleFavoriteReminder,
  onRestoreRejectedIdea,
  onMatchRejectedIdea,
  onRestoreAllRejected,
  onOpenTimerPopup,
  onToggleTimerPlay,
  onOpenMusicPopup,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [matchedOpen, setMatchedOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);

  // Post-completion Mastery & Pleasure check-in modal (Behavioral Activation)
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [mastery, setMastery] = useState(7);
  const [pleasure, setPleasure] = useState(7);
  const [celebrationData, setCelebrationData] = useState<{ title: string; xp: number } | null>(
    null
  );
  const [pureTimerMode, setPureTimerMode] = useState(false);

  useEffect(() => {
    if (!pureTimerMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPureTimerMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pureTimerMode]);

  const doneCount = target.steps.filter((_, idx) => !!checkedSteps[idx]).length;
  const pct = target.steps.length > 0 ? Math.round((doneCount / target.steps.length) * 100) : 0;

  const displayedClockSeconds =
    timer.clockType === 'stopwatch'
      ? timer.stopwatchSeconds
      : timer.clockType === 'journey'
        ? timer.journeySecondsLeft
        : timer.secondsLeft;

  const hueBase = (() => {
    if (timer.clockType === 'stopwatch') {
      return (198 + timer.stopwatchSeconds * 2.4) % 360;
    }
    if (timer.clockType === 'journey') {
      const elapsedToday = 86400 - timer.journeySecondsLeft;
      return (212 + elapsedToday * 1.4) % 360;
    }
    const total = Math.max(1, timer.totalSeconds);
    const elapsed = Math.max(0, total - timer.secondsLeft);
    const progress = Math.min(1, elapsed / total);
    return (218 + progress * 155 + elapsed * 0.65) % 360;
  })();

  const h1 = Math.round(hueBase);
  const h2 = Math.round((hueBase + 40) % 360);
  const h3 = Math.round((hueBase + 85) % 360);
  const dynamicTimerGradient = `radial-gradient(circle at 22% 25%, hsl(${h2} 76% 36% / 0.88) 0%, transparent 56%), radial-gradient(circle at 78% 76%, hsl(${h3} 74% 34% / 0.78) 0%, transparent 56%), linear-gradient(145deg, hsl(${h1} 68% 18%) 0%, hsl(${h2} 66% 24%) 50%, hsl(${h3} 64% 15%) 100%)`;

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    onAddSubStep(trimmed);
    setNewStepText('');
    setShowAddStep(false);
  };

  return (
    <section className="relative h-full min-h-0 flex flex-col">
      {/* Fixed Top Icon Bar Floating Over Scroll: Left = Recycle Icon, Right = Pure Timer Icon */}
      <div className="pointer-events-none absolute top-[max(0.75rem,env(safe-area-inset-top))] md:top-0 inset-x-0 z-20 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setRecycleOpen(true)}
          aria-label="Reciclar tarefas rejeitadas"
          title="Reciclar / Rever tarefas rejeitadas"
          className="pointer-events-auto w-11 h-11 rounded-full liquid-glass-pill flex items-center justify-center shrink-0 hover:opacity-95 active:scale-90 transition-all duration-150"
        >
          <RefreshCw className="w-[18px] h-[18px] text-emerald-500" />
        </button>

        <button
          type="button"
          onClick={() => setPureTimerMode(true)}
          aria-label="Apenas Cronômetro"
          title="Ocultar controles e mostrar apenas o cronômetro"
          className="pointer-events-auto w-11 h-11 rounded-full liquid-glass-pill flex items-center justify-center shrink-0 hover:opacity-95 active:scale-90 transition-all duration-150"
        >
          <Maximize2 className="w-[18px] h-[18px] accent-text" />
        </button>
      </div>

      {/* Main Content: Clean Execution Focus (Scrolls cleanly underneath fixed top icons) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain no-scrollbar pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] md:pt-14 pb-40 sm:pb-28">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Clean Execution Panel (No Cognitive Antidote here per user instruction) */}
        <div className="glass-surface rounded-3xl p-6 space-y-5">
          <div className="space-y-2 pb-4 border-b border-slate-200/70 dark:border-white/[0.08]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold accent-text">
                {CATEGORY_META[target.category]?.label || 'Em Execução'}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {target.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
              {target.time} min · Energia {ENERGY_META[target.energy]} · +{target.xp} XP
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {target.description}
            </p>
          </div>

          {/* Step Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Roteiro de Execução
              </h4>
              <span className="font-mono-num text-xs font-semibold text-slate-500">
                {doneCount}/{target.steps.length} ({pct}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/70 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full accent-bg transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            <ul className="space-y-2 pt-1">
              {target.steps.map((step, idx) => {
                const isChecked = !!checkedSteps[idx];
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => onToggleStep(idx)}
                      className={`w-full min-h-[44px] p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/25'
                          : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.08]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 transition ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 text-slate-400'
                        }`}
                      >
                        {isChecked ? <Check className="w-3 h-3" /> : idx + 1}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          isChecked
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {step}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddStep((v) => !v)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar passo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScratchpad((v) => !v)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Anotações</span>
              </button>
            </div>

            {showAddStep && (
              <form onSubmit={handleAddStep} className="flex gap-2">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder="Novo micro-passo..."
                  className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl accent-bg text-xs font-semibold"
                >
                  Salvar
                </button>
              </form>
            )}

            {showScratchpad && (
              <textarea
                rows={3}
                value={scratchpad}
                onChange={(e) => onUpdateScratchpad(e.target.value)}
                placeholder="Reflexões ou anotações rápidas durante esta atividade..."
                className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
              />
            )}
          </div>

          {/* Primary Actions */}
          <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setCheckInOpen(true)}
              className="flex-1 min-h-[46px] py-3 px-5 rounded-xl accent-bg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Concluir Tarefa (+{target.xp} XP)</span>
            </button>
            <button
              type="button"
              onClick={onCreateMemory}
              className="min-h-[46px] py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Registrar Foto</span>
            </button>
          </div>
        </div>

        {/* Bottom Trigger for Matched Tasks Pop-up */}
        <button
          type="button"
          onClick={() => setMatchedOpen(true)}
          className="w-full min-h-[50px] px-5 py-3 rounded-2xl glass-surface flex items-center justify-between gap-3 hover:opacity-95 transition"
        >
          <span className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            <ListTodo className="w-4 h-4 accent-text" />
            <span>Tarefas que Deram Match</span>
          </span>
          <span className="font-mono-num text-xs font-semibold px-2.5 py-1 rounded-full accent-soft-bg accent-text">
            {matchedQueue.length}
          </span>
        </button>

        {/* Bottom Trigger for Favorites Pop-up (Below Matched Tasks) */}
        <button
          type="button"
          onClick={() => setFavoritesOpen(true)}
          className="w-full min-h-[50px] px-5 py-3 rounded-2xl glass-surface flex items-center justify-between gap-3 hover:opacity-95 transition"
        >
          <span className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Favoritos</span>
          </span>
          <span className="font-mono-num text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {favoriteIdeas.length + favoriteReminders.length}
          </span>
        </button>
      </div>
      </div>

      {/* Fixed Bottom Bar EXCLUSIVE to 4th Tab (Momento): Timer Icon + Fixed Clock + Music Icon */}
      <div className="pointer-events-none absolute bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+4.25rem))] md:bottom-4 inset-x-0 md:left-auto md:right-0 md:w-96 z-30">
        <div className="pointer-events-auto max-w-lg mx-auto rounded-2xl glass-dock px-3 py-2 flex items-center justify-between gap-2 shadow-xl">
          {/* Left: Timer/Clock Options Button */}
          <button
            type="button"
            onClick={onOpenTimerPopup}
            aria-label="Opções de relógio e cronômetro"
            title="Tipos de Relógio & Cronômetro"
            className="min-w-[44px] min-h-[40px] px-2.5 rounded-xl accent-soft-bg flex items-center gap-1.5 text-xs font-semibold"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Relógio</span>
          </button>

          {/* Center: Fixed Live Time Readout + Quick Play/Pause */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTimerPopup}
              className="font-mono-num text-base font-bold text-slate-900 dark:text-white tracking-tight px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            >
              {formatTimeClock(displayedClockSeconds)}
            </button>
            {timer.clockType !== 'journey' && (
              <button
                type="button"
                onClick={onToggleTimerPlay}
                aria-label={timer.running ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
                className="w-8 h-8 rounded-full accent-bg flex items-center justify-center"
              >
                {timer.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
            )}
          </div>

          {/* Right: Music Icon EXCLUSIVE to 4th Tab */}
          <button
            type="button"
            onClick={onOpenMusicPopup}
            aria-label="Abrir pop-up de músicas"
            title="Músicas & Trilha Sonora"
            className={`min-w-[44px] min-h-[40px] px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition ${
              musicPlaying
                ? 'accent-bg'
                : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Música</span>
          </button>
        </div>
      </div>

      {/* Matched Tasks Pop-up */}
      {matchedOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setMatchedOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 accent-text" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tarefas que Deram Match ({matchedQueue.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Toque em uma tarefa para focar agora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMatchedOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {matchedQueue.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-200/70 dark:border-white/[0.08] space-y-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Nenhum match pendente ainda
                </p>
                <p className="text-[11px] text-slate-400">
                  Dê ❤️ no Swipe ou clique em "Fazer Agora" em Explorar.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {matchedQueue.map((item) => {
                  const isActive = item.title === target.title;
                  return (
                    <motion.div
                      key={item.id}
                      layout={!shouldReduceMotion}
                      onClick={() => {
                        onSelectQueueItemToFocus(item);
                        setMatchedOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                        isActive
                          ? 'accent-soft-bg accent-border'
                          : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.08] hover:bg-slate-100/70 dark:hover:bg-white/[0.06]'
                      } ${item.completed ? 'opacity-55' : ''}`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleQueueItem(item.id);
                          }}
                          aria-label="Concluir match"
                          className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold leading-snug ${
                              item.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
                            {item.time} min · +{item.xp} XP
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteQueueItem(item.id);
                        }}
                        aria-label="Remover tarefa"
                        className="min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favorites Pop-up (Tasks & Reminders starred from Swipe and Explorar) */}
      {favoritesOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setFavoritesOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Favoritos ({favoriteIdeas.length + favoriteReminders.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Toque em um favorito do Swipe ou Explorar para focar agora
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFavoritesOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {favoriteIdeas.length + favoriteReminders.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-200/70 dark:border-white/[0.08] space-y-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Nenhum favorito salvo ainda
                </p>
                <p className="text-[11px] text-slate-400">
                  Toque na ⭐ em qualquer cartão do Swipe ou de Explorar.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {favoriteIdeas.map((idea) => {
                  const isActive = idea.id === target.id;
                  return (
                    <motion.div
                      key={idea.id}
                      layout={!shouldReduceMotion}
                      onClick={() => {
                        onSelectFavoriteIdeaToFocus(idea);
                        setFavoritesOpen(false);
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                        isActive
                          ? 'accent-soft-bg accent-border'
                          : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.08] hover:bg-slate-100/70 dark:hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {idea.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-num">
                          {CATEGORY_META[idea.category]?.label} · {idea.time} min · +{idea.xp} XP
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoriteIdea(idea.id);
                        }}
                        aria-label="Remover dos favoritos"
                        className="min-w-[34px] min-h-[34px] rounded-lg flex items-center justify-center hover:bg-amber-500/10 shrink-0"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </button>
                    </motion.div>
                  );
                })}

                {favoriteReminders.map((rem) => (
                  <motion.div
                    key={rem.id}
                    layout={!shouldReduceMotion}
                    onClick={() => {
                      onSelectFavoriteReminderToFocus(rem);
                      setFavoritesOpen(false);
                    }}
                    className="p-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] cursor-pointer transition flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {rem.title}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Lembrete · {PYRAMID_FIXED_PALETTE[rem.tier].label}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavoriteReminder(rem.id);
                      }}
                      aria-label="Remover dos favoritos"
                      className="min-w-[34px] min-h-[34px] rounded-lg flex items-center justify-center hover:bg-amber-500/10 shrink-0"
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recycle / Rejected Tasks Pop-up (PDF Screen 4 Top-Left Green Recycle) */}
      {recycleOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setRecycleOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Lixeira & Reciclagem do Swipe
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tarefas pausadas ou rejeitadas para você refazer ou dar match
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecycleOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
              {rejectedIdeas.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-slate-200/70 dark:border-white/[0.08]">
                  <p className="text-sm font-medium text-slate-500">
                    Nenhuma tarefa rejeitada no momento
                  </p>
                </div>
              ) : (
                rejectedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] space-y-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {idea.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {idea.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRestoreRejectedIdea(idea.id)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.08] border border-slate-200/70 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Voltar p/ Swipe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onMatchRejectedIdea(idea);
                          setRecycleOpen(false);
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl accent-bg text-xs font-semibold"
                      >
                        Dar Match Agora
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {rejectedIdeas.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onRestoreAllRejected();
                  setRecycleOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
              >
                Restaurar Todas para o Swipe
              </button>
            )}
          </div>
        </div>
      )}

      {/* Behavioral Activation Mastery & Pleasure Check-in Pop-up */}
      {checkInOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setCheckInOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-xs font-semibold accent-text">Check-in Comportamental</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Como você se sentiu nesta tarefa?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registrar Domínio e Prazer ajuda a perceber avanços reais sem cobrança.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">Sensação de Domínio / Conquista</span>
                  <span className="font-mono-num accent-text">{mastery}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={mastery}
                  onChange={(e) => setMastery(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">Prazer / Significado</span>
                  <span className="font-mono-num accent-text">{pleasure}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={pleasure}
                  onChange={(e) => setPleasure(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckInOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCheckInOpen(false);
                  setCelebrationData({ title: target.title, xp: target.xp });
                  onCompleteTaskWithRatings(mastery, pleasure);
                }}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl accent-bg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar & Ganhar +{target.xp} XP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dopamine Completion Celebration & Confetti Overlay */}
      <AnimatePresence>
        {celebrationData && (
          <motion.div
            key="completion-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => {
              setCelebrationData(null);
              onFinishCelebration?.();
            }}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-5 overflow-hidden"
          >
            {/* Radial Shockwave Pulse */}
            {!shouldReduceMotion && (
              <motion.div
                initial={{ scale: 0.35, opacity: 0.75 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute w-48 h-48 rounded-full border-4 border-emerald-400/70"
              />
            )}

            {/* Confetti Burst Particles */}
            {!shouldReduceMotion && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
              >
                {CONFETTI_PARTICLES.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
                    animate={{
                      x: [0, p.peakX, p.peakX * 1.12],
                      y: [0, p.peakY, p.endY],
                      scale: [0.3, 1.15, 0.75],
                      opacity: [1, 1, 0],
                      rotate: [0, p.rotate * 0.65, p.rotate],
                    }}
                    transition={{
                      duration: p.duration,
                      delay: p.delay,
                      times: [0, 0.42, 1],
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                      width: p.width,
                      height: p.height,
                      backgroundColor: p.color,
                      borderRadius: p.isCircle ? '9999px' : '3px',
                    }}
                    className="absolute shadow-sm"
                  />
                ))}
              </div>
            )}

            {/* Center Celebration Card */}
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.65, y: 26 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.92, y: -12 }
              }
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full glass-surface rounded-3xl p-7 text-center space-y-4 shadow-2xl border border-emerald-500/25"
            >
              <motion.div
                initial={shouldReduceMotion ? undefined : { scale: 0, rotate: -25 }}
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { scale: [0, 1.22, 1], rotate: [-25, 10, 0] }
                }
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400/25 to-amber-400/25 border border-emerald-500/35 flex items-center justify-center text-emerald-500 relative"
              >
                <Trophy className="w-8 h-8 text-amber-400 drop-shadow-sm" />
                <motion.span
                  animate={
                    shouldReduceMotion ? undefined : { scale: [1, 1.3, 1], rotate: [0, 15, 0] }
                  }
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="absolute -top-1 -right-1 text-emerald-500"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.span>
              </motion.div>

              <div className="space-y-1">
                <motion.p
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="font-mono-num text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >
                  +{celebrationData.xp} XP Conquistados
                </motion.p>
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Tarefa Concluída!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {celebrationData.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCelebrationData(null);
                  onFinishCelebration?.();
                }}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl accent-bg text-xs font-semibold hover:opacity-95 active:scale-95 transition"
              >
                Escolher Próxima no Swipe
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modo Apenas Cronômetro (Oculta todos os controles não essenciais + gradiente dinâmico) */}
      <AnimatePresence>
        {pureTimerMode && (
          <motion.div
            key="pure-timer-overlay"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: dynamicTimerGradient,
              transition: 'background 1.1s linear',
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none"
          >
            <button
              type="button"
              onClick={() => setPureTimerMode(false)}
              aria-label="Mostrar controles novamente"
              className="fixed top-[max(1rem,env(safe-area-inset-top))] right-4 min-h-[44px] px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-xl border border-white/25 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Mostrar controles</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (timer.clockType !== 'journey') onToggleTimerPlay();
              }}
              aria-label={
                timer.clockType === 'journey'
                  ? 'Relógio ativo'
                  : timer.running
                    ? 'Pausar cronômetro'
                    : 'Iniciar cronômetro'
              }
              className="group flex flex-col items-center gap-6 focus:outline-none"
            >
              <span className="font-mono-num text-6xl sm:text-8xl md:text-9xl font-bold tracking-tight text-white drop-shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                {formatTimeClock(displayedClockSeconds)}
              </span>

              {timer.clockType !== 'journey' && (
                <span className="w-14 h-14 rounded-full bg-white/15 group-hover:bg-white/25 backdrop-blur-xl border border-white/25 text-white flex items-center justify-center shadow-xl transition">
                  {timer.running ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
