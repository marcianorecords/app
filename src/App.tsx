import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  BarChart3,
  Camera,
  Compass,
  Flame,
  ListTodo,
  Plus,
  Sparkles,
  User,
} from 'lucide-react';
import { DiscoverView } from './components/DiscoverView';
import { EvolutionView } from './components/EvolutionView';
import { MatchOverlay } from './components/MatchOverlay';
import { MemoriesView } from './components/MemoriesView';
import { MomentoView } from './components/MomentoView';
import { MusicPopupModal } from './components/MusicPopupModal';
import { NewIdeaModal } from './components/NewIdeaModal';
import { OnboardingModal } from './components/OnboardingModal';
import { SettingsModal } from './components/SettingsModal';
import { TasksHubView } from './components/TasksHubView';
import { TimerPopupModal } from './components/TimerPopupModal';
import {
  DEFAULT_EVO_STATE,
  DEFAULT_IDEAS,
  DEFAULT_MEMORIES,
  INDEPENDENT_REMINDER_POOL,
  SOUND_TRACKS,
} from './data/ideas';
import type {
  AccentTheme,
  AppState,
  ClockDisplayMode,
  EvoState,
  FocusTarget,
  Idea,
  IndependentReminderCard,
  MainTab,
  MaslowTierId,
  MasteryPleasureLog,
  MemoryItem,
  QueueItem,
  TasksSubTab,
  ThoughtReframeEntry,
  UserProfile,
} from './types/impulso';
import { AmbientAudioEngine, playUiSound } from './utils/audioEngine';
import {
  DEFAULT_USER_PROFILE,
  sortIdeasByProfile,
} from './utils/profileCorrelation';

const STORAGE_KEY = 'impulso_app_state_v5';

function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function createInitialState(): AppState {
  return {
    profile: { ...DEFAULT_USER_PROFILE },
    accentTheme: 'terracota',
    ideas: [...DEFAULT_IDEAS],
    spotlightId: DEFAULT_IDEAS[0].id,
    rejectedIdeaIds: [],
    checkedStepsByIdea: {},
    scratchpadByIdea: {},
    filters: {
      energy: 'all',
      time: 'all',
      category: 'all',
      search: '',
      onlyFavorites: false,
      onlyProfileMatch: false,
      deckType: 'all',
    },
    queue: [
      {
        id: 'q-1',
        title: 'Sprint de Limpeza Digital (Inbox & Área de Trabalho)',
        category: 'organizacao',
        time: 10,
        xp: 15,
        completed: false,
        steps: [
          'Feche todas as abas do navegador que você não usará hoje',
          'Apague 10 arquivos inúteis da pasta Downloads',
        ],
      },
    ],
    queueFilter: 'pendentes',
    xp: 45,
    completedCount: 2,
    focusMinutes: 35,
    streak: 3,
    soundEnabled: true,
    history: [
      { title: 'Reset da Mesa de Trabalho em 5 Minutos', xp: 15, date: 'Hoje' },
      { title: 'Mapa Mental de um Projeto Travado', xp: 30, date: 'Hoje' },
    ],
    thoughtLogs: [],
    masteryPleasureLogs: [],
    timer: {
      secondsLeft: 25 * 60,
      totalSeconds: 25 * 60,
      running: false,
      mode: 'pomodoro',
      clockType: 'countdown',
      stopwatchSeconds: 0,
      journeySecondsLeft: secondsUntilMidnight(),
      activeIdeaId: DEFAULT_IDEAS[0].id,
      customFocusTarget: null,
    },
    evo: JSON.parse(JSON.stringify(DEFAULT_EVO_STATE)),
    memories: [...DEFAULT_MEMORIES],
    onlyFavMemories: false,
    music: {
      currentTrackId: 'chuva',
      playing: false,
      muted: false,
      volume: 70,
      onlyFavs: false,
      favTrackIds: ['natureza', 'chuva', 'branco', 'marrom'],
      sleepSecondsLeft: 0,
    },
  };
}

function loadPersistedState(): AppState {
  const base = createInitialState();
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('impulso_app_state_v4') ||
      localStorage.getItem('impulso_app_state_v3');
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const existingIds = new Set((parsed.ideas || []).map((i) => i.id));
    const missingDefaults = DEFAULT_IDEAS.filter((d) => !existingIds.has(d.id));
    const mergedIdeas = [...missingDefaults, ...(parsed.ideas || base.ideas)];

    const rawEvoSubTab = parsed.evo?.activeSubTab as string | undefined;
    const normalizedEvoSubTab =
      rawEvoSubTab && rawEvoSubTab !== 'lembretes' ? rawEvoSubTab : 'metricas';

    const mergedEvo: EvoState = {
      ...base.evo,
      ...(parsed.evo || {}),
      activeSubTab: normalizedEvoSubTab as EvoState['activeSubTab'],
    };

    return {
      ...base,
      ...parsed,
      profile: { ...DEFAULT_USER_PROFILE, ...(parsed.profile || {}) },
      accentTheme: parsed.accentTheme || 'terracota',
      ideas: mergedIdeas,
      rejectedIdeaIds: parsed.rejectedIdeaIds || [],
      thoughtLogs: parsed.thoughtLogs || [],
      masteryPleasureLogs: parsed.masteryPleasureLogs || [],
      filters: { ...base.filters, ...(parsed.filters || {}) },
      timer: {
        ...base.timer,
        ...(parsed.timer || {}),
        running: false,
        clockType: parsed.timer?.clockType || 'countdown',
        stopwatchSeconds: parsed.timer?.stopwatchSeconds || 0,
        journeySecondsLeft: secondsUntilMidnight(),
      },
      evo: mergedEvo,
      music: {
        ...base.music,
        ...(parsed.music || {}),
        playing: false,
        sleepSecondsLeft: 0,
      },
      memories: parsed.memories && parsed.memories.length > 0 ? parsed.memories : base.memories,
    };
  } catch {
    return base;
  }
}

const TAB_ORDER: MainTab[] = ['tarefas', 'memorias', 'swipe', 'momento', 'avancos'];

const tabSlideVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '12%' : '-12%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-8%' : '8%',
    opacity: 0,
  }),
};

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [state, setState] = useState<AppState>(() => loadPersistedState());
  const [activeTab, setActiveTab] = useState<MainTab>('tarefas');
  const activeTabRef = useRef<MainTab>('tarefas');
  const [tabDirection, setTabDirection] = useState<number>(1);
  const [tasksSubTab, setTasksSubTab] = useState<TasksSubTab>('todas');

  const navigateToTab = useCallback((nextTab: MainTab) => {
    const prevTab = activeTabRef.current;
    if (nextTab === prevTab) return;
    const currentIdx = TAB_ORDER.indexOf(prevTab);
    const nextIdx = TAB_ORDER.indexOf(nextTab);
    setTabDirection(nextIdx >= currentIdx ? 1 : -1);
    activeTabRef.current = nextTab;
    setActiveTab(nextTab);
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(
    () => !state.profile.completedOnboarding
  );
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [timerPopupOpen, setTimerPopupOpen] = useState<boolean>(false);
  const [musicPopupOpen, setMusicPopupOpen] = useState<boolean>(false);
  const [matchIdea, setMatchIdea] = useState<Idea | null>(null);
  const [newIdeaModalOpen, setNewIdeaModalOpen] = useState(false);
  const [memoryPrefillTask, setMemoryPrefillTask] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);

  const audioEngineRef = useRef<AmbientAudioEngine | null>(null);
  const matchTimeoutRef = useRef<number | null>(null);

  // Sync persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  // Sync dark class & accent theme on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', state.accentTheme || 'terracota');
  }, [state.accentTheme]);

  // Cleanup audio engine on unmount
  useEffect(() => {
    const engine = new AmbientAudioEngine();
    audioEngineRef.current = engine;
    return () => {
      engine.stop();
    };
  }, []);

  const showToast = useCallback((text: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-2), { id, text }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  // Always tick journey 24h clock every second + active focus countdown/stopwatch
  useEffect(() => {
    const interval = window.setInterval(() => {
      setState((prev) => {
        const nextJourney =
          prev.timer.journeySecondsLeft > 1 ? prev.timer.journeySecondsLeft - 1 : 86400;

        if (!prev.timer.running) {
          return {
            ...prev,
            timer: { ...prev.timer, journeySecondsLeft: nextJourney },
          };
        }

        if (prev.timer.clockType === 'stopwatch') {
          return {
            ...prev,
            timer: {
              ...prev.timer,
              journeySecondsLeft: nextJourney,
              stopwatchSeconds: prev.timer.stopwatchSeconds + 1,
            },
          };
        }

        if (prev.timer.clockType === 'countdown') {
          if (prev.timer.secondsLeft > 1) {
            return {
              ...prev,
              timer: {
                ...prev.timer,
                journeySecondsLeft: nextJourney,
                secondsLeft: prev.timer.secondsLeft - 1,
              },
            };
          }

          const mins = Math.max(1, Math.round(prev.timer.totalSeconds / 60));
          playUiSound('success', prev.soundEnabled);
          return {
            ...prev,
            xp: prev.xp + 30,
            completedCount: prev.completedCount + 1,
            focusMinutes: prev.focusMinutes + mins,
            history: [
              { title: 'Sessão de Foco Concluída', xp: 30, date: 'Hoje' },
              ...prev.history,
            ],
            timer: {
              ...prev.timer,
              journeySecondsLeft: nextJourney,
              running: false,
              secondsLeft: 0,
            },
          };
        }

        return {
          ...prev,
          timer: { ...prev.timer, journeySecondsLeft: nextJourney },
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // Ambient sleep timer
  useEffect(() => {
    if (!state.music.playing || state.music.sleepSecondsLeft <= 0) return;
    const interval = window.setInterval(() => {
      setState((prev) => {
        if (prev.music.sleepSecondsLeft <= 1) {
          audioEngineRef.current?.stop();
          return {
            ...prev,
            music: { ...prev.music, playing: false, sleepSecondsLeft: 0 },
          };
        }
        return {
          ...prev,
          music: { ...prev.music, sleepSecondsLeft: prev.music.sleepSecondsLeft - 1 },
        };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.music.playing, state.music.sleepSecondsLeft]);

  const awardCompletion = useCallback(
    (title: string, xpGain: number, minutes: number) => {
      setState((prev) => {
        playUiSound('success', prev.soundEnabled);
        return {
          ...prev,
          xp: prev.xp + xpGain,
          completedCount: prev.completedCount + 1,
          focusMinutes: prev.focusMinutes + minutes,
          history: [{ title, xp: xpGain, date: 'Hoje' }, ...prev.history],
        };
      });
      showToast(`Concluída · +${xpGain} XP`);
    },
    [showToast]
  );

  const advanceSpotlight = useCallback(
    (currentId: string, ideasList: Idea[], dismissed: Record<string, number>) => {
      const now = Date.now();
      const available = ideasList.filter((i) => (dismissed[i.id] || 0) < now);
      if (available.length === 0) return currentId;
      const idx = available.findIndex((i) => i.id === currentId);
      return available[(idx + 1) % available.length].id;
    },
    []
  );

  const handleSwipeLeft = (idea: Idea) => {
    playUiSound('nope', state.soundEnabled);
    const until = Date.now() + 24 * 60 * 60 * 1000;
    setState((prev) => {
      const nextDismissed = { ...prev.evo.dismissedUntil, [idea.id]: until };
      const nextRejected = prev.rejectedIdeaIds.includes(idea.id)
        ? prev.rejectedIdeaIds
        : [idea.id, ...prev.rejectedIdeaIds];
      return {
        ...prev,
        spotlightId: advanceSpotlight(idea.id, prev.ideas, nextDismissed),
        rejectedIdeaIds: nextRejected,
        evo: { ...prev.evo, dismissedUntil: nextDismissed },
      };
    });
  };

  const openMatchAndTransition = useCallback((idea: Idea) => {
    setMatchIdea(idea);
    setState((prev) => ({
      ...prev,
      rejectedIdeaIds: prev.rejectedIdeaIds.filter((id) => id !== idea.id),
      timer: {
        ...prev.timer,
        running: false,
        mode: 'custom',
        clockType: prev.timer.clockType === 'journey' ? 'countdown' : prev.timer.clockType,
        totalSeconds: idea.time * 60,
        secondsLeft: idea.time * 60,
        activeIdeaId: idea.id,
        customFocusTarget: null,
      },
    }));

    if (matchTimeoutRef.current) window.clearTimeout(matchTimeoutRef.current);
    matchTimeoutRef.current = window.setTimeout(() => {
      setMatchIdea(null);
      navigateToTab('momento');
    }, 1250);
  }, [navigateToTab]);

  const handleSwipeRight = (idea: Idea) => {
    playUiSound('match', state.soundEnabled);
    setState((prev) => {
      const alreadyInQueue = prev.queue.some(
        (q) => !q.completed && q.title === idea.title
      );
      const nextQueue = alreadyInQueue
        ? prev.queue
        : [
            {
              id: 'q-' + Date.now(),
              title: idea.title,
              category: idea.category,
              time: idea.time,
              xp: idea.xp,
              completed: false,
              steps: [...idea.steps],
              description: idea.description,
            },
            ...prev.queue,
          ];
      return {
        ...prev,
        queue: nextQueue,
      };
    });
    openMatchAndTransition(idea);
  };

  const handleFocusIdeaNow = (idea: Idea) => {
    setState((prev) => ({
      ...prev,
      timer: {
        ...prev.timer,
        running: false,
        mode: 'custom',
        clockType: prev.timer.clockType === 'journey' ? 'countdown' : prev.timer.clockType,
        totalSeconds: idea.time * 60,
        secondsLeft: idea.time * 60,
        activeIdeaId: idea.id,
        customFocusTarget: null,
      },
    }));
    navigateToTab('momento');
    showToast(`Focando agora: ${idea.title}`);
  };

  const handleToggleFavorite = (id: string) => {
    const current = state.ideas.find((i) => i.id === id);
    const nextFav = current ? !current.favorite : true;
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)),
    }));
    showToast(nextFav ? 'Adicionada aos Favoritos' : 'Removida dos Favoritos');
  };

  const handleAddToQueue = (id: string) => {
    const idea = state.ideas.find((i) => i.id === id);
    if (!idea) return;
    setState((prev) => ({
      ...prev,
      queue: [
        {
          id: 'q-' + Date.now(),
          title: idea.title,
          category: idea.category,
          time: idea.time,
          xp: idea.xp,
          completed: false,
          steps: [...idea.steps],
          description: idea.description,
        },
        ...prev.queue,
      ],
    }));
    showToast('Guardada na Fila');
  };

  const handleSpinRandom = () => {
    const pool = sortIdeasByProfile(
      state.ideas.filter((i) => i.id !== state.spotlightId),
      state.profile
    );
    const topSlice = pool.slice(0, Math.min(8, pool.length));
    const chosen = topSlice[Math.floor(Math.random() * topSlice.length)] || state.ideas[0];
    if (!chosen) return;
    playUiSound('spin', state.soundEnabled);
    setState((prev) => ({ ...prev, spotlightId: chosen.id }));
    showToast(`Sugestão afinada ao perfil: ${chosen.title}`);
  };

  // Resolve current FocusTarget
  const activeFocusTarget: FocusTarget = useMemo(() => {
    if (state.timer.customFocusTarget) return state.timer.customFocusTarget;
    const idea =
      state.ideas.find((i) => i.id === state.timer.activeIdeaId) || state.ideas[0];
    return {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      energy: idea.energy,
      time: idea.time,
      xp: idea.xp,
      biasKey: idea.biasKey,
      steps: idea.steps,
      source: 'idea',
    };
  }, [state.timer.customFocusTarget, state.timer.activeIdeaId, state.ideas]);

  const rejectedIdeas = useMemo(() => {
    const set = new Set(state.rejectedIdeaIds);
    return state.ideas.filter((i) => set.has(i.id));
  }, [state.ideas, state.rejectedIdeaIds]);

  const favoriteIdeas = useMemo(
    () => state.ideas.filter((i) => i.favorite),
    [state.ideas]
  );

  const favoriteReminders = useMemo(() => {
    const set = new Set(state.evo.favIndependentRemIds);
    return INDEPENDENT_REMINDER_POOL.filter((r) => set.has(r.id));
  }, [state.evo.favIndependentRemIds]);

  // Ambient audio controls
  const toggleMusicPlay = () => {
    setState((prev) => {
      const nextPlaying = !prev.music.playing;
      if (nextPlaying) {
        audioEngineRef.current?.start(
          prev.music.currentTrackId,
          prev.music.volume,
          prev.music.muted
        );
        showToast('Som ambiente iniciado');
      } else {
        audioEngineRef.current?.stop();
        showToast('Som ambiente pausado');
      }
      return {
        ...prev,
        music: { ...prev.music, playing: nextPlaying },
      };
    });
  };

  const selectAmbientTrack = (trackId: string, autoPlay = true) => {
    setState((prev) => {
      const shouldPlay = autoPlay || prev.music.playing;
      if (shouldPlay) {
        audioEngineRef.current?.start(trackId, prev.music.volume, prev.music.muted);
      }
      return {
        ...prev,
        music: {
          ...prev.music,
          currentTrackId: trackId,
          playing: shouldPlay,
        },
      };
    });
  };

  const cycleMusicTrack = (step: number) => {
    const idx = SOUND_TRACKS.findIndex((t) => t.id === state.music.currentTrackId);
    const nextIdx = (idx + step + SOUND_TRACKS.length) % SOUND_TRACKS.length;
    const nextTrack = SOUND_TRACKS[nextIdx];
    selectAmbientTrack(nextTrack.id, true);
    showToast(`Faixa: ${nextTrack.title}`);
  };

  const level = Math.floor(state.xp / 100) + 1;
  const xpInLevel = state.xp % 100;
  const pendingQueueCount = state.queue.filter((q) => !q.completed).length;

  // PDF Fixed 5-Icon Bottom Nav
  const navItems: Array<{
    id: MainTab;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    activeDot?: boolean;
  }> = [
    {
      id: 'tarefas',
      label: 'Explorar',
      mobileLabel: 'Explorar',
      icon: Compass,
    },
    {
      id: 'memorias',
      label: 'Fotos & Memórias',
      mobileLabel: 'Memórias',
      icon: Camera,
      badge: state.memories.length,
    },
    {
      id: 'swipe',
      label: 'Tarefas de Swipe',
      mobileLabel: 'Swipe',
      icon: Sparkles,
    },
    {
      id: 'momento',
      label: 'Tarefa',
      mobileLabel: 'Tarefa',
      icon: ListTodo,
      badge: pendingQueueCount > 0 ? pendingQueueCount : undefined,
      activeDot: state.timer.running,
    },
    {
      id: 'avancos',
      label: 'Gráficos & Avanço',
      mobileLabel: 'Avanço',
      icon: BarChart3,
    },
  ];

  const handleResetAllData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('impulso_app_state_v4');
      localStorage.removeItem('impulso_app_state_v3');
    } catch {
      // ignore
    }
    const fresh = createInitialState();
    fresh.xp = 0;
    fresh.completedCount = 0;
    fresh.focusMinutes = 0;
    fresh.history = [];
    fresh.queue = [];
    setState(fresh);
    setSettingsOpen(false);
    setOnboardingOpen(true);
    showToast('Dados restaurados para o padrão');
  };

  return (
    <div className="h-dvh w-full overflow-hidden overscroll-none bg-[#F5F5F7] text-slate-900 dark:bg-[#09090D] dark:text-slate-100 transition-colors duration-300 relative flex flex-col">
      {/* Subtle Apple iOS Ambient Backdrop */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
        <div className="absolute top-1/3 -right-24 w-[380px] h-[380px] rounded-full bg-rose-400/10 dark:bg-rose-600/10 blur-[120px]" />
        <div className="absolute -bottom-28 left-1/4 w-[440px] h-[440px] rounded-full bg-amber-300/10 dark:bg-amber-600/10 blur-[120px]" />
      </div>

      {/* Toast Stack */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl backdrop-blur-md"
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Match Overlay */}
      <MatchOverlay
        idea={matchIdea}
        onProceed={() => {
          if (matchTimeoutRef.current) window.clearTimeout(matchTimeoutRef.current);
          setMatchIdea(null);
          navigateToTab('momento');
        }}
      />

      {/* App Shell: Sidebar + Workspace */}
      <div className="max-w-7xl w-full mx-auto flex-1 min-h-0 flex flex-col md:grid md:grid-cols-12 md:gap-6 md:px-6 md:py-6 overflow-hidden">
        {/* Desktop / Tablet Sidebar */}
        <aside className="hidden md:flex md:col-span-3 flex-col justify-between glass-surface rounded-3xl p-5 h-full min-h-0 overflow-y-auto overscroll-y-contain no-scrollbar">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl accent-bg flex items-center justify-center font-bold text-sm shrink-0">
                  I
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    Impulso
                  </h1>
                  <p className="text-[11px] text-slate-400 truncate">
                    Desafios, Maslow & Conexão
                  </p>
                </div>
              </div>
              <span className="font-mono-num text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                Nv. {level}
              </span>
            </div>

            {/* User Profile Card (Click to edit onboarding/correlation data) */}
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(true);
                setOnboardingOpen(true);
              }}
              className="w-full p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center gap-3 text-left hover:opacity-90 transition"
            >
              {state.profile.avatar ? (
                <img
                  src={state.profile.avatar}
                  alt={state.profile.name || 'Perfil'}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full accent-soft-bg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {state.profile.name || 'Configurar Perfil'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {state.profile.profession || state.profile.socialStatus || 'Personalizar correlação'}
                </p>
              </div>
            </button>

            {/* XP & Streak Panel */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] space-y-2.5">
              <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400 font-mono-num">
                <span>{state.xp} XP</span>
                <span>Meta: {level * 100}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200/80 dark:bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full accent-bg transition-all duration-500"
                  style={{ width: `${xpInLevel}%` }}
                />
              </div>
              <div className="pt-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono-num">
                <span>
                  <strong className="text-slate-900 dark:text-white">{state.completedCount}</strong>{' '}
                  feitas
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <strong className="text-slate-900 dark:text-white">{state.streak}</strong> dias
                </span>
              </div>
            </div>

            {/* 5-Option Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateToTab(item.id)}
                    className={`relative w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition whitespace-nowrap ${
                      active
                        ? 'accent-text'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="ios-sidebar-pill"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0.1 }
                            : { type: 'spring', stiffness: 460, damping: 34 }
                        }
                        className="absolute inset-0 rounded-xl accent-soft-bg -z-10"
                      />
                    )}
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.activeDot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                    {item.badge !== undefined && (
                      <span className="font-mono-num text-[11px] opacity-75 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Controls */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setNewIdeaModalOpen(true)}
              className="w-full min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold accent-bg flex items-center justify-center gap-1.5 hover:opacity-90 transition whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Tarefa</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="md:col-span-9 relative flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Ultra-Minimalist Top Header Bar (Exibida apenas na tela Avanço, flutuando sobre o scroll) */}
          {activeTab === 'avancos' && (
            <header className="absolute top-[max(0.75rem,env(safe-area-inset-top))] md:top-0 inset-x-4 md:inset-x-0 z-30 px-4 py-2.5 rounded-2xl bg-white/75 dark:bg-[#14161F]/75 backdrop-blur-2xl backdrop-saturate-200 border border-slate-900/[0.08] dark:border-white/10 shadow-[0_10px_28px_-8px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.72)] flex items-center justify-between gap-3">
              {/* Left: Brand + Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(true);
                  setOnboardingOpen(true);
                }}
                className="flex items-center gap-2.5 min-w-0 text-left"
                title="Editar perfil de correlação"
              >
                {state.profile.avatar ? (
                  <img
                    src={state.profile.avatar}
                    alt={state.profile.name || 'Perfil'}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-xs font-bold shrink-0">
                    I
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate leading-tight">
                    Impulso
                  </p>
                  {state.profile.name && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {state.profile.name}
                    </p>
                  )}
                </div>
              </button>

              {/* Right: Minimalist Level & Streak Indicator */}
              <div className="flex items-center gap-2 text-[11px] font-semibold font-mono-num text-slate-500 dark:text-slate-400 shrink-0">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>{state.streak}d</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>Nv. {level}</span>
              </div>
            </header>
          )}

          {/* Active View with iOS Slide-Over Transition */}
          <main className="relative flex-1 min-h-0 px-4 sm:px-6 md:px-0 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={tabDirection}>
              <motion.div
                key={activeTab}
                custom={tabDirection}
                variants={shouldReduceMotion ? undefined : tabSlideVariants}
                initial={shouldReduceMotion ? { opacity: 0 } : 'enter'}
                animate={shouldReduceMotion ? { opacity: 1 } : 'center'}
                exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.14 }
                    : {
                        x: { type: 'spring', stiffness: 360, damping: 32, mass: 0.85 },
                        opacity: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                      }
                }
                className="h-full w-full flex flex-col min-h-0"
              >
            {/* TAB 1: EXPLORAR (Minimalista: Tarefas + Fila) */}
            {activeTab === 'tarefas' && (
              <TasksHubView
                subTab={tasksSubTab}
                onChangeSubTab={setTasksSubTab}
                ideas={state.ideas}
                profile={state.profile}
                queue={state.queue}
                queueFilter={state.queueFilter}
                onFocusIdeaNow={handleFocusIdeaNow}
                onAddToQueue={handleAddToQueue}
                onChangeQueueFilter={(f) =>
                  setState((prev) => ({ ...prev, queueFilter: f }))
                }
                onAddQuickTask={(title, duration) => {
                  const newItem: QueueItem = {
                    id: 'q-' + Date.now(),
                    title,
                    category: 'foco',
                    time: duration,
                    xp: Math.round(duration * 1.25),
                    completed: false,
                    steps: [
                      'Definir o primeiro passo',
                      'Executar sem distrações',
                      'Revisar e concluir',
                    ],
                  };
                  setState((prev) => ({ ...prev, queue: [newItem, ...prev.queue] }));
                  showToast('Adicionada na fila');
                }}
                onToggleQueueItem={(id) => {
                  const target = state.queue.find((q) => q.id === id);
                  if (!target) return;
                  const nextDone = !target.completed;
                  setState((prev) => ({
                    ...prev,
                    queue: prev.queue.map((q) =>
                      q.id === id ? { ...q, completed: nextDone } : q
                    ),
                  }));
                  if (nextDone) awardCompletion(target.title, target.xp, target.time);
                }}
                onFocusQueueItem={(item) => {
                  setState((prev) => ({
                    ...prev,
                    timer: {
                      ...prev.timer,
                      running: false,
                      mode: 'custom',
                      clockType:
                        prev.timer.clockType === 'journey'
                          ? 'countdown'
                          : prev.timer.clockType,
                      totalSeconds: item.time * 60,
                      secondsLeft: item.time * 60,
                      customFocusTarget: {
                        id: item.id,
                        title: item.title,
                        description: item.description || 'Tarefa da sua Fila de Ação.',
                        category: item.category,
                        energy: 'media',
                        time: item.time,
                        xp: item.xp,
                        steps: item.steps,
                        source: 'queue',
                      },
                    },
                  }));
                  navigateToTab('momento');
                }}
                onDeleteQueueItem={(id) => {
                  setState((prev) => ({
                    ...prev,
                    queue: prev.queue.filter((q) => q.id !== id),
                  }));
                  showToast('Item removido');
                }}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {/* TAB 2: FOTOS & MEMÓRIAS (Instagram-inspired 4-photo grid + bottom controls) */}
            {activeTab === 'memorias' && (
              <MemoriesView
                memories={state.memories}
                onlyFavorites={state.onlyFavMemories}
                queue={state.queue}
                ideas={state.ideas}
                profile={state.profile}
                prefillTaskTitle={memoryPrefillTask}
                onClearPrefillTask={() => setMemoryPrefillTask('')}
                onToggleFilterFavorites={() =>
                  setState((prev) => ({
                    ...prev,
                    onlyFavMemories: !prev.onlyFavMemories,
                  }))
                }
                onAddMemory={(mem: MemoryItem) => {
                  setState((prev) => ({
                    ...prev,
                    memories: [mem, ...prev.memories],
                  }));
                  awardCompletion(`Memória registrada: ${mem.title}`, 20, 5);
                }}
                onToggleFavoriteMemory={(id) =>
                  setState((prev) => ({
                    ...prev,
                    memories: prev.memories.map((m) =>
                      m.id === id ? { ...m, fav: !m.fav } : m
                    ),
                  }))
                }
                onDeleteMemory={(id) => {
                  setState((prev) => ({
                    ...prev,
                    memories: prev.memories.filter((m) => m.id !== id),
                  }));
                  showToast('Memória removida');
                }}
              />
            )}

            {/* TAB 3: TAREFAS DE SWIPE (Tarefas + Lembretes + Vieses & Antídotos) */}
            {activeTab === 'swipe' && (
              <DiscoverView
                ideas={state.ideas}
                profile={state.profile}
                spotlightId={state.spotlightId}
                filters={state.filters}
                dismissedUntil={state.evo.dismissedUntil}
                reminders={state.evo.reminders}
                favIndependentRemIds={state.evo.favIndependentRemIds}
                thoughtLogs={state.thoughtLogs}
                onSelectSpotlight={(id) =>
                  setState((prev) => ({ ...prev, spotlightId: id }))
                }
                onUpdateFilters={(next) =>
                  setState((prev) => ({
                    ...prev,
                    filters: { ...prev.filters, ...next },
                  }))
                }
                onResetFilters={() => {
                  setState((prev) => ({
                    ...prev,
                    filters: {
                      energy: 'all',
                      time: 'all',
                      category: 'all',
                      search: '',
                      onlyFavorites: false,
                      onlyProfileMatch: false,
                      deckType: 'all',
                    },
                  }));
                  showToast('Filtros restaurados');
                }}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onToggleFavorite={handleToggleFavorite}
                onAddToQueue={handleAddToQueue}
                onCompleteNow={(idea) => {
                  awardCompletion(idea.title, idea.xp, idea.time);
                  setState((prev) => ({
                    ...prev,
                    spotlightId: advanceSpotlight(
                      idea.id,
                      prev.ideas,
                      prev.evo.dismissedUntil
                    ),
                  }));
                }}
                onDismissReminderCard={(remCard: IndependentReminderCard, nextId: string) => {
                  playUiSound('nope', state.soundEnabled);
                  const until = Date.now() + 24 * 60 * 60 * 1000;
                  setState((prev) => ({
                    ...prev,
                    spotlightId: nextId || prev.spotlightId,
                    evo: {
                      ...prev.evo,
                      dismissedUntil: { ...prev.evo.dismissedUntil, [remCard.id]: until },
                    },
                  }));
                }}
                onSaveReminderFromSwipe={(remCard: IndependentReminderCard, nextId: string) => {
                  playUiSound('match', state.soundEnabled);
                  const until = Date.now() + 24 * 60 * 60 * 1000;
                  setState((prev) => {
                    const alreadyExists = prev.evo.reminders.some(
                      (r) => r.title.toLowerCase() === remCard.title.toLowerCase()
                    );
                    const nextReminders = alreadyExists
                      ? prev.evo.reminders
                      : [
                          {
                            id: 'rem-' + Date.now(),
                            title: remCard.title,
                            tier: remCard.tier,
                            datetime: '',
                            fav: false,
                            done: false,
                          },
                          ...prev.evo.reminders,
                        ];
                    return {
                      ...prev,
                      spotlightId: nextId || prev.spotlightId,
                      evo: {
                        ...prev.evo,
                        reminders: nextReminders,
                        dismissedUntil: { ...prev.evo.dismissedUntil, [remCard.id]: until },
                      },
                    };
                  });
                  showToast('Lembrete salvo nos seus Lembretes!');
                }}
                onCompleteReminderNow={(remCard: IndependentReminderCard, nextId: string) => {
                  awardCompletion(remCard.title, 15, 2);
                  const until = Date.now() + 24 * 60 * 60 * 1000;
                  setState((prev) => ({
                    ...prev,
                    spotlightId: nextId || prev.spotlightId,
                    evo: {
                      ...prev.evo,
                      dismissedUntil: { ...prev.evo.dismissedUntil, [remCard.id]: until },
                    },
                  }));
                }}
                onToggleFavIndependentRem={(remCardId: string) =>
                  setState((prev) => {
                    const isFav = prev.evo.favIndependentRemIds.includes(remCardId);
                    return {
                      ...prev,
                      evo: {
                        ...prev.evo,
                        favIndependentRemIds: isFav
                          ? prev.evo.favIndependentRemIds.filter((id) => id !== remCardId)
                          : [...prev.evo.favIndependentRemIds, remCardId],
                      },
                    };
                  })
                }
                onToggleReminderDone={(id: string) => {
                  const target = state.evo.reminders.find((r) => r.id === id);
                  if (!target) return;
                  const willBeDone = !target.done;
                  setState((prev) => ({
                    ...prev,
                    evo: {
                      ...prev.evo,
                      reminders: prev.evo.reminders.map((r) =>
                        r.id === id ? { ...r, done: willBeDone } : r
                      ),
                    },
                  }));
                  if (willBeDone) awardCompletion(target.title, 15, 5);
                }}
                onToggleFavoriteReminder={(id: string) =>
                  setState((prev) => ({
                    ...prev,
                    evo: {
                      ...prev.evo,
                      reminders: prev.evo.reminders.map((r) =>
                        r.id === id ? { ...r, fav: !r.fav } : r
                      ),
                    },
                  }))
                }
                onSaveCustomReminder={({ id, title, tier, datetime }) => {
                  setState((prev) => {
                    const nextReminders = id
                      ? prev.evo.reminders.map((r) =>
                          r.id === id ? { ...r, title, tier, datetime } : r
                        )
                      : [
                          {
                            id: 'rem-' + Date.now(),
                            title,
                            tier,
                            datetime,
                            fav: false,
                            done: false,
                          },
                          ...prev.evo.reminders,
                        ];
                    return {
                      ...prev,
                      evo: { ...prev.evo, reminders: nextReminders },
                    };
                  });
                  showToast(id ? 'Lembrete atualizado!' : 'Lembrete salvo!');
                }}
                onDeleteReminder={(id: string) => {
                  setState((prev) => ({
                    ...prev,
                    evo: {
                      ...prev.evo,
                      reminders: prev.evo.reminders.filter((r) => r.id !== id),
                    },
                  }));
                  showToast('Lembrete excluído');
                }}
                onStartAntidoteFocus={(biasKey, title, stepText, minutes) => {
                  setState((prev) => ({
                    ...prev,
                    timer: {
                      ...prev.timer,
                      running: false,
                      mode: 'custom',
                      clockType: 'countdown',
                      totalSeconds: minutes * 60,
                      secondsLeft: minutes * 60,
                      customFocusTarget: {
                        id: `antidote-${biasKey}-${Date.now()}`,
                        title,
                        description:
                          'Ação direta gerada a partir de Vieses & Antídotos no Swipe.',
                        category: 'vieses-gatilhos',
                        energy: 'baixa',
                        time: minutes,
                        xp: Math.max(15, minutes * 2),
                        biasKey,
                        steps: [stepText, 'Registrar como se sentiu ao concluir'],
                        source: 'antidote',
                      },
                    },
                  }));
                  navigateToTab('momento');
                  showToast('Passo antídoto pronto em Tarefa!');
                }}
                onSaveThoughtLog={(entry: ThoughtReframeEntry) => {
                  setState((prev) => ({
                    ...prev,
                    thoughtLogs: [entry, ...prev.thoughtLogs],
                  }));
                  awardCompletion('Reestruturação de Pensamento (TCC)', 20, 5);
                }}
                onDismissBiasCard={(biasCardId: string, nextId: string) => {
                  playUiSound('nope', state.soundEnabled);
                  const until = Date.now() + 24 * 60 * 60 * 1000;
                  setState((prev) => ({
                    ...prev,
                    spotlightId: nextId || prev.spotlightId,
                    evo: {
                      ...prev.evo,
                      dismissedUntil: { ...prev.evo.dismissedUntil, [biasCardId]: until },
                    },
                  }));
                }}
                onRestoreDismissed={() => {
                  setState((prev) => ({
                    ...prev,
                    rejectedIdeaIds: [],
                    evo: { ...prev.evo, dismissedUntil: {} },
                  }));
                  showToast('Cartas do Swipe restauradas');
                }}
                onSpinRandom={handleSpinRandom}
              />
            )}

            {/* TAB 4: MATCH & MOMENTO (Foco limpo sem vieses + Lixeira Top-Left + Barra inferior exclusiva Relógio/Música) */}
            {activeTab === 'momento' && (
              <MomentoView
                target={activeFocusTarget}
                matchedQueue={state.queue}
                favoriteIdeas={favoriteIdeas}
                favoriteReminders={favoriteReminders}
                rejectedIdeas={rejectedIdeas}
                checkedSteps={state.checkedStepsByIdea[activeFocusTarget.id] || {}}
                scratchpad={state.scratchpadByIdea[activeFocusTarget.id] || ''}
                timer={state.timer}
                musicPlaying={state.music.playing}
                onToggleStep={(idx) =>
                  setState((prev) => {
                    const map = prev.checkedStepsByIdea[activeFocusTarget.id] || {};
                    return {
                      ...prev,
                      checkedStepsByIdea: {
                        ...prev.checkedStepsByIdea,
                        [activeFocusTarget.id]: { ...map, [idx]: !map[idx] },
                      },
                    };
                  })
                }
                onAddSubStep={(text) => {
                  setState((prev) => {
                    if (prev.timer.customFocusTarget) {
                      return {
                        ...prev,
                        timer: {
                          ...prev.timer,
                          customFocusTarget: {
                            ...prev.timer.customFocusTarget,
                            steps: [...prev.timer.customFocusTarget.steps, text],
                          },
                        },
                      };
                    }
                    return {
                      ...prev,
                      ideas: prev.ideas.map((i) =>
                        i.id === prev.timer.activeIdeaId
                          ? { ...i, steps: [...i.steps, text] }
                          : i
                      ),
                    };
                  });
                  showToast('Passo adicionado');
                }}
                onUpdateScratchpad={(text) =>
                  setState((prev) => ({
                    ...prev,
                    scratchpadByIdea: {
                      ...prev.scratchpadByIdea,
                      [activeFocusTarget.id]: text,
                    },
                  }))
                }
                onCompleteTaskWithRatings={(mastery, pleasure) => {
                  const mpLog: MasteryPleasureLog = {
                    id: 'mp-' + Date.now(),
                    title: activeFocusTarget.title,
                    mastery,
                    pleasure,
                    dateLabel: 'Hoje',
                  };
                  awardCompletion(
                    activeFocusTarget.title,
                    activeFocusTarget.xp,
                    activeFocusTarget.time
                  );
                  setState((prev) => ({
                    ...prev,
                    masteryPleasureLogs: [mpLog, ...prev.masteryPleasureLogs],
                    queue:
                      activeFocusTarget.source === 'queue'
                        ? prev.queue.map((q) =>
                            q.id === activeFocusTarget.id ? { ...q, completed: true } : q
                          )
                        : prev.queue,
                    timer: { ...prev.timer, running: false },
                    spotlightId: advanceSpotlight(
                      prev.spotlightId,
                      prev.ideas,
                      prev.evo.dismissedUntil
                    ),
                  }));
                  navigateToTab('swipe');
                }}
                onCreateMemory={() => {
                  setMemoryPrefillTask(activeFocusTarget.title);
                  navigateToTab('memorias');
                }}
                onSelectQueueItemToFocus={(item) => {
                  setState((prev) => ({
                    ...prev,
                    timer: {
                      ...prev.timer,
                      running: false,
                      mode: 'custom',
                      clockType:
                        prev.timer.clockType === 'journey'
                          ? 'countdown'
                          : prev.timer.clockType,
                      totalSeconds: item.time * 60,
                      secondsLeft: item.time * 60,
                      customFocusTarget: {
                        id: item.id,
                        title: item.title,
                        description: item.description || 'Match salvo na sua Fila de Tarefas.',
                        category: item.category,
                        energy: 'media',
                        time: item.time,
                        xp: item.xp,
                        steps: item.steps,
                        source: 'queue',
                      },
                    },
                  }));
                  showToast(`Carregada em Tarefas: ${item.title}`);
                }}
                onToggleQueueItem={(id) => {
                  const target = state.queue.find((q) => q.id === id);
                  if (!target) return;
                  const nextDone = !target.completed;
                  setState((prev) => ({
                    ...prev,
                    queue: prev.queue.map((q) =>
                      q.id === id ? { ...q, completed: nextDone } : q
                    ),
                  }));
                  if (nextDone) awardCompletion(target.title, target.xp, target.time);
                }}
                onDeleteQueueItem={(id) => {
                  setState((prev) => ({
                    ...prev,
                    queue: prev.queue.filter((q) => q.id !== id),
                  }));
                  showToast('Match removido da fila');
                }}
                onSelectFavoriteIdeaToFocus={handleFocusIdeaNow}
                onSelectFavoriteReminderToFocus={(rem) => {
                  setState((prev) => ({
                    ...prev,
                    timer: {
                      ...prev.timer,
                      running: false,
                      mode: 'custom',
                      clockType:
                        prev.timer.clockType === 'journey'
                          ? 'countdown'
                          : prev.timer.clockType,
                      totalSeconds: 60,
                      secondsLeft: 60,
                      customFocusTarget: {
                        id: rem.id,
                        title: rem.title,
                        description: rem.desc,
                        category: 'bem-estar',
                        energy: 'baixa',
                        time: 1,
                        xp: 15,
                        steps: [rem.title],
                        source: 'plan',
                      },
                    },
                  }));
                  showToast(`Carregado em Tarefa: ${rem.title}`);
                }}
                onToggleFavoriteIdea={handleToggleFavorite}
                onToggleFavoriteReminder={(remId) =>
                  setState((prev) => {
                    const isFav = prev.evo.favIndependentRemIds.includes(remId);
                    return {
                      ...prev,
                      evo: {
                        ...prev.evo,
                        favIndependentRemIds: isFav
                          ? prev.evo.favIndependentRemIds.filter((id) => id !== remId)
                          : [...prev.evo.favIndependentRemIds, remId],
                      },
                    };
                  })
                }
                onRestoreRejectedIdea={(id) => {
                  setState((prev) => {
                    const nextDismissed = { ...prev.evo.dismissedUntil };
                    delete nextDismissed[id];
                    return {
                      ...prev,
                      rejectedIdeaIds: prev.rejectedIdeaIds.filter((x) => x !== id),
                      spotlightId: id,
                      evo: { ...prev.evo, dismissedUntil: nextDismissed },
                    };
                  });
                  showToast('Tarefa devolvida ao Swipe');
                }}
                onMatchRejectedIdea={(idea) => {
                  handleSwipeRight(idea);
                }}
                onRestoreAllRejected={() => {
                  setState((prev) => ({
                    ...prev,
                    rejectedIdeaIds: [],
                    evo: { ...prev.evo, dismissedUntil: {} },
                  }));
                  showToast('Todas as tarefas rejeitadas foram restauradas');
                }}
                onOpenTimerPopup={() => setTimerPopupOpen(true)}
                onToggleTimerPlay={() =>
                  setState((prev) => ({
                    ...prev,
                    timer: { ...prev.timer, running: !prev.timer.running },
                  }))
                }
                onOpenMusicPopup={() => setMusicPopupOpen(true)}
              />
            )}

            {/* TAB 5: GRÁFICOS & AVANÇOS (PDF Screen 5 + Top-Left Settings + Export JSON) */}
            {activeTab === 'avancos' && (
              <EvolutionView
                evo={state.evo}
                ideas={state.ideas}
                xp={state.xp}
                completedCount={state.completedCount}
                focusMinutes={state.focusMinutes}
                history={state.history}
                masteryPleasureLogs={state.masteryPleasureLogs}
                thoughtLogsCount={state.thoughtLogs.length}
                onSwitchSubTab={(sub) =>
                  setState((prev) => ({
                    ...prev,
                    evo: { ...prev.evo, activeSubTab: sub },
                  }))
                }
                onToggleTier={(tierId: MaslowTierId) =>
                  setState((prev) => {
                    const exists = prev.evo.selectedTiers.includes(tierId);
                    return {
                      ...prev,
                      evo: {
                        ...prev.evo,
                        selectedTiers: exists
                          ? prev.evo.selectedTiers.filter((t) => t !== tierId)
                          : [...prev.evo.selectedTiers, tierId],
                      },
                    };
                  })
                }
                onUpdateEvo={(updater: (prev: EvoState) => EvoState) =>
                  setState((prev) => ({ ...prev, evo: updater(prev.evo) }))
                }
                onStartPlanFocus={(title, _tier, minutes) => {
                  setState((prev) => ({
                    ...prev,
                    timer: {
                      ...prev.timer,
                      running: false,
                      mode: 'custom',
                      clockType: 'countdown',
                      totalSeconds: minutes * 60,
                      secondsLeft: minutes * 60,
                      customFocusTarget: {
                        id: 'plan-' + Date.now(),
                        title,
                        description:
                          'Micro-passo realista gerado no seu plano Minha Evolução.',
                        category: 'bem-estar',
                        energy: 'baixa',
                        time: minutes,
                        xp: Math.max(15, minutes),
                        steps: [
                          'Separar o ambiente por 1 minuto',
                          title,
                          'Celebrar o pequeno avanço',
                        ],
                        source: 'plan',
                      },
                    },
                  }));
                  navigateToTab('momento');
                }}
                onAwardCompletion={awardCompletion}
                onOpenSettings={() => setSettingsOpen(true)}
                onResetAllData={handleResetAllData}
                onShowToast={showToast}
              />
            )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile Fixed 5-Icon Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] inset-x-2 z-40 rounded-2xl glass-dock px-1.5 py-1">
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateToTab(item.id)}
                className={`relative min-h-[46px] flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 ${
                  active
                    ? 'accent-text'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="ios-bottom-pill"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.1 }
                        : { type: 'spring', stiffness: 480, damping: 34 }
                    }
                    className="absolute inset-0.5 rounded-xl accent-soft-bg -z-10"
                  />
                )}
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold mt-0.5 whitespace-nowrap">
                  {item.mobileLabel}
                </span>
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-2.5 min-w-[14px] h-[14px] px-1 rounded-full accent-bg text-[9px] font-bold flex items-center justify-center font-mono-num">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals & Pop-ups */}
      <OnboardingModal
        open={onboardingOpen}
        isEditing={isEditingProfile || state.profile.completedOnboarding}
        profile={state.profile}
        onSave={(updatedProfile: UserProfile) => {
          setState((prev) => ({ ...prev, profile: updatedProfile }));
          setOnboardingOpen(false);
          setIsEditingProfile(false);
          showToast('Perfil e correlação salvos!');
        }}
        onClose={() => {
          setOnboardingOpen(false);
          setIsEditingProfile(false);
        }}
      />

      <SettingsModal
        open={settingsOpen}
        isDark={isDark}
        accentTheme={state.accentTheme}
        soundEnabled={state.soundEnabled}
        profile={state.profile}
        onClose={() => setSettingsOpen(false)}
        onToggleDark={() => setIsDark((d) => !d)}
        onChangeAccent={(accent: AccentTheme) => {
          setState((prev) => ({ ...prev, accentTheme: accent }));
          showToast('Cor do aplicativo atualizada');
        }}
        onToggleSound={() =>
          setState((prev) => {
            const next = !prev.soundEnabled;
            showToast(next ? 'Efeitos sonoros ativados' : 'Efeitos silenciados');
            return { ...prev, soundEnabled: next };
          })
        }
        onEditProfile={() => {
          setSettingsOpen(false);
          setIsEditingProfile(true);
          setOnboardingOpen(true);
        }}
        onRequestReset={handleResetAllData}
      />

      <TimerPopupModal
        open={timerPopupOpen}
        timer={state.timer}
        onClose={() => setTimerPopupOpen(false)}
        onSelectClockType={(clockType: ClockDisplayMode) =>
          setState((prev) => ({
            ...prev,
            timer: { ...prev.timer, clockType },
          }))
        }
        onSetTimerMode={(mode, minutes) =>
          setState((prev) => ({
            ...prev,
            timer: {
              ...prev.timer,
              running: false,
              clockType: 'countdown',
              mode,
              totalSeconds: minutes * 60,
              secondsLeft: minutes * 60,
            },
          }))
        }
        onAdjustTimer={(delta) =>
          setState((prev) => {
            const nextLeft = Math.max(60, prev.timer.secondsLeft + delta);
            const nextTotal = Math.max(60, prev.timer.totalSeconds + delta);
            return {
              ...prev,
              timer: {
                ...prev.timer,
                secondsLeft: nextLeft,
                totalSeconds: nextTotal,
              },
            };
          })
        }
        onToggleTimer={() =>
          setState((prev) => ({
            ...prev,
            timer: { ...prev.timer, running: !prev.timer.running },
          }))
        }
        onResetTimer={() =>
          setState((prev) => ({
            ...prev,
            timer: {
              ...prev.timer,
              running: false,
              secondsLeft: prev.timer.totalSeconds,
              stopwatchSeconds: 0,
            },
          }))
        }
      />

      <MusicPopupModal
        open={musicPopupOpen}
        music={state.music}
        onClose={() => setMusicPopupOpen(false)}
        onTogglePlay={toggleMusicPlay}
        onToggleMute={() =>
          setState((prev) => {
            const nextMuted = !prev.music.muted;
            audioEngineRef.current?.setVolume(prev.music.volume, nextMuted);
            return { ...prev, music: { ...prev.music, muted: nextMuted } };
          })
        }
        onCycleTrack={cycleMusicTrack}
        onSelectTrack={(trackId) => selectAmbientTrack(trackId, true)}
        onChangeVolume={(vol) =>
          setState((prev) => {
            audioEngineRef.current?.setVolume(vol, prev.music.muted);
            return { ...prev, music: { ...prev.music, volume: vol } };
          })
        }
        onToggleFavTrack={(trackId) =>
          setState((prev) => {
            const exists = prev.music.favTrackIds.includes(trackId);
            return {
              ...prev,
              music: {
                ...prev.music,
                favTrackIds: exists
                  ? prev.music.favTrackIds.filter((x) => x !== trackId)
                  : [...prev.music.favTrackIds, trackId],
              },
            };
          })
        }
      />

      <NewIdeaModal
        open={newIdeaModalOpen}
        onClose={() => setNewIdeaModalOpen(false)}
        onCreate={(newIdea) => {
          setState((prev) => ({
            ...prev,
            ideas: [newIdea, ...prev.ideas],
            spotlightId: newIdea.id,
          }));
          navigateToTab('swipe');
          showToast('Tarefa criada no topo do Swipe');
        }}
      />
    </div>
  );
}
