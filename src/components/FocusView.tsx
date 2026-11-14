import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Brain,
  Camera,
  Check,
  FileText,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { BIAS_ANTIDOTES, CATEGORY_META, ENERGY_META, SOUND_TRACKS } from '../data/ideas';
import type { FocusTarget, TimerMode } from '../types/impulso';

interface FocusViewProps {
  target: FocusTarget;
  checkedSteps: Record<number, boolean>;
  scratchpad: string;
  timerSecondsLeft: number;
  timerRunning: boolean;
  timerMode: TimerMode;
  currentTrackId: string;
  musicPlaying: boolean;
  onBackToSwipe: () => void;
  onPickRandom: () => void;
  onToggleStep: (stepIdx: number) => void;
  onAddSubStep: (text: string) => void;
  onUpdateScratchpad: (text: string) => void;
  onApplyBiasAntidote: (biasKey: string, stepText: string, minutes: number) => void;
  onCompleteTask: () => void;
  onSaveToQueue: () => void;
  onCreateMemory: () => void;
  onSetTimerMode: (mode: TimerMode, minutes: number) => void;
  onAdjustTimer: (deltaSeconds: number) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSelectTrack: (trackId: string) => void;
  onToggleMusic: () => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  target,
  checkedSteps,
  scratchpad,
  timerSecondsLeft,
  timerRunning,
  timerMode,
  currentTrackId,
  musicPlaying,
  onBackToSwipe,
  onPickRandom,
  onToggleStep,
  onAddSubStep,
  onUpdateScratchpad,
  onApplyBiasAntidote,
  onCompleteTask,
  onSaveToQueue,
  onCreateMemory,
  onSetTimerMode,
  onAdjustTimer,
  onToggleTimer,
  onResetTimer,
  onSelectTrack,
  onToggleMusic,
}) => {
  const [selectedBiasKey, setSelectedBiasKey] = useState<string>(
    target.biasKey && BIAS_ANTIDOTES[target.biasKey] ? target.biasKey : 'zeigarnik'
  );
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepText, setNewStepText] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);

  const biasInfo = BIAS_ANTIDOTES[selectedBiasKey] || BIAS_ANTIDOTES.zeigarnik;
  const doneCount = target.steps.filter((_, idx) => !!checkedSteps[idx]).length;
  const pct = target.steps.length > 0 ? Math.round((doneCount / target.steps.length) * 100) : 0;

  const mins = Math.floor(timerSecondsLeft / 60);
  const secs = timerSecondsLeft % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStepText.trim();
    if (!trimmed) return;
    onAddSubStep(trimmed);
    setNewStepText('');
  };

  return (
    <section className="space-y-6">
      {/* Header Banner */}
      <div className="glass-surface rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-rose-500">Match em Execução</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="font-mono-num text-amber-600 dark:text-amber-400">+{target.xp} XP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {target.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={onBackToSwipe}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar aos Cards</span>
          </button>
          <button
            type="button"
            onClick={onPickRandom}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Sortear outra</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split: Left = Steps & Cognitive Bias Antidote, Right = Timer & Sound */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 glass-surface rounded-3xl p-6 space-y-6">
          {/* Task Context */}
          <div className="space-y-1.5 pb-4 border-b border-slate-200/70 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {CATEGORY_META[target.category]?.label || 'Geral'}
              </span>
              <span className="font-mono-num">
                {target.time} min · Energia {ENERGY_META[target.energy]}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {target.description}
            </p>
          </div>

          {/* Cognitive Bias Antidote Adapter */}
          <div className="p-4 rounded-2xl bg-indigo-500/[0.06] dark:bg-indigo-500/[0.09] border border-indigo-500/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Antídoto Cognitivo Adaptativo</span>
                </p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Algum viés está travando você nesta tarefa?
                </p>
              </div>
              <select
                value={selectedBiasKey}
                onChange={(e) => setSelectedBiasKey(e.target.value)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#191B24] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
              >
                {Object.entries(BIAS_ANTIDOTES).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{biasInfo.hurts}</p>
              <p className="font-semibold text-indigo-700 dark:text-indigo-300 leading-relaxed">
                {biasInfo.solve}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                onApplyBiasAntidote(
                  selectedBiasKey,
                  biasInfo.antidoteStep,
                  biasInfo.recommendedMinutes
                )
              }
              className="min-h-[40px] px-4 py-2 rounded-xl pyr-grad-estima text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Adaptar Tarefa & Inserir Passo Antídoto</span>
            </button>
          </div>

          {/* Step Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Passo a Passo
              </h3>
              <span className="font-mono-num text-xs font-semibold text-slate-500 dark:text-slate-400">
                {doneCount}/{target.steps.length} ({pct}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/70 dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 dark:bg-white transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>

            <ul className="space-y-2 pt-2">
              {target.steps.map((step, idx) => {
                const isChecked = !!checkedSteps[idx];
                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => onToggleStep(idx)}
                      className={`w-full min-h-[44px] p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                        isChecked
                          ? 'bg-emerald-500/8 border-emerald-500/25'
                          : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.08] hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
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
                        className={`text-sm font-medium ${
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

            <div className="pt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddStep((v) => !v)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar passo</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScratchpad((v) => !v)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Notas da tarefa</span>
              </button>
            </div>

            {showAddStep && (
              <form onSubmit={handleAddStep} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder="Descreva o passo extra..."
                  className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold"
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
                placeholder="Anotações rápidas, links ou ideias para esta tarefa..."
                className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 focus:outline-none"
              />
            )}
          </div>

          {/* Primary Completion & Secondary Actions */}
          <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.08] flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onCompleteTask}
              className="flex-1 min-h-[46px] py-3 px-5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Marcar Missão Como Concluída</span>
            </button>
            <button
              type="button"
              onClick={onSaveToQueue}
              className="min-h-[46px] py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Guardar na Fila</span>
            </button>
            <button
              type="button"
              onClick={onCreateMemory}
              className="min-h-[46px] py-3 px-4 rounded-xl bg-indigo-500/12 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Registrar Memória</span>
            </button>
          </div>
        </div>

        {/* Right: Focus Timer & Ambient Audio */}
        <div className="lg:col-span-5 glass-surface rounded-3xl p-6 flex flex-col items-center justify-between text-center space-y-6">
          <div className="w-full space-y-3">
            <p className="text-xs font-semibold text-slate-400">Cronômetro de Foco</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {[
                { mode: 'sprint' as TimerMode, label: 'Sprint 10m', min: 10 },
                { mode: 'pomodoro' as TimerMode, label: 'Pomodoro 25m', min: 25 },
                { mode: 'shortbreak' as TimerMode, label: 'Pausa 5m', min: 5 },
                { mode: 'longbreak' as TimerMode, label: 'Pausa 15m', min: 15 },
              ].map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => onSetTimerMode(m.mode, m.min)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    timerMode === m.mode
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-4 flex flex-col items-center">
            <div className="font-mono-num text-6xl sm:text-7xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formattedTime}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {timerRunning ? 'Foco em andamento' : 'Pronto para começar'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onAdjustTimer(-300)}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] transition font-mono-num"
            >
              - 5 min
            </button>
            <button
              type="button"
              onClick={() => onAdjustTimer(300)}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] transition font-mono-num"
            >
              + 5 min
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full">
            <button
              type="button"
              onClick={onToggleTimer}
              className="flex-1 min-h-[46px] py-3 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-95 transition"
            >
              {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{timerRunning ? 'Pausar Timer' : 'Iniciar Foco'}</span>
            </button>
            <button
              type="button"
              onClick={onResetTimer}
              className="min-h-[46px] py-3 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.07] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>

          {/* Integrated Ambient Sound Bar */}
          <div className="w-full pt-4 border-t border-slate-200/70 dark:border-white/[0.08] text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>Som ambiente para acompanhar</span>
              </span>
              <button
                type="button"
                onClick={onToggleMusic}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  musicPlaying
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-white/[0.07] text-slate-700 dark:text-slate-200'
                }`}
              >
                {musicPlaying ? 'Pausar Som' : 'Tocar Som'}
              </button>
            </div>
            <select
              value={currentTrackId}
              onChange={(e) => onSelectTrack(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200 dark:border-white/10"
            >
              {SOUND_TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.icon} {track.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
};
