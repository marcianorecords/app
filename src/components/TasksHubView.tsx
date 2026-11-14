import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Check,
  Info,
  Play,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { CATEGORY_META, ENERGY_META } from '../data/ideas';
import { scoreIdeaForProfile, sortIdeasByProfile } from '../utils/profileCorrelation';
import { VerticalStackedCarousel } from './VerticalStackedCarousel';
import type {
  Idea,
  QueueFilter,
  QueueItem,
  TasksSubTab,
  UserProfile,
} from '../types/impulso';

interface TasksHubViewProps {
  subTab: TasksSubTab;
  onChangeSubTab: (t: TasksSubTab) => void;
  ideas: Idea[];
  profile: UserProfile;
  queue: QueueItem[];
  queueFilter: QueueFilter;
  onFocusIdeaNow: (idea: Idea) => void;
  onAddToQueue: (id: string) => void;
  onChangeQueueFilter: (f: QueueFilter) => void;
  onAddQuickTask: (title: string, duration: number) => void;
  onToggleQueueItem: (id: string) => void;
  onFocusQueueItem: (item: QueueItem) => void;
  onDeleteQueueItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const TasksHubView: React.FC<TasksHubViewProps> = ({
  subTab,
  onChangeSubTab,
  ideas,
  profile,
  queue,
  queueFilter,
  onFocusIdeaNow,
  onAddToQueue,
  onChangeQueueFilter,
  onAddQuickTask,
  onToggleQueueItem,
  onFocusQueueItem,
  onDeleteQueueItem,
  onToggleFavorite,
}) => {
  const [detailIdea, setDetailIdea] = useState<Idea | null>(null);

  // Queue form
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDuration, setQuickDuration] = useState(15);

  const correlatedIdeas = useMemo(() => {
    return sortIdeasByProfile(ideas, profile);
  }, [ideas, profile]);

