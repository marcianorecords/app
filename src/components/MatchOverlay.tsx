import React from 'react';
import { ArrowRight, Heart } from 'lucide-react';
import { ENERGY_META } from '../data/ideas';
import type { Idea } from '../types/impulso';

interface MatchOverlayProps {
  idea: Idea | null;
  onProceed: () => void;
}

export const MatchOverlay: React.FC<MatchOverlayProps> = ({ idea, onProceed }) => {
  if (!idea) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-5">
      <div className="relative max-w-sm w-full glass-surface rounded-3xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/12 border border-rose-500/25 flex items-center justify-center text-rose-500">
          <Heart className="w-8 h-8 fill-rose-500" />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-rose-500">Match Confirmado</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Deu Match!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preparando seu espaço de foco e roteiro
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
            {idea.title}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-num">
            {idea.time} min · Energia {ENERGY_META[idea.energy]} · +{idea.xp} XP
          </p>
        </div>

        <button
          type="button"
          onClick={onProceed}
          className="w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition"
        >
          <span>Ir para O Que Fazer Agora</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
