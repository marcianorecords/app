import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Camera, Check, ChevronLeft, ChevronRight, Sparkles, User, X } from 'lucide-react';
import {
  EDUCATION_OPTIONS,
  HOBBY_OPTIONS,
  RELIGION_OPTIONS,
  SOCIAL_STATUS_OPTIONS,
} from '../utils/profileCorrelation';
import type { UserProfile } from '../types/impulso';

interface OnboardingModalProps {
  open: boolean;
  isEditing: boolean;
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  isEditing,
  profile,
  onSave,
  onClose,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [customHobby, setCustomHobby] = useState('');

  useEffect(() => {
    if (open) {
      setDraft(profile);
      setStep(0);
    }
  }, [open, profile]);

  if (!open) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setDraft((prev) => ({ ...prev, avatar: canvas.toDataURL('image/jpeg', 0.85) }));
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const toggleHobby = (hobby: string) => {
    setDraft((prev) => {
      const exists = prev.hobbies.includes(hobby);
      return {
        ...prev,
        hobbies: exists
          ? prev.hobbies.filter((h) => h !== hobby)
          : [...prev.hobbies, hobby],
      };
    });
  };

  const addCustomHobby = () => {
    const trimmed = customHobby.trim();
    if (!trimmed) return;
    if (!draft.hobbies.includes(trimmed)) {
      setDraft((prev) => ({ ...prev, hobbies: [...prev.hobbies, trimmed] }));
    }
    setCustomHobby('');
  };

  const finishOnboarding = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSave({
      ...draft,
      name: draft.name.trim() || 'Visitante',
      completedOnboarding: true,
    });
  };

  const steps = ['Identidade', 'Vida & Valores', 'Hobbies & Ritmo'];

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="glass-surface rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold accent-text flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Impulso · Personalização Inteligente</span>
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isEditing ? 'Editar Seu Perfil' : 'Bem-vindo ao Impulso'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suas respostas correlacionam desafios diários, cartas de Maslow e práticas comportamentais ao seu momento.
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.05]">
          {steps.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(idx)}
              className={`min-h-[36px] px-2 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                step === idx
                  ? 'bg-white dark:bg-[#222533] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {idx + 1}. {label}
            </button>
          ))}
        </div>

        <form onSubmit={finishOnboarding} className="space-y-4">
          {/* Step 0: Name, Photo, Birthdate, Country */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/15 flex items-center justify-center">
                    {draft.avatar ? (
                      <img
                        src={draft.avatar}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full accent-bg shadow-md flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                <div className="flex-1 space-y-1">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Como deseja ser chamado(a)?
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Seu nome ou apelido"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-current"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={draft.birthDate}
                    onChange={(e) => setDraft((p) => ({ ...p, birthDate: e.target.value }))}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    País de Origem
                  </label>
                  <input
                    type="text"
                    value={draft.country}
                    onChange={(e) => setDraft((p) => ({ ...p, country: e.target.value }))}
                    placeholder="Ex: Brasil, Portugal..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Profession, Education, Social Status, Religion */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Profissão / Ocupação
                  </label>
                  <input
                    type="text"
                    value={draft.profession}
                    onChange={(e) => setDraft((p) => ({ ...p, profession: e.target.value }))}
                    placeholder="Ex: Designer, Professor, Autônomo..."
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Educação / Formação
                  </label>
                  <select
                    value={draft.education}
                    onChange={(e) => setDraft((p) => ({ ...p, education: e.target.value }))}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                  >
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Status Social & Relacionamento
                </label>
                <select
                  value={draft.socialStatus}
                  onChange={(e) => setDraft((p) => ({ ...p, socialStatus: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                >
                  {SOCIAL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Religião / Espiritualidade
                </label>
                <select
                  value={draft.religion}
                  onChange={(e) => setDraft((p) => ({ ...p, religion: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
                >
                  {RELIGION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Hobbies & Interests */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Hobbies & Interesses ({draft.hobbies.length} selecionados)
                </label>
                <span className="text-[11px] text-slate-400">Toque para ativar</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {HOBBY_OPTIONS.map((hobby) => {
                  const active = draft.hobbies.includes(hobby);
                  return (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => toggleHobby(hobby)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                        active
                          ? 'accent-bg border-transparent shadow-sm'
                          : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3" />}
                      <span>{hobby}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customHobby}
                  onChange={(e) => setCustomHobby(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomHobby();
                    }
                  }}
                  placeholder="Adicionar outro hobby..."
                  className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10"
                />
                <button
                  type="button"
                  onClick={addCustomHobby}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.08] flex items-center justify-between gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : !isEditing ? (
              <button
                type="button"
                onClick={() => finishOnboarding()}
                className="min-h-[44px] px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                Pular por agora
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="min-h-[44px] px-5 py-2 rounded-xl accent-bg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span>Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl accent-bg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Salvar Alterações' : 'Concluir & Personalizar App'}</span>
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
