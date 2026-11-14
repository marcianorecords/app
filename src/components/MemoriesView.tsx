import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Heart,
  LayoutList,
  Plus,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { generateDefaultMemoryArt } from '../data/ideas';
import type { Idea, MemoryItem, QueueItem, UserProfile } from '../types/impulso';

interface MemoriesViewProps {
  memories: MemoryItem[];
  onlyFavorites: boolean;
  queue: QueueItem[];
  ideas: Idea[];
  profile: UserProfile;
  prefillTaskTitle: string;
  onClearPrefillTask: () => void;
  onToggleFilterFavorites: () => void;
  onAddMemory: (mem: MemoryItem) => void;
  onToggleFavoriteMemory: (id: string) => void;
  onDeleteMemory: (id: string) => void;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  memories,
  onlyFavorites,
  queue,
  ideas,
  profile,
  prefillTaskTitle,
  onClearPrefillTask,
  onToggleFilterFavorites,
  onAddMemory,
  onToggleFavoriteMemory,
  onDeleteMemory,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<'grid4' | 'feed'>('grid4');
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [mood, setMood] = useState('🌟 Orgulho');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [lightboxMem, setLightboxMem] = useState<MemoryItem | null>(null);

  useEffect(() => {
    if (prefillTaskTitle) {
      setTaskTitle(prefillTaskTitle);
      setTitle(`Concluí: ${prefillTaskTitle}`);
      setCreateOpen(true);
      onClearPrefillTask();
    }
  }, [prefillTaskTitle, onClearPrefillTask]);

  const visibleMemories = memories
    .slice()
    .sort((a, b) => (b.dateIso || '').localeCompare(a.dateIso || ''));

