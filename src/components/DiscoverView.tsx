import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react';
import {
  ArrowUpRight,
  Bell,
  Brain,
  Check,
  Edit3,
  Filter,
  Heart,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  BIAS_ANTIDOTES,
  CATEGORY_META,
  ENERGY_META,
  INDEPENDENT_REMINDER_POOL,
  PYRAMID_FIXED_PALETTE,
} from '../data/ideas';
import { scoreIdeaForProfile, sortIdeasByProfile } from '../utils/profileCorrelation';
import type {
  BiasAntidote,
  EnergyLevel,
  FilterState,
  Idea,
  IdeaCategory,
  IndependentReminderCard,
  MaslowTierId,
  ThoughtReframeEntry,
  UserProfile,
  UserReminder,
} from '../types/impulso';

type SwipeDeckItem =
  | { kind: 'idea'; id: string; idea: Idea }
  | { kind: 'reminder'; id: string; reminder: IndependentReminderCard }
  | { kind: 'bias'; id: string; biasKey: string; bias: BiasAntidote };

interface DiscoverViewProps {
  ideas: Idea[];
  profile: UserProfile;
  spotlightId: string;
  filters: FilterState;
  dismissedUntil: Record<string, number>;
  reminders: UserReminder[];
  favIndependentRemIds: string[];
  thoughtLogs: ThoughtReframeEntry[];
  onSelectSpotlight: (id: string) => void;
  onUpdateFilters: (next: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSwipeLeft: (idea: Idea) => void;
  onSwipeRight: (idea: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onAddToQueue: (id: string) => void;
  onCompleteNow: (idea: Idea) => void;
  onDismissReminderCard: (card: IndependentReminderCard, nextId: string) => void;
  onSaveReminderFromSwipe: (card: IndependentReminderCard, nextId: string) => void;
  onCompleteReminderNow: (card: IndependentReminderCard, nextId: string) => void;
  onToggleFavIndependentRem: (remCardId: string) => void;
  onToggleReminderDone: (id: string) => void;
  onToggleFavoriteReminder: (id: string) => void;
  onSaveCustomReminder: (rem: {
    id?: string;
    title: string;
    tier: MaslowTierId;
    datetime: string;
  }) => void;
  onDeleteReminder: (id: string) => void;
  onStartAntidoteFocus: (biasKey: string, title: string, stepText: string, minutes: number) => void;
  onSaveThoughtLog: (entry: ThoughtReframeEntry) => void;
  onDismissBiasCard: (biasCardId: string, nextId: string) => void;
  onRestoreDismissed: () => void;
  onSpinRandom: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  ideas,
  profile,
  spotlightId,
  filters,
  dismissedUntil,
  reminders,
  favIndependentRemIds,
  thoughtLogs,
  onSelectSpotlight,
  onUpdateFilters,
  onResetFilters,
  onSwipeLeft,
  onSwipeRight,
  onToggleFavorite,
  onAddToQueue,
  onCompleteNow,
  onDismissReminderCard,
  onSaveReminderFromSwipe,
  onCompleteReminderNow,
  onToggleFavIndependentRem,
  onToggleReminderDone,
  onToggleFavoriteReminder,
  onSaveCustomReminder,
  onDeleteReminder,
  onStartAntidoteFocus,
  onSaveThoughtLog,
  onDismissBiasCard,
  onRestoreDismissed,
  onSpinRandom,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [biasesModalOpen, setBiasesModalOpen] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  // Reminder management modal state
  const [onlyFavSavedReminders, setOnlyFavSavedReminders] = useState(false);
  const [remFormOpen, setRemFormOpen] = useState(false);
  const [remEditId, setRemEditId] = useState('');
  const [remTitle, setRemTitle] = useState('');
  const [remTier, setRemTier] = useState<MaslowTierId>('fisiologico');
  const [remDatetime, setRemDatetime] = useState('');

  // Cognitive Bias Antidote / CBT Socratic Studio modal state
  const [activeBiasKey, setActiveBiasKey] = useState<string | null>(null);
  const [autoThought, setAutoThought] = useState('');
  const [evidenceFor, setEvidenceFor] = useState('');
  const [evidenceAgainst, setEvidenceAgainst] = useState('');
  const [balancedThought, setBalancedThought] = useState('');

  // Drag & Bouncy iOS spring animation state
  const shouldReduceMotion = useReducedMotion();
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const [enterMode, setEnterMode] = useState<'left' | 'right' | 'spin'>('right');
  const exitTimerRef = useRef<number | null>(null);

  const deckType = filters.deckType || 'all';
  const activeBias = activeBiasKey ? BIAS_ANTIDOTES[activeBiasKey] : null;

  const filteredCatalog = useMemo(() => {
    const base = sortIdeasByProfile(ideas, profile);
    return base.filter((idea) => {
      if (filters.energy !== 'all' && idea.energy !== filters.energy) return false;
      if (filters.category !== 'all' && idea.category !== filters.category) return false;
      if (filters.time !== 'all') {
        const maxTime = parseInt(filters.time, 10);
        if (maxTime === 10 && idea.time > 10) return false;
        if (maxTime === 25 && (idea.time <= 10 || idea.time > 25)) return false;
        if (maxTime === 60 && idea.time < 30) return false;
      }
      if (filters.onlyFavorites && !idea.favorite) return false;
      if (filters.onlyProfileMatch && scoreIdeaForProfile(idea, profile).score < 15) return false;
      if (filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        if (!idea.title.toLowerCase().includes(q) && !idea.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [ideas, profile, filters]);

  const filteredReminderCatalog = useMemo(() => {
    return INDEPENDENT_REMINDER_POOL.filter((rem) => {
      if (filters.onlyFavorites && !favIndependentRemIds.includes(rem.id)) return false;
      if (filters.search.trim() !== '') {
        const q = filters.search.toLowerCase();
        if (!rem.title.toLowerCase().includes(q) && !rem.desc.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [filters.onlyFavorites, filters.search, favIndependentRemIds]);

  const filteredBiasCatalog = useMemo(() => {
    const entries = Object.entries(BIAS_ANTIDOTES);
    if (filters.search.trim() === '') return entries;
    const q = filters.search.toLowerCase();
    return entries.filter(
      ([, b]) =>
        b.name.toLowerCase().includes(q) ||
        b.hurts.toLowerCase().includes(q) ||
        b.solve.toLowerCase().includes(q)
    );
  }, [filters.search]);

  const availableIdeas = useMemo(() => {
    const now = Date.now();
    return filteredCatalog.filter((idea) => (dismissedUntil[idea.id] || 0) < now);
  }, [filteredCatalog, dismissedUntil]);

  const availableReminders = useMemo(() => {
    const now = Date.now();
    return filteredReminderCatalog.filter((rem) => (dismissedUntil[rem.id] || 0) < now);
  }, [filteredReminderCatalog, dismissedUntil]);

  const availableBiases = useMemo(() => {
    const now = Date.now();
    return filteredBiasCatalog
      .map(([biasKey, bias]) => ({
        id: `bias-${biasKey}`,
        biasKey,
        bias,
      }))
      .filter((entry) => (dismissedUntil[entry.id] || 0) < now);
  }, [filteredBiasCatalog, dismissedUntil]);

  const activeDeck = useMemo<SwipeDeckItem[]>(() => {
    if (deckType === 'ideas') {
      return availableIdeas.map((idea) => ({ kind: 'idea', id: idea.id, idea }));
    }
    if (deckType === 'reminders') {
      return availableReminders.map((reminder) => ({
        kind: 'reminder',
        id: reminder.id,
        reminder,
      }));
    }
    if (deckType === 'biases') {
      return availableBiases.map((b) => ({
        kind: 'bias',
        id: b.id,
        biasKey: b.biasKey,
        bias: b.bias,
      }));
    }

    // Interleave tasks, reminders, and cognitive bias cards in 'all' mode
    const combined: SwipeDeckItem[] = [];
    let rIdx = 0;
    let bIdx = 0;
    for (let i = 0; i < availableIdeas.length; i++) {
      const idea = availableIdeas[i];
      combined.push({ kind: 'idea', id: idea.id, idea });
      if ((i + 1) % 2 === 0 && rIdx < availableReminders.length) {
        const rem = availableReminders[rIdx++];
        combined.push({ kind: 'reminder', id: rem.id, reminder: rem });
      }
      if ((i + 1) % 3 === 0 && bIdx < availableBiases.length) {
        const b = availableBiases[bIdx++];
        combined.push({ kind: 'bias', id: b.id, biasKey: b.biasKey, bias: b.bias });
      }
    }
    while (rIdx < availableReminders.length) {
      const rem = availableReminders[rIdx++];
      combined.push({ kind: 'reminder', id: rem.id, reminder: rem });
    }
    while (bIdx < availableBiases.length) {
      const b = availableBiases[bIdx++];
      combined.push({ kind: 'bias', id: b.id, biasKey: b.biasKey, bias: b.bias });
    }
    return combined;
  }, [deckType, availableIdeas, availableReminders, availableBiases]);

  const currentItem = useMemo(() => {
    if (activeDeck.length === 0) return null;
    return activeDeck.find((item) => item.id === spotlightId) || activeDeck[0];
  }, [activeDeck, spotlightId]);

  const currentAffinity = useMemo(() => {
    if (!currentItem || currentItem.kind !== 'idea') return { score: 0, reason: null };
    return scoreIdeaForProfile(currentItem.idea, profile);
  }, [currentItem, profile]);

  const currentIndex = currentItem
    ? activeDeck.findIndex((i) => i.id === currentItem.id) + 1
    : 0;

  const savedReminderTitles = useMemo(
    () => new Set(reminders.map((r) => r.title.toLowerCase())),
    [reminders]
  );

  const hasActiveFilter =
    filters.energy !== 'all' ||
    filters.time !== 'all' ||
    filters.category !== 'all' ||
    !!filters.onlyProfileMatch ||
    deckType !== 'all';

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    };
  }, []);

  const getNextCardId = useCallback(
    (currentId: string) => {
      if (activeDeck.length <= 1) return '';
      const idx = activeDeck.findIndex((item) => item.id === currentId);
      const nextItem = activeDeck[(idx + 1) % activeDeck.length];
      return nextItem ? nextItem.id : '';
    },
    [activeDeck]
  );

  const triggerAnimatedSwipe = useCallback(
    (dir: 'left' | 'right') => {
      if (!currentItem || exitDir) return;
      const captured = currentItem;
      const nextId = getNextCardId(captured.id);
      setEnterMode(dir);
      setExitDir(dir);
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = window.setTimeout(() => {
        setExitDir(null);
        if (captured.kind === 'idea') {
          if (dir === 'left') onSwipeLeft(captured.idea);
          else onSwipeRight(captured.idea);
        } else if (captured.kind === 'reminder') {
          if (dir === 'left') onDismissReminderCard(captured.reminder, nextId);
          else onSaveReminderFromSwipe(captured.reminder, nextId);
        } else {
          if (dir === 'left') {
            onDismissBiasCard(captured.id, nextId);
          } else {
            onStartAntidoteFocus(
              captured.biasKey,
              captured.bias.name,
              captured.bias.antidoteStep,
              captured.bias.recommendedMinutes
            );
          }
        }
      }, shouldReduceMotion ? 140 : 250);
    },
    [
      currentItem,
      exitDir,
      getNextCardId,
      onSwipeLeft,
      onSwipeRight,
      onDismissReminderCard,
      onSaveReminderFromSwipe,
      onDismissBiasCard,
      onStartAntidoteFocus,
      shouldReduceMotion,
    ]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (filterOpen || catalogOpen || remindersModalOpen || biasesModalOpen || activeBiasKey) {
        if (e.key === 'Escape') {
          setFilterOpen(false);
          setCatalogOpen(false);
          setRemindersModalOpen(false);
          setBiasesModalOpen(false);
          setActiveBiasKey(null);
        }
        return;
      }
      if (e.key === 'ArrowLeft') triggerAnimatedSwipe('left');
      if (e.key === 'ArrowRight') triggerAnimatedSwipe('right');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    filterOpen,
    catalogOpen,
    remindersModalOpen,
    biasesModalOpen,
    activeBiasKey,
    triggerAnimatedSwipe,
  ]);

  const handleShuffleDeck = () => {
    setEnterMode('spin');
    if (deckType === 'ideas') {
      onSpinRandom();
      return;
    }
    const pool = activeDeck.filter((item) => item.id !== currentItem?.id);
    if (pool.length === 0) {
      onSpinRandom();
      return;
    }
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    onSelectSpotlight(chosen.id);
  };

  const handleReminderFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = remTitle.trim();
    if (!title) return;
    onSaveCustomReminder({
      id: remEditId || undefined,
      title,
      tier: remTier,
      datetime: remDatetime,
    });
    setRemEditId('');
    setRemTitle('');
    setRemDatetime('');
    setRemFormOpen(false);
  };

  const handleSaveReframe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBiasKey || !autoThought.trim() || !balancedThought.trim()) return;
    onSaveThoughtLog({
      id: 'cbt-' + Date.now(),
      biasKey: activeBiasKey,
      automaticThought: autoThought.trim(),
      evidenceFor: evidenceFor.trim(),
      evidenceAgainst: evidenceAgainst.trim(),
      balancedThought: balancedThought.trim(),
      dateLabel: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    });
    setAutoThought('');
    setEvidenceFor('');
    setEvidenceAgainst('');
    setBalancedThought('');
    setActiveBiasKey(null);
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* Fixed Top Icon Bar: Minimalist Icon-Only Filter Button */}
      <div className="shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-0 pb-2 flex items-center justify-start z-20">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filtrar Cartas"
          title="Filtrar Cartas"
          className="relative w-11 h-11 rounded-full liquid-glass-pill flex items-center justify-center shrink-0 hover:accent-text active:scale-90 transition-all duration-150"
        >
          <SlidersHorizontal className="w-[18px] h-[18px] accent-text" />
          {hasActiveFilter && (
            <span className="w-2 h-2 rounded-full accent-bg absolute top-2.5 right-2.5" />
          )}
        </button>
      </div>

      {/* 2-Column Split on Desktop, Fixed Non-Scrolling Touch Stage on Mobile */}
      <div className="flex-1 min-h-0 overflow-hidden lg:overflow-y-auto lg:overscroll-y-contain grid grid-cols-1 lg:grid-cols-12 gap-6 items-center lg:items-start pb-20 md:pb-4">
        {/* Left: Tinder / Badoo Minimalist iOS Bouncy Swipe Deck */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4 sm:space-y-5 touch-none">
          {currentItem ? (
            <>
              <div className="relative w-full max-w-md h-[min(420px,calc(100dvh-16.5rem))] min-h-[320px] sm:h-[430px] flex items-center justify-center select-none touch-none">
                <motion.div
                  key={`back-2-${currentItem.id}`}
                  initial={shouldReduceMotion ? undefined : { scale: 0.9, y: 18, opacity: 0.35 }}
                  animate={{ scale: 0.92, y: 16, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  className="absolute inset-x-7 top-6 bottom-0 rounded-3xl bg-white/40 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] pointer-events-none"
                />
                <motion.div
                  key={`back-1-${currentItem.id}`}
                  initial={shouldReduceMotion ? undefined : { scale: 0.93, y: 12, opacity: 0.6 }}
                  animate={{ scale: 0.96, y: 8, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 18 }}
                  className="absolute inset-x-3.5 top-3 bottom-0 rounded-3xl bg-white/70 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.08] pointer-events-none"
                />

                <AnimatePresence mode="popLayout" initial={false}>
                  <BouncySwipeCard
                    key={currentItem.id}
                    item={currentItem}
                    isReminderFav={
                      currentItem.kind === 'reminder' &&
                      favIndependentRemIds.includes(currentItem.id)
                    }
                    isReminderSaved={
                      currentItem.kind === 'reminder' &&
                      savedReminderTitles.has(currentItem.reminder.title.toLowerCase())
                    }
                    affinityReason={currentAffinity.reason}
                    currentIndex={currentIndex}
                    deckLength={activeDeck.length}
                    enterMode={enterMode}
                    exitDir={exitDir}
                    shouldReduceMotion={!!shouldReduceMotion}
                    onSwipeAction={triggerAnimatedSwipe}
                    onToggleFavoriteIdea={onToggleFavorite}
                    onToggleFavReminder={onToggleFavIndependentRem}
                    onOpenBiasReframe={(biasKey) => setActiveBiasKey(biasKey)}
                    onOpenMobileDetails={() => setMobileDetailsOpen(true)}
                  />
                </AnimatePresence>
              </div>

              {/* Tactile Tinder/Badoo Action Bar */}
              <div className="flex items-center justify-center gap-5">
                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.86 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  type="button"
                  onClick={() => triggerAnimatedSwipe('left')}
                  aria-label={
                    currentItem.kind === 'idea'
                      ? 'Rejeitar e enviar para reciclagem'
                      : 'Pular carta'
                  }
                  title={currentItem.kind === 'idea' ? 'Rejeitar / Reciclar' : 'Pular'}
                  className="w-15 h-15 rounded-full glass-surface text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center shadow-md"
                >
                  <X className="w-7 h-7 stroke-[2.5]" />
                </motion.button>

                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.86, rotate: 90 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 20 }}
                  type="button"
                  onClick={handleShuffleDeck}
                  aria-label="Sortear outra carta"
                  title="Sortear outra carta"
                  className="w-12 h-12 rounded-full glass-surface text-slate-600 dark:text-slate-300 hover:accent-text transition-colors flex items-center justify-center"
                >
                  <Shuffle className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.86 }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  type="button"
                  onClick={() => triggerAnimatedSwipe('right')}
                  aria-label={
                    currentItem.kind === 'reminder'
                      ? 'Salvar Lembrete'
                      : currentItem.kind === 'bias'
                        ? 'Aplicar Antídoto'
                        : 'Dar match e enviar para Tarefas'
                  }
                  title={
                    currentItem.kind === 'reminder'
                      ? 'Salvar Lembrete'
                      : currentItem.kind === 'bias'
                        ? 'Aplicar Antídoto'
                        : 'Dar Match'
                  }
                  className={`w-15 h-15 rounded-full shadow-lg hover:opacity-95 transition-opacity flex items-center justify-center ${
                    currentItem.kind === 'reminder'
                      ? 'bg-emerald-500 text-white'
                      : 'accent-bg'
                  }`}
                >
                  {currentItem.kind === 'reminder' ? (
                    <Bell className="w-6 h-6 fill-current" />
                  ) : currentItem.kind === 'bias' ? (
                    <Brain className="w-6 h-6" />
                  ) : (
                    <Heart className="w-7 h-7 fill-current" />
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <div className="w-full max-w-md glass-surface rounded-3xl p-8 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tudo tranquilo por agora
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Você já passou pelas sugestões deste filtro. Não há pressa — limpe os filtros ou restaure os cards pausados quando quiser.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
                  >
                    Limpar filtros
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRestoreDismissed}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rever sugestões pausadas</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Inspector (Desktop Split-View) */}
        <div className="hidden lg:block lg:col-span-5">
          {currentItem && currentItem.kind === 'idea' && (
            <div className="glass-surface rounded-3xl p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-indigo-500">Inspeção da Tarefa</p>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  Roteiro de Execução
                </h4>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Passos sugeridos
                </p>
                <ol className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {currentItem.idea.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="font-mono-num w-5 h-5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 text-slate-700 dark:text-slate-200">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-200/70 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => onSwipeRight(currentItem.idea)}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Começar Agora com Timer</span>
                </button>
              </div>
            </div>
          )}

          {currentItem && currentItem.kind === 'reminder' && (
            <div className="glass-surface rounded-3xl p-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Lembrete & Micro-Hábito</span>
                </p>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {PYRAMID_FIXED_PALETTE[currentItem.reminder.tier].label}
                </h4>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentItem.reminder.desc}
                </p>
                <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono-num w-5 h-5 rounded-md bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>Separe de 30 a 90 segundos neste momento.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono-num w-5 h-5 rounded-md bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>Pratique com leveza e salve para repetir quando precisar.</span>
                  </li>
                </ol>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-200/70 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => triggerAnimatedSwipe('right')}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                >
                  <Bell className="w-4 h-4" />
                  <span>Salvar nos Meus Lembretes</span>
                </button>
              </div>
            </div>
          )}

          {currentItem && currentItem.kind === 'bias' && (
            <div className="glass-surface rounded-3xl p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold accent-text flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Antídoto Cognitivo Adaptativo</span>
                </p>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentItem.bias.name}
                </h4>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <p className="text-slate-600 dark:text-slate-300">{currentItem.bias.hurts}</p>
                <p className="font-medium accent-text">{currentItem.bias.solve}</p>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08]">
                  <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
                    Micro-passo imediato ({currentItem.bias.recommendedMinutes} min)
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {currentItem.bias.antidoteStep}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => triggerAnimatedSwipe('right')}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-xl accent-bg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Aplicar Antídoto ({currentItem.bias.recommendedMinutes}m)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      {mobileDetailsOpen && currentItem && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm flex items-end justify-center p-3"
          onClick={() => setMobileDetailsOpen(false)}
        >
          <div
            className="glass-surface rounded-3xl w-full max-w-lg p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {currentItem.kind === 'idea' && (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Passos Sugeridos
                  </h4>
                  <button
                    type="button"
                    onClick={() => setMobileDetailsOpen(false)}
                    className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ol className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {currentItem.idea.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono-num w-5 h-5 rounded-md bg-slate-100 dark:bg-white/10 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDetailsOpen(false);
                      onSwipeRight(currentItem.idea);
                    }}
                    className="w-full min-h-[44px] py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs"
                  >
                    Começar Agora com Timer
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onAddToQueue(currentItem.idea.id);
                        setMobileDetailsOpen(false);
                      }}
                      className="min-h-[44px] py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold"
                    >
                      Guardar na Fila
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteNow(currentItem.idea);
                        setMobileDetailsOpen(false);
                      }}
                      className="min-h-[44px] py-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                    >
                      Já Concluí
                    </button>
                  </div>
                </div>
              </>
            )}

            {currentItem.kind === 'reminder' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-emerald-500">
                      {PYRAMID_FIXED_PALETTE[currentItem.reminder.tier].label}
                    </p>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentItem.reminder.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileDetailsOpen(false)}
                    className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentItem.reminder.desc}
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDetailsOpen(false);
                      triggerAnimatedSwipe('right');
                    }}
                    className="w-full min-h-[44px] py-3 rounded-xl bg-emerald-500 text-white font-semibold text-xs"
                  >
                    Salvar nos Meus Lembretes
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onCompleteReminderNow(
                          currentItem.reminder,
                          getNextCardId(currentItem.id)
                        );
                        setMobileDetailsOpen(false);
                      }}
                      className="min-h-[44px] py-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                    >
                      Concluir (+15 XP)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileDetailsOpen(false);
                        setRemindersModalOpen(true);
                      }}
                      className="min-h-[44px] py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold"
                    >
                      Ver Meus Lembretes
                    </button>
                  </div>
                </div>
              </>
            )}

            {currentItem.kind === 'bias' && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold accent-text">
                      Viés Cognitivo & Antídoto
                    </p>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentItem.bias.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileDetailsOpen(false)}
                    className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentItem.bias.hurts}
                </p>
                <p className="text-xs font-medium accent-text leading-relaxed">
                  {currentItem.bias.solve}
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDetailsOpen(false);
                      triggerAnimatedSwipe('right');
                    }}
                    className="w-full min-h-[44px] py-3 rounded-xl accent-bg font-semibold text-xs"
                  >
                    Aplicar Antídoto ({currentItem.bias.recommendedMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDetailsOpen(false);
                      setActiveBiasKey(currentItem.biasKey);
                    }}
                    className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold"
                  >
                    Reenquadrar Pensamento (TCC)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vieses & Antídotos Full Modal (Moved from Explorar into Swipe!) */}
      {biasesModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setBiasesModalOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[88vh] flex flex-col p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold accent-text flex items-center gap-1.5">
                  <Brain className="w-4 h-4" />
                  <span>Laboratório de Vieses Cognitivos & Ativação Comportamental</span>
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Antídotos Cognitivos Adaptativos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identifique armadilhas mentais, pratique o questionamento socrático e transforme bloqueios em micro-passos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBiasesModalOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(BIAS_ANTIDOTES).map(([key, bias]) => (
                  <div
                    key={key}
                    className="p-5 rounded-3xl bg-slate-50/75 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {bias.name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {bias.hurts}
                      </p>
                      <p className="text-xs font-medium accent-text leading-relaxed">
                        {bias.solve}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveBiasKey(key)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.07] border border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                      >
                        Reenquadrar Pensamento
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBiasesModalOpen(false);
                          onStartAntidoteFocus(
                            key,
                            bias.name,
                            bias.antidoteStep,
                            bias.recommendedMinutes
                          );
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl accent-bg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Aplicar ({bias.recommendedMinutes}m)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {thoughtLogs.length > 0 && (
                <div className="p-5 rounded-3xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Seus Reenquadramentos Socráticos Recentes
                  </h4>
                  <div className="space-y-2.5">
                    {thoughtLogs.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold accent-text">
                            {BIAS_ANTIDOTES[log.biasKey]?.name || log.biasKey}
                          </span>
                          <span className="font-mono-num">{log.dateLabel}</span>
                        </div>
                        <p className="text-slate-500 line-through">“{log.automaticThought}”</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">
                          Nova perspectiva: “{log.balancedThought}”
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CBT Socratic Reframing Pop-up */}
      {activeBias && activeBiasKey && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setActiveBiasKey(null)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold accent-text">Questionamento Socrático (TCC)</p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeBias.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveBiasKey(null)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReframe} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Qual pensamento automático surgiu?
                </label>
                <input
                  type="text"
                  required
                  value={autoThought}
                  onChange={(e) => setAutoThought(e.target.value)}
                  placeholder="Ex: Se não sair perfeito hoje, nem vale tentar..."
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Evidências a favor
                  </label>
                  <textarea
                    rows={2}
                    value={evidenceFor}
                    onChange={(e) => setEvidenceFor(e.target.value)}
                    placeholder="O que parece confirmar isso?"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Evidências contra
                  </label>
                  <textarea
                    rows={2}
                    value={evidenceAgainst}
                    onChange={(e) => setEvidenceAgainst(e.target.value)}
                    placeholder="Fatos reais que mostram outro lado..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Pensamento equilibrado & compassivo
                </label>
                <textarea
                  rows={2}
                  required
                  value={balancedThought}
                  onChange={(e) => setBalancedThought(e.target.value)}
                  placeholder="Ex: Dar um passo de 10 minutos hoje já fortalece meu caminho."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl accent-bg text-xs font-semibold"
                >
                  Salvar Reenquadramento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meus Lembretes Modal */}
      {remindersModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setRemindersModalOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[86vh] flex flex-col p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-500" />
                  <span>Meus Lembretes Salvos</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lembretes salvos no Swipe ou criados por você
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemFormOpen((v) => !v);
                    setRemEditId('');
                    setRemTitle('');
                    setRemDatetime('');
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRemindersModalOpen(false)}
                  className="min-w-[38px] min-h-[38px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {remFormOpen && (
              <form
                onSubmit={handleReminderFormSubmit}
                className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] space-y-3"
              >
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {remEditId ? 'Editar Lembrete' : 'Criar Lembrete Personalizado'}
                </p>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="Ex: Beber água ou alongar os ombros"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <select
                    value={remTier}
                    onChange={(e) => setRemTier(e.target.value as MaslowTierId)}
                    className="min-h-[40px] px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                  >
                    {(Object.keys(PYRAMID_FIXED_PALETTE) as MaslowTierId[]).map((k) => (
                      <option key={k} value={k}>
                        {PYRAMID_FIXED_PALETTE[k].label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={remDatetime}
                    onChange={(e) => setRemDatetime(e.target.value)}
                    className="min-h-[40px] px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRemFormOpen(false);
                      setRemEditId('');
                      setRemTitle('');
                      setRemDatetime('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-white/10 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 min-h-[40px] py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
                  >
                    {remEditId ? 'Atualizar Lembrete' : 'Salvar Lembrete'}
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono-num">
                {reminders.filter((r) => !r.done).length} pendentes ·{' '}
                {reminders.filter((r) => r.done).length} concluídos
              </span>
              <button
                type="button"
                onClick={() => setOnlyFavSavedReminders((v) => !v)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                  onlyFavSavedReminders
                    ? 'bg-rose-500/12 text-rose-500 border-rose-500/30'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                Apenas Favoritos
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-2.5">
              {reminders.filter((r) => !onlyFavSavedReminders || r.fav).length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200/80 dark:border-white/10 text-xs text-slate-400">
                  Nenhum lembrete aqui ainda. Deslize um card de lembrete para a direita no Swipe ou clique em &ldquo;Novo&rdquo;.
                </div>
              ) : (
                reminders
                  .filter((r) => !onlyFavSavedReminders || r.fav)
                  .map((rem) => {
                    const pMeta =
                      PYRAMID_FIXED_PALETTE[rem.tier] || PYRAMID_FIXED_PALETTE.fisiologico;
                    return (
                      <div
                        key={rem.id}
                        className={`p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between gap-3 ${
                          rem.done ? 'opacity-60' : 'bg-slate-50/70 dark:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => onToggleReminderDone(rem.id)}
                            className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              rem.done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {rem.done && <Check className="w-3 h-3" />}
                          </button>
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              <span>{pMeta.label}</span>
                              {rem.datetime && (
                                <span className="ml-1.5 text-indigo-500 font-mono-num">
                                  · {rem.datetime.replace('T', ' ')}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm font-semibold truncate ${
                                rem.done
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {rem.title}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onToggleFavoriteReminder(rem.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500"
                            aria-label="Favoritar"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                rem.fav ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRemFormOpen(true);
                              setRemEditId(rem.id);
                              setRemTitle(rem.title);
                              setRemTier(rem.tier);
                              setRemDatetime(rem.datetime || '');
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                            aria-label="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReminder(rem.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500"
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-5 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-500" />
                  <span>Filtrar Sugestões</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Personalize os cards pelo seu momento atual
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-xs font-semibold text-indigo-500 hover:underline"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tipo de Cartas no Swipe
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-200/75 dark:bg-white/[0.06]">
                {[
                  {
                    id: 'all' as const,
                    label: `Todos (${availableIdeas.length + availableReminders.length + availableBiases.length})`,
                  },
                  { id: 'ideas' as const, label: `Tarefas (${availableIdeas.length})` },
                  { id: 'reminders' as const, label: `Lembretes (${availableReminders.length})` },
                  { id: 'biases' as const, label: `Vieses (${availableBiases.length})` },
                ].map((opt) => {
                  const active = deckType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onUpdateFilters({ deckType: opt.id })}
                      className={`min-h-[36px] px-2 py-1.5 rounded-xl text-[11px] font-semibold transition whitespace-nowrap truncate ${
                        active
                          ? 'bg-white dark:bg-[#1E202B] text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Nível de Energia
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['all', 'baixa', 'media', 'alta'] as Array<'all' | EnergyLevel>).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onUpdateFilters({ energy: val })}
                    className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-semibold transition ${
                      filters.energy === val
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {val === 'all' ? 'Todas' : ENERGY_META[val]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tempo Disponível
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'all', label: 'Qualquer' },
                  { id: '10', label: '≤ 10 min' },
                  { id: '25', label: '15–25 min' },
                  { id: '60', label: '30m+' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateFilters({ time: opt.id as FilterState['time'] })}
                    className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-semibold transition ${
                      filters.time === opt.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Área da Vida & Produtividade
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateFilters({ category: 'all' })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    filters.category === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Todas
                </button>
                {(Object.keys(CATEGORY_META) as IdeaCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onUpdateFilters({ category: cat })}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      filters.category === cat
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                        : 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {CATEGORY_META[cat].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onUpdateFilters({ onlyProfileMatch: !filters.onlyProfileMatch })}
                className={`w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition ${
                  filters.onlyProfileMatch
                    ? 'accent-soft-bg accent-border'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>Priorizar apenas cartas alinhadas ao meu perfil</span>
                <span>{filters.onlyProfileMatch ? 'Ativo' : 'Todos'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterOpen(false);
                  setBiasesModalOpen(true);
                }}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
              >
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 accent-text" />
                  <span>Vieses & Antídotos</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen(false);
                    setRemindersModalOpen(true);
                  }}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-500" />
                    <span>Lembretes</span>
                  </span>
                  <span className="font-mono-num text-slate-400">({reminders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen(false);
                    setCatalogOpen(true);
                  }}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Catálogo</span>
                  </span>
                  <span className="font-mono-num text-slate-400">({filteredCatalog.length})</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="w-full min-h-[44px] py-3 rounded-xl accent-bg font-semibold text-xs"
            >
              Ver {activeDeck.length} Cartas Disponíveis
            </button>
          </div>
        </div>
      )}

      {/* Catalog Explorer Modal */}
      {catalogOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setCatalogOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[86vh] flex flex-col p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Catálogo Completo de Atividades
                </h3>
                <p className="text-xs text-slate-400">
                  Busque ou escolha qualquer uma das {ideas.length} ideias diretamente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatalogOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => onUpdateFilters({ search: e.target.value })}
                  placeholder="Buscar atividade (ex: livro, guitarra, código, foco, médico)..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                type="button"
                onClick={() => onUpdateFilters({ onlyFavorites: !filters.onlyFavorites })}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  filters.onlyFavorites
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${filters.onlyFavorites ? 'fill-rose-500' : ''}`} />
                <span>Favoritas</span>
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {filteredCatalog.length === 0 ? (
                <div className="p-10 text-center border border-slate-200/80 dark:border-white/10 rounded-2xl">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nenhuma atividade encontrada
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Limpe a busca ou altere os filtros para ver mais sugestões.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCatalog.map((idea) => (
                    <div
                      key={idea.id}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium truncate">
                            {CATEGORY_META[idea.category]?.label}
                          </span>
                          <span className="font-mono-num shrink-0">
                            {idea.time}m · +{idea.xp} XP
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {idea.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {idea.description}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogOpen(false);
                              onSelectSpotlight(idea.id);
                              onSwipeRight(idea);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[11px] font-semibold"
                          >
                            Dar Match
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToQueue(idea.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200/70 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Fila</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(idea.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500"
                          aria-label="Favoritar"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              idea.favorite ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

interface BouncySwipeCardProps {
  item: SwipeDeckItem;
  isReminderFav: boolean;
  isReminderSaved: boolean;
  affinityReason: string | null;
  currentIndex: number;
  deckLength: number;
  enterMode: 'left' | 'right' | 'spin';
  exitDir: 'left' | 'right' | null;
  shouldReduceMotion: boolean;
  onSwipeAction: (dir: 'left' | 'right') => void;
  onToggleFavoriteIdea: (id: string) => void;
  onToggleFavReminder: (remId: string) => void;
  onOpenBiasReframe: (biasKey: string) => void;
  onOpenMobileDetails: () => void;
}

const BouncySwipeCard: React.FC<BouncySwipeCardProps> = ({
  item,
  isReminderFav,
  isReminderSaved,
  affinityReason,
  currentIndex,
  deckLength,
  enterMode,
  exitDir,
  shouldReduceMotion,
  onSwipeAction,
  onToggleFavoriteIdea,
  onToggleFavReminder,
  onOpenBiasReframe,
  onOpenMobileDetails,
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateZ = useTransform(x, [-240, 0, 240], [-16, 0, 16]);
  const rotateY = useTransform(x, [-240, 0, 240], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [22, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, -22], [1, 0]);
  const longPressRef = useRef<number | null>(null);

  const clearLongPress = () => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  useEffect(() => clearLongPress, []);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (exitDir) return;
    if (info.offset.x > 92 || info.velocity.x > 460) {
      onSwipeAction('right');
    } else if (info.offset.x < -92 || info.velocity.x < -460) {
      onSwipeAction('left');
    }
  };

  const toggleFavoriteCurrent = () => {
    if (item.kind === 'idea') onToggleFavoriteIdea(item.idea.id);
    else if (item.kind === 'reminder') onToggleFavReminder(item.reminder.id);
    else onOpenBiasReframe(item.biasKey);
  };

  const cardInitial = shouldReduceMotion
    ? { opacity: 0 }
    : enterMode === 'spin'
      ? { opacity: 0, scale: 0.86, rotateY: -72, rotateX: 8, y: 14 }
      : {
          opacity: 0,
          scale: 0.9,
          y: 26,
          rotateX: 10,
          rotateY: enterMode === 'left' ? -16 : 16,
        };

  const cardAnimate = shouldReduceMotion
    ? { opacity: exitDir ? 0 : 1 }
    : exitDir === 'left'
      ? {
          x: -460,
          y: -36,
          rotateZ: -20,
          rotateY: -26,
          scale: 0.85,
          opacity: 0,
        }
      : exitDir === 'right'
        ? {
            x: 460,
            y: -36,
            rotateZ: 20,
            rotateY: 26,
            scale: 0.85,
            opacity: 0,
          }
        : {
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            opacity: 1,
          };

  const isFav =
    item.kind === 'idea' ? item.idea.favorite : item.kind === 'reminder' ? isReminderFav : false;

  return (
    <motion.div
      style={{
        x,
        y,
        rotateZ: shouldReduceMotion ? 0 : rotateZ,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        transformPerspective: 1100,
        transformStyle: 'preserve-3d',
      }}
      drag={!shouldReduceMotion && !exitDir}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.85}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 15 }}
      whileDrag={shouldReduceMotion ? undefined : { scale: 1.035 }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        clearLongPress();
        longPressRef.current = window.setTimeout(() => {
          toggleFavoriteCurrent();
        }, 550);
      }}
      onPointerUp={clearLongPress}
      onPointerCancel={clearLongPress}
      onDragStart={clearLongPress}
      onDragEnd={handleDragEnd}
      initial={cardInitial}
      animate={cardAnimate}
      exit={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.88, transition: { duration: 0.18 } }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.15 }
          : exitDir
            ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] }
            : { type: 'spring', stiffness: 340, damping: 18, mass: 0.82 }
      }
      className={`relative w-full h-full glass-surface rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing touch-none will-change-transform ${
        item.kind === 'reminder'
          ? 'ring-1 ring-emerald-500/35 dark:ring-emerald-400/25'
          : item.kind === 'bias'
            ? 'ring-1 accent-border'
            : ''
      }`}
    >
      {/* Stamps */}
      <motion.div
        style={{ opacity: exitDir === 'left' ? 1 : nopeOpacity }}
        className="pointer-events-none absolute top-7 right-7 z-20 border-2 border-rose-500/85 text-rose-500 bg-rose-500/10 px-3.5 py-1 rounded-xl font-bold text-xs uppercase tracking-widest rotate-12"
      >
        {item.kind === 'idea' ? 'Rejeitar' : 'Pular'}
      </motion.div>
      <motion.div
        style={{ opacity: exitDir === 'right' ? 1 : likeOpacity }}
        className="pointer-events-none absolute top-7 left-7 z-20 border-2 border-emerald-500/85 text-emerald-500 bg-emerald-500/10 px-3.5 py-1 rounded-xl font-bold text-xs uppercase tracking-widest -rotate-12"
      >
        {item.kind === 'reminder'
          ? 'Salvar Lembrete'
          : item.kind === 'bias'
            ? 'Aplicar Antídoto'
            : 'Dar Match'}
      </motion.div>

      {/* Card Top Metadata & Action */}
      <div className="flex items-center justify-between gap-3">
        {item.kind === 'idea' && (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            <span>{CATEGORY_META[item.idea.category]?.label || 'Desafio'}</span>
            {item.idea.pyramid && (
              <>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{item.idea.pyramid}</span>
              </>
            )}
          </div>
        )}
        {item.kind === 'reminder' && (
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Lembrete · {PYRAMID_FIXED_PALETTE[item.reminder.tier].label}
            </span>
          </div>
        )}
        {item.kind === 'bias' && (
          <div className="text-xs font-semibold accent-text flex items-center gap-1.5 truncate">
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Viés & Antídoto Cognitivo</span>
          </div>
        )}

        {item.kind === 'bias' ? (
          <button
            type="button"
            onClick={() => onOpenBiasReframe(item.biasKey)}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-[11px] font-semibold text-slate-700 dark:text-slate-200 shrink-0"
          >
            TCC
          </button>
        ) : (
          <button
            type="button"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onClick={toggleFavoriteCurrent}
            aria-label={isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            className="min-w-[44px] min-h-[44px] -mr-2 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 active:scale-90 transition"
          >
            <Star
              className={`w-5 h-5 transition ${
                isFav ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Card Body */}
      {item.kind === 'idea' && (
        <div className="my-auto space-y-3 py-2">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {item.idea.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
            {item.idea.description}
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 font-mono-num">
            <span>{item.idea.time} min</span>
            <span aria-hidden="true">·</span>
            <span>Energia {ENERGY_META[item.idea.energy]}</span>
            <span aria-hidden="true">·</span>
            <span className="accent-text font-semibold">+{item.idea.xp} XP</span>
          </div>
          {affinityReason && (
            <p className="text-xs font-medium accent-text">Afinidade: {affinityReason}</p>
          )}
        </div>
      )}

      {item.kind === 'reminder' && (
        <div className="my-auto space-y-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Micro-hábito & Lembrete
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {item.reminder.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
            {item.reminder.desc}
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 font-mono-num">
            <span>1 min</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+15 XP</span>
            {isReminderSaved && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-500 font-semibold">Já salvo</span>
              </>
            )}
          </div>
        </div>
      )}

      {item.kind === 'bias' && (
        <div className="my-auto space-y-3 py-2">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {item.bias.name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            {item.bias.hurts}
          </p>
          <p className="text-xs font-medium accent-text leading-relaxed line-clamp-3">
            {item.bias.solve}
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 font-mono-num">
            <span>{item.bias.recommendedMinutes} min</span>
            <span aria-hidden="true">·</span>
            <span className="accent-text font-semibold">
              +{Math.max(15, item.bias.recommendedMinutes * 2)} XP
            </span>
          </div>
        </div>
      )}

      {/* Card Bottom Divider & Footer */}
      <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono-num">
          Carta {currentIndex} de {deckLength}
        </span>
        <button
          type="button"
          onClick={onOpenMobileDetails}
          className="lg:hidden accent-text font-semibold flex items-center gap-1"
        >
          <span>{item.kind === 'idea' ? 'Ver passos' : 'Ver detalhes'}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <span className="hidden lg:inline">
          {item.kind === 'idea' ? 'Passos ao lado →' : 'Detalhes ao lado →'}
        </span>
      </div>
    </motion.div>
  );
};
