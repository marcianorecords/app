import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Check,
  Moon,
  Palette,
  RotateCcw,
  Sun,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ACCENT_THEMES } from '../utils/profileCorrelation';
import type { AccentTheme, UserProfile } from '../types/impulso';

interface SettingsModalProps {
  open: boolean;
  isDark: boolean;
  accentTheme: AccentTheme;
  soundEnabled: boolean;
  profile: UserProfile;
  onClose: () => void;
  onToggleDark: () => void;
  onChangeAccent: (accent: AccentTheme) => void;
  onToggleSound: () => void;
  onEditProfile: () => void;
  onRequestReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  isDark,
  accentTheme,
  soundEnabled,
  profile,
  onClose,
  onToggleDark,
  onChangeAccent,
  onToggleSound,
  onEditProfile,
  onRequestReset,
}) => {
  const shouldReduceMotion = useReducedMotion();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Configurações & Cores
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize a aparência e preferências do Impulso
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Summary Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {profile.name || 'Perfil não preenchido'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {profile.hobbies.slice(0, 3).join(' · ') || 'Personalize para correlacionar tarefas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEditProfile();
            }}
            className="min-h-[38px] px-3 py-1.5 rounded-xl accent-soft-bg text-xs font-semibold shrink-0"
          >
            Editar
          </button>
        </div>

        {/* Color Palette Picker */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 accent-text" />
            <span>Paleta de Cores da Interface</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACCENT_THEMES.map((theme) => {
              const active = accentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onChangeAccent(theme.id)}
                  className={`min-h-[54px] p-2.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                    active
                      ? 'border-slate-900 dark:border-white bg-slate-100/80 dark:bg-white/[0.08]'
                      : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: theme.hex }}
                    />
                    {active && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-1.5">
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance & Sound Toggles */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onToggleDark}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <span className="flex items-center gap-2.5">
              {isDark ? <Moon className="w-4 h-4 accent-text" /> : <Sun className="w-4 h-4 accent-text" />}
              <span>Modo de Aparência</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {isDark ? 'Escuro (OLED)' : 'Claro (iOS)'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <span className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 accent-text" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span>Efeitos Sonoros de Ação</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {soundEnabled ? 'Ativados' : 'Silenciados'}
            </span>
          </button>
        </div>

        {/* Data Controls */}
        <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequestReset();
            }}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