  const pageSize = 4;
  const totalPages = Math.max(1, Math.ceil(visibleMemories.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const gridFourItems = visibleMemories.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 720;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        setPhotoPreview(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedNotes = notes.trim();
    if (!trimmedTitle || !trimmedNotes) return;

    const now = new Date();
    const dateLabel =
      now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' +
      now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const photo = photoPreview || generateDefaultMemoryArt(mood, trimmedTitle);

    onAddMemory({
      id: 'mem-' + Date.now(),
      title: trimmedTitle,
      taskTitle,
      mood,
      notes: trimmedNotes,
      dateIso: now.toISOString(),
      dateLabel,
      fav: true,
      photo,
    });

    setTitle('');
    setTaskTitle('');
    setNotes('');
    setPhotoPreview('');
    setPage(0);
    setCreateOpen(false);
  };

  return (
    <section className="relative h-full min-h-0 flex flex-col">
      {/* Fixed Top Icon Bar Floating Over Scroll: Left = Add Photo, Right = Grid/Feed Toggle */}
      <div className="pointer-events-none absolute top-[max(0.75rem,env(safe-area-inset-top))] md:top-0 inset-x-0 z-20 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          aria-label="Adicionar Foto"
          title="Adicionar Foto"
          className="pointer-events-auto w-11 h-11 rounded-full accent-bg flex items-center justify-center shrink-0 shadow-lg shadow-black/10 hover:opacity-95 active:scale-90 transition-all duration-150"
        >
          <Plus className="w-[18px] h-[18px] stroke-[2.25]" />
        </button>

        <button
          type="button"
          onClick={() => setViewMode((m) => (m === 'grid4' ? 'feed' : 'grid4'))}
          aria-label={viewMode === 'grid4' ? 'Alternar para Feed' : 'Alternar para Grade 4'}
          title={viewMode === 'grid4' ? 'Feed' : 'Grade 4'}
          className="pointer-events-auto w-11 h-11 rounded-full liquid-glass-pill flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-100 hover:accent-text active:scale-90 transition-all duration-150"
        >
          {viewMode === 'grid4' ? (
            <LayoutList className="w-[18px] h-[18px]" />
          ) : (
            <Grid2x2 className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      {/* Main Content: 2x2 Large 4-Photo Grid or Scrollable Feed (Scrolls underneath fixed top icons) */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain no-scrollbar pt-[max(4.25rem,calc(env(safe-area-inset-top)+3.5rem))] md:pt-14 pb-24 md:pb-4">
      <AnimatePresence mode="wait" initial={false}>
        {visibleMemories.length === 0 ? (
          <motion.div
            key="empty"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass-surface rounded-3xl p-10 text-center space-y-3"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl accent-soft-bg flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nenhuma foto registrada ainda
            </p>
            <p className="text-xs text-slate-400">
              Toque no ícone + no canto superior esquerdo para registrar uma lembrança especial.
            </p>
          </motion.div>
        ) : viewMode === 'grid4' ? (
          <motion.div
            key={`grid4-${safePage}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
              {gridFourItems.map((mem) => (
                <motion.button
                  key={mem.id}
                  type="button"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                  onClick={() => setLightboxMem(mem)}
                  className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm text-left"
                >
                <img
                  src={mem.photo}
                  alt={mem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex flex-col justify-end p-3.5 sm:p-4">
                  <span className="text-[11px] font-medium text-white/80 truncate">
                    {mem.mood} · {mem.dateLabel.split('·')[0]}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 mt-0.5">
                    {mem.title}
                  </p>
                </div>
                {mem.fav && (
                  <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="min-h-[40px] px-3 py-1.5 rounded-xl glass-surface text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
              <span className="font-mono-num text-xs text-slate-500">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="min-h-[40px] px-3 py-1.5 rounded-xl glass-surface text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
              >
                <span>Próximas</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="feed"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-xl mx-auto space-y-5"
          >
          {visibleMemories.map((mem) => (
            <article key={mem.id} className="glass-surface rounded-3xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {mem.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono-num">{mem.dateLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteMemory(mem.id)}
                  aria-label="Remover memória"
                  className="p-2 text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLightboxMem(mem)}
                className="w-full aspect-square bg-slate-950 overflow-hidden block"
              >
                <img
                  src={mem.photo}
                  alt={mem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onToggleFavoriteMemory(mem.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <Heart className={`w-4 h-4 ${mem.fav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{mem.mood}</span>
                  </button>
                  {mem.taskTitle && (
                    <span className="text-[11px] font-medium accent-text truncate max-w-[60%]">
                      {mem.taskTitle}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {mem.notes}
                </p>
              </div>
              </article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Create Memory Pop-up */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="glass-surface rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar Nova Foto & Memória
                </h3>
                <p className="text-xs text-slate-400">
                  Guarde um momento especial e conecte à sua jornada
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-white/[0.08] flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/15 cursor-pointer bg-slate-50/70 dark:bg-white/[0.02] text-center space-y-1.5">
                {photoPreview && (
                  <div className="w-full h-44 rounded-xl overflow-hidden mb-2">
                    <img
                      src={photoPreview}
                      alt="Prévia da foto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Camera className="w-5 h-5 accent-text" />
                <span className="text-xs font-semibold accent-text">
                  {photoPreview ? 'Foto pronta — toque para trocar' : 'Selecionar foto da galeria'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Título do Momento
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Café da manhã sem pressa juntos"
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Associar à Tarefa
                  </label>
                  <select
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200 dark:border-white/10"
                  >
                    <option value="">Momento Livre</option>
                    {queue.map((q) => (
                      <option key={q.id} value={q.title}>
                        [Match] {q.title}
                      </option>
                    ))}
                    {ideas.slice(0, 25).map((idea) => (
                      <option key={idea.id} value={idea.title}>
                        {idea.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Sentimento
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200 dark:border-white/10"
                  >
                    <option value="🌟 Orgulho">Orgulho & Realização</option>
                    <option value="🌿 Paz">Paz & Equilíbrio</option>
                    <option value="❤️ Gratidão">Gratidão & Afeto</option>
                    <option value="🔥 Superação">Superação & Foco</option>
                    <option value="🎉 Alegria">Alegria & Lazer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Legenda / Notas
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="O que tornou esse registro especial?"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 rounded-xl accent-bg text-xs font-bold"
              >
                Publicar Memória
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Instagram Post Detail Lightbox Pop-up */}
      {lightboxMem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxMem(null)}
        >
          <div
            className="glass-surface rounded-3xl max-w-lg w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {lightboxMem.title}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono-num">{lightboxMem.dateLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxMem(null)}
                className="min-w-[36px] min-h-[36px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[55vh]">
              <img
                src={lightboxMem.photo}
                alt={lightboxMem.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[55vh] object-contain"
              />
            </div>
            <div className="space-y-1.5">
              {lightboxMem.taskTitle && (
                <p className="text-xs font-semibold accent-text">
                  Tarefa associada: {lightboxMem.taskTitle}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lightboxMem.notes}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  onToggleFavoriteMemory(lightboxMem.id);
                  setLightboxMem((prev) => (prev ? { ...prev, fav: !prev.fav } : null));
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] text-xs font-semibold flex items-center gap-1.5"
              >
                <Heart className={`w-4 h-4 ${lightboxMem.fav ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{lightboxMem.fav ? 'Favoritada' : 'Favoritar'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMemory(lightboxMem.id);
                  setLightboxMem(null);
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