  const visibleQueue = queue.filter((item) => {
    if (queueFilter === 'pendentes') return !item.completed;
    if (queueFilter === 'concluidas') return item.completed;
    return true;
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;
    onAddQuickTask(trimmed, quickDuration);
    setQuickTitle('');
  };

  return (
    <section className="h-full min-h-0 flex flex-col">
      {/* SUB-TAB 1: EXPLORAR TAREFAS (Pilha Vertical Liquid Glass) */}
      {subTab === 'todas' && (
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-hidden touch-none pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-0 pb-20 md:pb-2">
          <div className="w-full flex flex-col items-center justify-center">
            <VerticalStackedCarousel
              items={correlatedIdeas}
              keyExtractor={(idea) => idea.id}
              maxVisible={3}
              cardHeightClassName="h-[min(320px,calc(100dvh-18.5rem))] min-h-[260px] sm:h-[340px]"
              emptyState={
                <div className="max-w-xl mx-auto p-10 text-center rounded-3xl liquid-glass-card space-y-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Nenhuma atividade encontrada
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tente outro termo na busca para explorar os cartões.
                  </p>
                </div>
              }
              renderCard={(idea) => {
                const { reason } = scoreIdeaForProfile(idea, profile);
                return (
                  <article className="h-full p-6 sm:p-7 flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono-num font-semibold px-2.5 py-1 rounded-full bg-slate-900/[0.05] dark:bg-white/[0.08] shrink-0">
                            {idea.time} min · +{idea.xp} XP
                          </span>
                          <span className="text-[11px] font-medium opacity-85 truncate">
                            Energia {ENERGY_META[idea.energy]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onPointerDownCapture={(e) => e.stopPropagation()}
                          onClick={() => onToggleFavorite(idea.id)}
                          aria-label={idea.favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                          title={idea.favorite ? 'Remover dos favoritos' : 'Favoritar'}
                          className="min-w-[40px] min-h-[40px] -mr-2 -my-1 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 active:scale-90 transition shrink-0"
                        >
                          <Star
                            className={`w-5 h-5 transition ${
                              idea.favorite ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {idea.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                        {idea.description}
                      </p>

                      {reason && (
                        <p className="text-[11px] font-semibold accent-text pt-0.5 truncate">
                          Afinidade: {reason}
                        </p>
                      )}
                    </div>

                    <div
                      onPointerDownCapture={(e) => e.stopPropagation()}
                      className="pt-3.5 border-t border-slate-900/[0.07] dark:border-white/[0.1] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailIdea(idea)}
                          className="min-h-[42px] px-3.5 py-1.5 rounded-2xl bg-slate-900/[0.06] dark:bg-white/[0.08] hover:bg-slate-900/[0.1] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Passos</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddToQueue(idea.id)}
                          aria-label="Salvar na fila"
                          title="Salvar na Fila"
                          className="min-w-[42px] min-h-[42px] rounded-2xl bg-slate-900/[0.06] dark:bg-white/[0.08] hover:bg-slate-900/[0.1] dark:hover:bg-white/[0.14] text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onFocusIdeaNow(idea)}
                        className="min-h-[42px] px-4 py-2 rounded-2xl accent-bg text-xs font-semibold flex items-center gap-1.5 shadow-md whitespace-nowrap transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Fazer Agora</span>
                      </button>
                    </div>
                  </article>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MINHA FILA */}
      {subTab === 'fila' && (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain no-scrollbar pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-0 pb-24 md:pb-4">
          <div className="glass-surface rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Minha Fila Pessoal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atividades rápidas escolhidas por você para fazer no seu ritmo
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] self-start">
              {(['pendentes', 'concluidas', 'todas'] as QueueFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onChangeQueueFilter(f)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    queueFilter === f
                      ? 'bg-white dark:bg-[#222533] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              required
              placeholder="Adicionar atividade rápida..."
              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
            />
            <select
              value={quickDuration}
              onChange={(e) => setQuickDuration(parseInt(e.target.value, 10))}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
            >
              <option value={10}>10 min (+15 XP)</option>
              <option value={15}>15 min (+20 XP)</option>
              <option value={25}>25 min (+30 XP)</option>
              <option value={45}>45 min (+50 XP)</option>
            </select>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl accent-bg font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>

          <div className="space-y-2.5">
            {visibleQueue.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-slate-200/70 dark:border-white/[0.08]">
                <p className="text-sm font-medium text-slate-500">Nenhuma atividade nesta lista</p>
              </div>
            ) : (
              visibleQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.completed ? 'opacity-55' : 'bg-slate-50/70 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleQueueItem(item.id)}
                      aria-label="Concluir item"
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition ${
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          item.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 font-mono-num">
                        {item.time} min · +{item.xp} XP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!item.completed && (
                      <button
                        type="button"
                        onClick={() => onFocusQueueItem(item)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl accent-bg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Fazer Agora</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteQueueItem(item.id)}
                      aria-label="Remover item"
                      className="min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      )}

      {/* Task Details Pop-up (Steps + 5-min Minimal Effort Version) */}
      {detailIdea && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setDetailIdea(null)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 font-mono-num">
                  {CATEGORY_META[detailIdea.category]?.label} · {detailIdea.time} min · Energia{' '}
                  {ENERGY_META[detailIdea.energy]}
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {detailIdea.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailIdea(null)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {detailIdea.description}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Passo a passo sugerido</p>
              <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                {detailIdea.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-mono-num w-5 h-5 rounded-md accent-soft-bg text-[11px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-300">
              <strong className="text-slate-900 dark:text-white">Versão Mínima (5 min):</strong>{' '}
              Se hoje estiver difícil, faça apenas o passo 1 ({detailIdea.steps[0]}) sem cobrança.
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onAddToQueue(detailIdea.id);
                  setDetailIdea(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Guardar na Fila
              </button>
              <button
                type="button"
                onClick={() => {
                  const chosen = detailIdea;
                  setDetailIdea(null);
                  onFocusIdeaNow(chosen);
                }}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-xl accent-bg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Fazer Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
