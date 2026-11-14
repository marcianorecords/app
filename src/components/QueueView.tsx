import React, { useState } from 'react';
import { Check, Play, Plus, Trash2 } from 'lucide-react';
import type { QueueFilter, QueueItem } from '../types/impulso';

interface QueueViewProps {
  queue: QueueItem[];
  queueFilter: QueueFilter;
  onChangeFilter: (f: QueueFilter) => void;
  onAddQuickTask: (title: string, duration: number) => void;
  onToggleItem: (id: string) => void;
  onFocusItem: (item: QueueItem) => void;
  onDeleteItem: (id: string) => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  queue,
  queueFilter,
  onChangeFilter,
  onAddQuickTask,
  onToggleItem,
  onFocusItem,
  onDeleteItem,
}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(20);

  const visibleItems = queue.filter((item) => {
    if (queueFilter === 'pendentes') return !item.completed;
    if (queueFilter === 'concluidas') return item.completed;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAddQuickTask(trimmed, duration);
    setTitle('');
  };

  return (
    <section className="space-y-6">
      <div className="glass-surface rounded-3xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Minha Fila de Ação
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ideias e tarefas rápidas salvas para executar no seu ritmo
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] self-start sm:self-center">
            {(['pendentes', 'concluidas', 'todas'] as QueueFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChangeFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition whitespace-nowrap ${
                  queueFilter === f
                    ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Adicionar tarefa rápida na fila..."
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
          >
            <option value={10}>10 min (+15 XP)</option>
            <option value={20}>20 min (+25 XP)</option>
            <option value={30}>30 min (+35 XP)</option>
            <option value={45}>45 min (+50 XP)</option>
          </select>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </form>

        <div className="space-y-2.5 pt-1">
          {visibleItems.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-slate-200/70 dark:border-white/[0.08]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nenhuma tarefa nesta lista
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Dê match nos cards ou adicione uma tarefa rápida acima.
              </p>
            </div>
          ) : (
            visibleItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  item.completed ? 'opacity-55' : 'bg-slate-50/60 dark:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    aria-label={item.completed ? 'Desmarcar tarefa' : 'Concluir tarefa'}
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
                      {item.time} min · +{item.xp} XP
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!item.completed && (
                    <button
                      type="button"
                      onClick={() => onFocusItem(item)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3" />
                      <span>Fazer Agora</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label="Remover tarefa"
                    className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
