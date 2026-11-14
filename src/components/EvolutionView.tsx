import React, { useMemo, useRef, useState } from 'react';
import {
  Award,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Leaf,
  Lightbulb,
  Lock,
  PieChart,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import {
  CATEGORY_TO_PYRAMID_KEY,
  EVO_LIGHT_QUESTIONS,
  MASLOW_TIERS,
  PYRAMID_FIXED_PALETTE,
} from '../data/ideas';
import type {
  EvoGoal,
  EvoState,
  EvoSubTab,
  HistoryEntry,
  Idea,
  LeaveHabit,
  MaslowTierId,
  MasteryPleasureLog,
} from '../types/impulso';

interface EvolutionViewProps {
  evo: EvoState;
  ideas: Idea[];
  xp: number;
  completedCount: number;
  focusMinutes: number;
  history: HistoryEntry[];
  masteryPleasureLogs: MasteryPleasureLog[];
  thoughtLogsCount: number;
  onSwitchSubTab: (sub: EvoSubTab) => void;
  onToggleTier: (tierId: MaslowTierId) => void;
  onUpdateEvo: (updater: (prev: EvoState) => EvoState) => void;
  onStartPlanFocus: (title: string, tier: MaslowTierId, minutes: number) => void;
  onAwardCompletion: (title: string, xp: number, minutes: number) => void;
  onOpenSettings: () => void;
  onResetAllData: () => void;
  onShowToast: (msg: string) => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({
  evo,
  ideas,
  xp,
  completedCount,
  focusMinutes,
  history,
  masteryPleasureLogs,
  thoughtLogsCount,
  onSwitchSubTab,
  onToggleTier,
  onUpdateEvo,
  onStartPlanFocus,
  onAwardCompletion,
  onOpenSettings,
  onResetAllData,
  onShowToast,
}) => {
  const [questionDraft, setQuestionDraft] = useState(
    () => evo.answers[EVO_LIGHT_QUESTIONS[evo.currentQuestionIdx]?.id] || ''
  );
  const [showSavedAnswers, setShowSavedAnswers] = useState(false);

  // Goal form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTier, setGoalTier] = useState<MaslowTierId>('fisiologico');
  const [goalObstacleId, setGoalObstacleId] = useState('');
  const [goalStepsRaw, setGoalStepsRaw] = useState('');

  // Leave habit form state
  const [habitTitle, setHabitTitle] = useState('');
  const [habitWhy, setHabitWhy] = useState('');
  const [habitStepsRaw, setHabitStepsRaw] = useState('');
  const [motivationHabit, setMotivationHabit] = useState<LeaveHabit | null>(null);

  // Charts & Reset state
  const [chartMode, setChartMode] = useState<'pie' | 'bar'>('pie');
  const [chartDetailsOpen, setChartDetailsOpen] = useState(false);
  const [hoveredTier, setHoveredTier] = useState<MaslowTierId | null>(null);
  const chartTouchStartXRef = useRef(0);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const favoritesCount = ideas.filter((i) => i.favorite).length;

  const avgMastery = useMemo(() => {
    if (masteryPleasureLogs.length === 0) return null;
    const sum = masteryPleasureLogs.reduce((acc, item) => acc + item.mastery, 0);
    return (sum / masteryPleasureLogs.length).toFixed(1);
  }, [masteryPleasureLogs]);

  const avgPleasure = useMemo(() => {
    if (masteryPleasureLogs.length === 0) return null;
    const sum = masteryPleasureLogs.reduce((acc, item) => acc + item.pleasure, 0);
    return (sum / masteryPleasureLogs.length).toFixed(1);
  }, [masteryPleasureLogs]);

  const currentQuestion =
    EVO_LIGHT_QUESTIONS[
      Math.max(0, Math.min(EVO_LIGHT_QUESTIONS.length - 1, evo.currentQuestionIdx || 0))
    ];

  const syncQuestionDraft = (idx: number) => {
    const q = EVO_LIGHT_QUESTIONS[idx];
    setQuestionDraft((q && evo.answers[q.id]) || '');
  };

  // Adaptive Plan suggestions
  const adaptivePlan = useMemo(() => {
    const suggestions: Array<{
      title: string;
      tier: MaslowTierId;
      tierLabel: string;
      time: number;
    }> = [];

    EVO_LIGHT_QUESTIONS.forEach((q) => {
      const ans = (evo.answers[q.id] || '').trim();
      if (ans) {
        suggestions.push({
          title: `${q.suggestionPrefix} dedicar 10 min para "${ans}"`,
          tier: q.tier,
          tierLabel: q.tierLabel,
          time: 10,
        });
      }
    });

    evo.selectedTiers.forEach((tId) => {
      const tierObj = MASLOW_TIERS.find((t) => t.id === tId);
      if (!tierObj) return;
      const matchingIdea = ideas.find((i) => tierObj.mappedCategories.includes(i.category));
      if (matchingIdea && suggestions.length < 4) {
        suggestions.push({
          title: matchingIdea.title,
          tier: tId,
          tierLabel: tierObj.name,
          time: matchingIdea.time,
        });
      }
    });

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'Tomar um copo de água fresca e respirar 2 minutos sem telas',
        tier: 'fisiologico',
        tierLabel: 'Fisiológico',
        time: 5,
      });
    }

    return suggestions.slice(0, 4);
  }, [evo.answers, evo.selectedTiers, ideas]);

  // Unified Pyramid Stats for Synchronized Charts
  const pyramidStats = useMemo(() => {
    const stats: Record<MaslowTierId, { total: number; completed: number }> = {
      fisiologico: { total: 0, completed: 0 },
      seguranca: { total: 0, completed: 0 },
      pertencimento: { total: 0, completed: 0 },
      estima: { total: 0, completed: 0 },
      autorrealizacao: { total: 0, completed: 0 },
    };

    ideas.forEach((idea) => {
      const pKey = CATEGORY_TO_PYRAMID_KEY[idea.category] || 'estima';
      stats[pKey].total += 1;
    });

    evo.goals.forEach((g) => {
      const pKey = stats[g.tier] ? g.tier : 'estima';
      g.steps.forEach((st) => {
        stats[pKey].total += 1;
        if (st.done) stats[pKey].completed += 2;
      });
    });

    evo.reminders.forEach((r) => {
      const pKey = stats[r.tier] ? r.tier : 'fisiologico';
      stats[pKey].total += 1;
      if (r.done) stats[pKey].completed += 2;
    });

    return stats;
  }, [ideas, evo.goals, evo.reminders]);

  const chartSeries = useMemo(() => {
    const keys: MaslowTierId[] = [
      'fisiologico',
      'seguranca',
      'pertencimento',
      'estima',
      'autorrealizacao',
    ];
    const items = keys.map((k) => {
      const value = pyramidStats[k].total + pyramidStats[k].completed;
      return {
        key: k,
        label: PYRAMID_FIXED_PALETTE[k].label,
        hex: PYRAMID_FIXED_PALETTE[k].hex,
        badgeClass: PYRAMID_FIXED_PALETTE[k].badgeClass,
        total: pyramidStats[k].total,
        completed: pyramidStats[k].completed,
        value,
      };
    });
    const sum = items.reduce((acc, item) => acc + item.value, 0) || 1;
    const maxVal = Math.max(...items.map((i) => i.value), 1);

    let cumulativePct = 0;
    const withArc = items.map((item) => {
      const pct = (item.value / sum) * 100;
      const startPct = cumulativePct;
      cumulativePct += pct;
      return { ...item, pct, startPct };
    });

    return { items: withArc, sum, maxVal };
  }, [pyramidStats]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = goalTitle.trim();
    if (!trimmed) return;
    const steps = (
      goalStepsRaw.trim()
        ? goalStepsRaw.trim().split('\n')
        : ['Dar o primeiro passo de 5 minutos', 'Continuar no meu ritmo']
    )
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text, done: false }));

    const newGoal: EvoGoal = {
      id: 'goal-' + Date.now(),
      title: trimmed,
      tier: goalTier,
      obstacleId: goalObstacleId,
      steps,
    };

    onUpdateEvo((prev) => ({
      ...prev,
      goals: [newGoal, ...prev.goals],
    }));

    setGoalTitle('');
    setGoalStepsRaw('');
    setGoalObstacleId('');
    onShowToast('Objetivo criado.');
  };

  const handleCreateLeaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = habitTitle.trim();
    const w = habitWhy.trim();
    if (!t || !w) return;
    const steps = (
      habitStepsRaw.trim()
        ? habitStepsRaw.trim().split('\n')
        : ['Reduzir gradualmente por 5 minutos hoje', 'Substituir por uma pausa consciente']
    )
      .map((s) => s.trim())
      .filter(Boolean)
      .map((text) => ({ text, done: false }));

    const newHabit: LeaveHabit = {
      id: 'hab-' + Date.now(),
      title: t,
      why: w,
      steps,
    };

    onUpdateEvo((prev) => ({
      ...prev,
      leaveHabits: [newHabit, ...prev.leaveHabits],
    }));

    setHabitTitle('');
    setHabitWhy('');
    setHabitStepsRaw('');
    onShowToast('Plano de substituição salvo.');
  };

  return (
    <section className="h-full min-h-0 overflow-y-auto overscroll-y-contain no-scrollbar space-y-6 pt-[max(4.75rem,calc(env(safe-area-inset-top)+4rem))] md:pt-[4.125rem] pb-24 md:pb-6">
      {/* Top Header & Sub-Navigation (PDF Tab 5: Settings top-left + Export JSON) */}
      <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Configurações gerais e cores"
              title="Configurações Gerais & Paleta de Cores"
              className="min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-200 transition shrink-0"
            >
              <Settings className="w-4 h-4 accent-text" />
            </button>
            <div>
              <p className="text-xs font-semibold accent-text">
                Gráficos, Maslow & Avanço
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                Minha Evolução
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mapa flexível de progresso, sem julgamentos e no seu ritmo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="font-mono-num text-xs font-semibold text-slate-600 dark:text-slate-300">
              {xp} XP · Nível {level}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-white/[0.04] p-1.5 rounded-2xl">
          {[
            { id: 'metricas' as EvoSubTab, label: 'Visão Geral', icon: BarChart3 },
            { id: 'evoluir' as EvoSubTab, label: '1. Pirâmide', icon: Compass },
            { id: 'objetivos' as EvoSubTab, label: '2. Objetivos', icon: Target },
            { id: 'deixar' as EvoSubTab, label: '3. Deixar p/ Trás', icon: Leaf },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = evo.activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSwitchSubTab(tab.id)}
                className={`min-h-[40px] py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  active
                    ? 'bg-white dark:bg-[#1E202B] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'accent-text' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: EVOLUIR */}
      {evo.activeSubTab === 'evoluir' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Maslow Pyramid */}
          <div className="lg:col-span-5 glass-surface rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pirâmide de Maslow Interativa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toque nas áreas que deseja desenvolver agora (sem ordem fixa)
              </p>
            </div>

            <div className="space-y-2 pt-1 flex flex-col items-center">
              {MASLOW_TIERS.map((tier) => {
                const isSelected = evo.selectedTiers.includes(tier.id);
                const tierGoals = evo.goals.filter((g) => g.tier === tier.id);
                let totalSteps = 0;
                let doneSteps = 0;
                tierGoals.forEach((g) => {
                  g.steps.forEach((st) => {
                    totalSteps += 1;
                    if (st.done) doneSteps += 1;
                  });
                });
                const pct =
                  totalSteps > 0
                    ? Math.round((doneSteps / totalSteps) * 100)
                    : isSelected
                      ? 25
                      : 0;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onToggleTier(tier.id)}
                    className={`${tier.widthClass} p-3.5 rounded-2xl border text-left transition active:scale-[0.99] ${
                      isSelected
                        ? `bg-gradient-to-r ${tier.accent} shadow-sm`
                        : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.07] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {tier.name}
                      </span>
                      <span className="font-mono-num text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {isSelected ? `Em foco · ${pct}%` : 'Explorar'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {tier.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-200/70 dark:border-white/[0.08]">
              <strong>Referência livre:</strong> Você pode focar em qualquer área, em qualquer momento da vida, respeitando seu próprio ritmo.
            </p>
          </div>

          {/* Light Reflection Questions + Adaptive Plan */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-surface rounded-3xl p-6 space-y-4">
              {!evo.consentGiven ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/12 text-indigo-500 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Perguntas Leves de Autoconhecimento
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Podemos fazer 5 perguntas curtas (uma por vez) sobre seus interesses para sugerir pequenos passos? Suas respostas ficam salvas apenas neste aparelho e você pode pular, editar ou apagar quando quiser.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateEvo((prev) => ({ ...prev, consentGiven: true }));
                        onShowToast('Consentimento salvo localmente.');
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
                    >
                      Consentir e Começar
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowToast('Explore a pirâmide livremente.')}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 text-xs font-semibold"
                    >
                      Apenas explorar a pirâmide
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-500">
                      Pergunta {evo.currentQuestionIdx + 1} de {EVO_LIGHT_QUESTIONS.length} ·{' '}
                      {currentQuestion.tierLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSavedAnswers((v) => !v)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                    >
                      {showSavedAnswers ? 'Ocultar respostas' : 'Editar / Apagar respostas'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {currentQuestion.prompt}
                    </h4>
                    <input
                      type="text"
                      value={questionDraft}
                      onChange={(e) => setQuestionDraft(e.target.value)}
                      placeholder="Escreva livremente em poucas palavras (ou pule se preferir)..."
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const prevIdx =
                            (evo.currentQuestionIdx - 1 + EVO_LIGHT_QUESTIONS.length) %
                            EVO_LIGHT_QUESTIONS.length;
                          onUpdateEvo((prev) => ({ ...prev, currentQuestionIdx: prevIdx }));
                          syncQuestionDraft(prevIdx);
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-medium text-slate-600 dark:text-slate-300"
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx =
                            (evo.currentQuestionIdx + 1) % EVO_LIGHT_QUESTIONS.length;
                          onUpdateEvo((prev) => ({ ...prev, currentQuestionIdx: nextIdx }));
                          syncQuestionDraft(nextIdx);
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-medium text-slate-600 dark:text-slate-300"
                      >
                        Pular →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx =
                          (evo.currentQuestionIdx + 1) % EVO_LIGHT_QUESTIONS.length;
                        const trimmed = questionDraft.trim();
                        onUpdateEvo((prev) => {
                          const nextAnswers = { ...prev.answers };
                          if (trimmed) nextAnswers[currentQuestion.id] = trimmed;
                          return {
                            ...prev,
                            answers: nextAnswers,
                            currentQuestionIdx: nextIdx,
                          };
                        });
                        syncQuestionDraft(nextIdx);
                        onShowToast('Resposta salva e plano atualizado.');
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
                    >
                      Salvar e Próxima →
                    </button>
                  </div>

                  {showSavedAnswers && (
                    <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400">
                          Suas Respostas Salvas
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateEvo((prev) => ({ ...prev, answers: {} }));
                            setQuestionDraft('');
                            onShowToast('Respostas apagadas.');
                          }}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Apagar todas
                        </button>
                      </div>
                      {Object.keys(evo.answers).filter((k) => evo.answers[k]).length === 0 ? (
                        <p className="text-xs text-slate-400">Nenhuma resposta salva ainda.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {EVO_LIGHT_QUESTIONS.map((item, qIdx) => {
                            const val = evo.answers[item.id];
                            if (!val) return null;
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] text-xs"
                              >
                                <div className="truncate">
                                  <span className="font-semibold text-slate-500">
                                    {item.tierLabel}:{' '}
                                  </span>
                                  <span className="text-slate-800 dark:text-slate-200">{val}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateEvo((prev) => ({
                                        ...prev,
                                        currentQuestionIdx: qIdx,
                                      }));
                                      setQuestionDraft(val);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-white/10 text-[11px] font-medium"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateEvo((prev) => {
                                        const next = { ...prev.answers };
                                        delete next[item.id];
                                        return { ...prev, answers: next };
                                      });
                                      if (evo.currentQuestionIdx === qIdx) setQuestionDraft('');
                                    }}
                                    className="px-2 py-1 rounded-lg text-rose-500 text-[11px] font-medium"
                                  >
                                    Apagar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Adaptive Micro-Steps Plan */}
            <div className="glass-surface rounded-3xl p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-emerald-500">
                  Plano Realista & Adaptativo
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  Micro-Passos Sugeridos Para Você
                </h3>
              </div>

              <div className="space-y-2.5">
                {adaptivePlan.map((sug, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-indigo-500 font-mono-num">
                        {sug.tierLabel} · {sug.time} min
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sug.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateEvo((prev) => ({
                            ...prev,
                            goals: [
                              {
                                id: 'goal-' + Date.now(),
                                title: sug.title,
                                tier: sug.tier,
                                obstacleId: '',
                                steps: [
                                  { text: 'Reservar 5 minutos iniciais sem cobrança', done: false },
                                  { text: sug.title, done: false },
                                ],
                              },
                              ...prev.goals,
                            ],
                          }));
                          onSwitchSubTab('objetivos');
                          onShowToast('Meta adicionada em Objetivos.');
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        Virar Meta
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartPlanFocus(sug.title, sug.tier, sug.time)}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Fazer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: OBJETIVOS */}
      {evo.activeSubTab === 'objetivos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 glass-surface rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Novo Objetivo Pessoal
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Divida um desejo em passos pequenos e gentis
              </p>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Qual objetivo você quer alcançar?
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Ex: Dormir melhor e acordar com disposição"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Área da Pirâmide
                  </label>
                  <select
                    value={goalTier}
                    onChange={(e) => setGoalTier(e.target.value as MaslowTierId)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                  >
                    {(Object.keys(PYRAMID_FIXED_PALETTE) as MaslowTierId[]).map((k) => (
                      <option key={k} value={k}>
                        {PYRAMID_FIXED_PALETTE[k].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Hábito Obstáculo (Opcional)
                  </label>
                  <select
                    value={goalObstacleId}
                    onChange={(e) => setGoalObstacleId(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                  >
                    <option value="">Nenhum obstáculo</option>
                    {evo.leaveHabits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Pequenos Passos (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={goalStepsRaw}
                  onChange={(e) => setGoalStepsRaw(e.target.value)}
                  placeholder={'Desligar telas às 22h30\nPreparar o quarto mais escuro\nBeber água ao acordar'}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Objetivo com Pequenos Passos</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {evo.goals.length === 0 ? (
              <div className="glass-surface rounded-3xl p-8 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum objetivo cadastrado ainda
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Crie um objetivo ao lado ou transforme uma sugestão da aba Evoluir.
                </p>
              </div>
            ) : (
              evo.goals.map((goal) => {
                const tierObj = MASLOW_TIERS.find((t) => t.id === goal.tier) || MASLOW_TIERS[0];
                const done = goal.steps.filter((s) => s.done).length;
                const pct = goal.steps.length > 0 ? Math.round((done / goal.steps.length) * 100) : 0;
                const linkedHabit = goal.obstacleId
                  ? evo.leaveHabits.find((h) => h.id === goal.obstacleId)
                  : null;

                let recommendation = 'Comece pelo passo mais simples hoje, sem pressa.';
                if (pct > 0 && pct < 60)
                  recommendation = 'Bom começo. Um pequeno passo por vez constrói constância.';
                else if (pct >= 60 && pct < 100)
                  recommendation = 'Você já passou da metade. Respeite seu ritmo para concluir.';
                else if (pct === 100)
                  recommendation = 'Objetivo alcançado. Celebre sua evolução nesta área.';

                return (
                  <div key={goal.id} className="glass-surface rounded-3xl p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-indigo-500">{tierObj.name}</p>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {goal.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-num text-xs font-bold text-slate-500">
                          {pct}%
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateEvo((prev) => ({
                              ...prev,
                              goals: prev.goals.filter((g) => g.id !== goal.id),
                            }));
                            onShowToast('Objetivo removido.');
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500"
                          aria-label="Remover objetivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-200/70 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 dark:bg-white transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      {goal.steps.map((st, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            const willBeDone = !st.done;
                            onUpdateEvo((prev) => ({
                              ...prev,
                              goals: prev.goals.map((g) =>
                                g.id === goal.id
                                  ? {
                                      ...g,
                                      steps: g.steps.map((item, idx) =>
                                        idx === sIdx ? { ...item, done: willBeDone } : item
                                      ),
                                    }
                                  : g
                              ),
                            }));
                            if (willBeDone) onAwardCompletion(st.text, 15, 10);
                          }}
                          className={`w-full min-h-[42px] p-3 rounded-xl border flex items-center gap-2.5 text-left text-xs transition ${
                            st.done
                              ? 'bg-emerald-500/8 border-emerald-500/20 text-slate-400 line-through'
                              : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              st.done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {st.done && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span>{st.text}</span>
                        </button>
                      ))}
                    </div>

                    {linkedHabit && (
                      <div className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/20 flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          <strong className="text-rose-500">Obstáculo ligado:</strong>{' '}
                          {linkedHabit.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMotivationHabit(linkedHabit)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-500 font-semibold shrink-0"
                        >
                          Ver Meu Porquê
                        </button>
                      </div>
                    )}

                    <p className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400">
                      {recommendation}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DEIXAR PARA TRÁS */}
      {evo.activeSubTab === 'deixar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 glass-surface rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Deixar Para Trás
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Substitua hábitos que atrapalham de forma gradual e sem culpa
              </p>
            </div>

            <form onSubmit={handleCreateLeaveHabit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Hábito que desejo reduzir ou deixar
                </label>
                <input
                  type="text"
                  required
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="Ex: Rolar vídeos até tarde na cama"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Com suas palavras: Por que quero deixar isso?
                </label>
                <textarea
                  rows={2}
                  required
                  value={habitWhy}
                  onChange={(e) => setHabitWhy(e.target.value)}
                  placeholder="Ex: Quero acordar com mente limpa para meus projetos."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Plano de Substituição Gradual (1 passo por linha)
                </label>
                <textarea
                  rows={3}
                  value={habitStepsRaw}
                  onChange={(e) => setHabitStepsRaw(e.target.value)}
                  placeholder={'Deixar carregador longe da cama\nLer 3 páginas antes de dormir'}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
              >
                Salvar Plano de Substituição Gradual
              </button>
            </form>

            <div className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 space-y-1">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                Cuidado e Apoio Profissional
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Esta ferramenta apoia rotinas cotidianas e nunca faz diagnósticos. Se enfrentar sofrimento emocional intenso ou compulsão, procure um profissional de saúde ou ligue <strong>188 (CVV)</strong> para apoio gratuito 24h.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {evo.leaveHabits.map((hab) => {
              const done = hab.steps.filter((s) => s.done).length;
              const pct = hab.steps.length > 0 ? Math.round((done / hab.steps.length) * 100) : 0;

              return (
                <div key={hab.id} className="glass-surface rounded-3xl p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-emerald-500 font-mono-num">
                        Substituição Gradual · {pct}%
                      </p>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {hab.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMotivationHabit(hab)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Lembrete de Motivação</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateEvo((prev) => ({
                            ...prev,
                            leaveHabits: prev.leaveHabits.filter((h) => h.id !== hab.id),
                          }));
                          onShowToast('Hábito removido.');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500"
                        aria-label="Remover hábito"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs italic text-slate-600 dark:text-slate-300 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08]">
                    “{hab.why}”
                  </p>

                  <div className="space-y-1.5">
                    {hab.steps.map((st, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          const willBeDone = !st.done;
                          onUpdateEvo((prev) => ({
                            ...prev,
                            leaveHabits: prev.leaveHabits.map((h) =>
                              h.id === hab.id
                                ? {
                                    ...h,
                                    steps: h.steps.map((item, idx) =>
                                      idx === sIdx ? { ...item, done: willBeDone } : item
                                    ),
                                  }
                                : h
                            ),
                          }));
                          if (willBeDone) onAwardCompletion(st.text, 15, 10);
                        }}
                        className={`w-full min-h-[42px] p-3 rounded-xl border flex items-center gap-2.5 text-left text-xs transition ${
                          st.done
                            ? 'bg-emerald-500/8 border-emerald-500/20 text-slate-400 line-through'
                            : 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.08] text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            st.done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {st.done && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>{st.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: VISÃO GERAL (Estrutura PDF Tela 5: Medalha no topo + Pirâmide no centro + Pizza & Barras lado a lado) */}
      {evo.activeSubTab === 'metricas' && (
        <div className="space-y-6">
          {/* 1. Top Medal / Level / XP Banner */}
          <div className="glass-surface rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl accent-soft-bg accent-text flex items-center justify-center shrink-0">
                  <Award className="w-7 h-7" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono-num">
                      Nível {level} · {xp} XP
                    </h3>
                    <span className="text-xs font-semibold accent-text">
                      {xpInLevel}/100 XP para o próximo nível
                    </span>
                  </div>
                  <div className="w-48 sm:w-64 h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                    <div
                      className="h-full accent-bg transition-all duration-500"
                      style={{ width: `${xpInLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center sm:text-right">
                <div>
                  <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white">
                    {completedCount}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Concluídas</p>
                </div>
                <div>
                  <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white">
                    {focusMinutes}m
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Foco</p>
                </div>
                <div>
                  <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white">
                    {favoritesCount}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Favoritas</p>
                </div>
                <div>
                  <p className="font-mono-num text-lg font-bold text-slate-900 dark:text-white">
                    {evo.goals.length}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Objetivos</p>
                </div>
              </div>
            </div>

            {avgMastery && avgPleasure && (
              <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Média TCC (Maestria & Prazer):{' '}
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    Maestria {avgMastery}/10
                  </strong>{' '}
                  ·{' '}
                  <strong className="font-mono-num text-slate-900 dark:text-white">
                    Prazer {avgPleasure}/10
                  </strong>
                </span>
                <span className="font-mono-num text-slate-500">
                  {thoughtLogsCount} reestruturações cognitivas registradas
                </span>
              </div>
            )}
          </div>

          {/* 2. Centered Interactive Maslow Pyramid (Screen 5 center block) */}
          <div className="glass-surface rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pirâmide de Maslow — Áreas em Foco
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toque em qualquer camada para ativar ou ajustar seu foco atual
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSwitchSubTab('evoluir')}
                className="text-xs font-semibold accent-text hover:underline"
              >
                Abrir Reflexões →
              </button>
            </div>

            <div className="space-y-2 pt-1 flex flex-col items-center max-w-xl mx-auto">
              {MASLOW_TIERS.map((tier) => {
                const isSelected = evo.selectedTiers.includes(tier.id);
                const tierGoals = evo.goals.filter((g) => g.tier === tier.id);
                let totalSteps = 0;
                let doneSteps = 0;
                tierGoals.forEach((g) => {
                  g.steps.forEach((st) => {
                    totalSteps += 1;
                    if (st.done) doneSteps += 1;
                  });
                });
                const pct =
                  totalSteps > 0
                    ? Math.round((doneSteps / totalSteps) * 100)
                    : isSelected
                      ? 25
                      : 0;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onToggleTier(tier.id)}
                    className={`${tier.widthClass} p-3 rounded-2xl border text-left transition active:scale-[0.99] ${
                      isSelected
                        ? `bg-gradient-to-r ${tier.accent} shadow-sm`
                        : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.07] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {tier.name}
                      </span>
                      <span className="font-mono-num text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        {isSelected ? `Em foco · ${pct}%` : 'Explorar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Side-by-Side Chart Cards: Left Pie + Right Bar (PDF Screen 5 bottom row) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Left Card: Pizza / Donut Chart */}
            <div className="glass-surface rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 accent-text" />
                    <span>Distribuição (Pizza)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proporção por pilar de Maslow
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 py-2">
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    {chartSeries.items.map((item) => {
                      const radius = 44;
                      const circumference = 2 * Math.PI * radius;
                      const dashLen = (item.pct / 100) * circumference;
                      const dashOffset = -((item.startPct / 100) * circumference);
                      const isHovered = hoveredTier === item.key;
                      return (
                        <circle
                          key={item.key}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={item.hex}
                          strokeWidth={isHovered ? 20 : 16}
                          strokeDasharray={`${dashLen} ${circumference}`}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredTier(item.key)}
                          onMouseLeave={() => setHoveredTier(null)}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="font-mono-num text-xl font-bold text-slate-900 dark:text-white">
                      {hoveredTier
                        ? chartSeries.items.find((i) => i.key === hoveredTier)?.value
                        : chartSeries.sum}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {hoveredTier
                        ? PYRAMID_FIXED_PALETTE[hoveredTier].shortLabel
                        : 'Pontos'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 w-full">
                  {chartSeries.items.map((item) => (
                    <div
                      key={item.key}
                      onMouseEnter={() => setHoveredTier(item.key)}
                      onMouseLeave={() => setHoveredTier(null)}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                          {item.label}
                        </span>
                      </div>
                      <span className="font-mono-num text-slate-500 shrink-0 ml-2">
                        {Math.round(item.pct)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Card: Horizontal Bar Chart */}
            <div className="glass-surface rounded-3xl p-6 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 accent-text" />
                    <span>Avanço por Área (Barras)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Intensidade de atividades e metas
                  </p>
                </div>
              </div>

              <div className="space-y-3 py-1">
                {chartSeries.items.map((item) => {
                  const widthPct = Math.round((item.value / chartSeries.maxVal) * 100);
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                        <span className="font-mono-num text-slate-500">{item.value} pts</span>
                      </div>
                      <div className="w-full h-3 rounded-lg bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: item.hex,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Collapsible Details */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setChartDetailsOpen((v) => !v)}
                  className="w-full min-h-[38px] py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:opacity-80 transition"
                >
                  <span>Ver detalhes por área</span>
                  {chartDetailsOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
                {chartDetailsOpen && (
                  <div className="space-y-2.5 pt-2">
                    {chartSeries.items.map((item) => {
                      const activePct = Math.min(
                        100,
                        Math.round(((item.completed + 2) / Math.max(1, item.total)) * 100)
                      );
                      return (
                        <div key={item.key} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                            <span className="font-mono-num text-slate-500">
                              {item.total} itens · {activePct}% ativo
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${activePct}%`, backgroundColor: item.hex }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Recent Achievements */}
          <div className="glass-surface rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Conquistas Recentes</span>
            </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhuma atividade concluída ainda.</p>
                ) : (
                  history.slice(0, 10).map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] text-xs"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">
                        {h.title}
                      </span>
                      <span className="font-mono-num font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        +{h.xp} XP
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] flex justify-end">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar dados padrão</span>
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Motivation Reminder Modal */}
      {motivationHabit && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMotivationHabit(null)}
        >
          <div
            className="glass-surface rounded-3xl max-w-md w-full p-7 text-center space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/12 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-emerald-500">Seu Lembrete Pessoal</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {motivationHabit.title}
              </h3>
            </div>
            <blockquote className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] text-sm italic text-slate-700 dark:text-slate-200 leading-relaxed">
              “{motivationHabit.why}”
            </blockquote>
            <div className="text-left p-3.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 space-y-1">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Próximo micro-passo gentil:
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                {(motivationHabit.steps.find((s) => !s.done) || motivationHabit.steps[0])?.text ||
                  'Respire fundo e escolha uma ação leve de 2 minutos.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMotivationHabit(null)}
              className="w-full min-h-[44px] py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
            >
              Seguir meu passo gentil
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {resetModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setResetModalOpen(false)}
        >
          <div
            className="glass-surface rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Restaurar dados padrão?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Isso zerará seu XP, histórico de tarefas concluídas, memórias personalizadas e ideias criadas.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  onResetAllData();
                }}
                className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
