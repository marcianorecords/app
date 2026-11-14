import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Clock, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { formatTimeClock } from '../utils/profileCorrelation';
import type { ClockDisplayMode, TimerMode, TimerState } from '../types/impulso';

interface TimerPopupModalProps {
  open: boolean;
  timer: TimerState;
  onClose: () => void;
  onSelectClockType: (clockType: ClockDisplayMode) => void;
  onSetTimerMode: (mode: TimerMode, minutes: number) => void;
  onAdjustTimer: (deltaSeconds: number) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
}

export const TimerPopupModal: React.FC<TimerPopupModalProps> = ({
  open,
  timer,
  onClose,
  onSelectClockType,
  onSetTimerMode,
  onAdjustTimer,
  onToggleTimer,
  onResetTimer,
}) => {
  const shouldReduceMotion = useReducedMotion();
  if (!open) return null;

  const displayedSeconds =
    timer.clockType === 'stopwatch'
      ? timer.stopwatchSeconds
      : timer.clockType === 'journey'
        ? timer.journeySecondsLeft
        : timer.secondsLeft;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 accent-text" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Relógio & Cronômetro Fixo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar relógio"
            className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clock Type Selector */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tipo de Relógio
          </p>
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05]">
            {[
              { id: 'countdown' as ClockDisplayMode, label: 'Timer Foco' },
              { id: 'stopwatch' as ClockDisplayMode, label: 'Progressivo' },
              { id: 'journey' as ClockDisplayMode, label: 'Jornada 24h' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectClockType(item.id)}
                className={`min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  timer.clockType === item.id
                    ? 'bg-white dark:bg-[#222533] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Big Readout */}
        <div className="py-3 text-center space-y-1 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.08]">
          <div className="font-mono-num text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatTimeClock(displayedSeconds)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {timer.clockType === 'journey'
              ? 'Tempo restante do desafio de hoje'
              : timer.running
                ? 'Em execução contínua'
                : 'Pausado · Fixo na barra'}
          </p>
        </div>

        {/* Countdown Presets */}
        {timer.clockType === 'countdown' && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              <span>Durações Rápidas</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { mode: 'sprint' as TimerMode, label: 'Sprint 10m', min: 10 },
                { mode: 'pomodoro' as TimerMode, label: 'Foco 25m', min: 25 },
                { mode: 'shortbreak' as TimerMode, label: 'Pausa 5m', min: 5 },
                { mode: 'longbreak' as TimerMode, label: 'Pausa 15m', min: 15 },
              ].map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => onSetTimerMode(m.mode, m.min)}
                  className={`min-h-[40px] px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                    timer.mode === m.mode
                      ? 'accent-bg shadow-sm'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onAdjustTimer(-300)}
                className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.07] font-mono-num"
              >
                - 5 min
              </button>
              <button
                type="button"
                onClick={() => onAdjustTimer(300)}
                className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.07] font-mono-num"
              >
                + 5 min
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        {timer.clockType !== 'journey' && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleTimer}
              className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl accent-bg font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {timer.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{timer.running ? 'Pausar' : 'Iniciar'}</span>
            </button>
            <button
              type="button"
              onClick={onResetTimer}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zerar</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
