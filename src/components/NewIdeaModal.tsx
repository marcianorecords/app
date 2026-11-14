import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_META } from '../data/ideas';
import type { EnergyLevel, Idea, IdeaCategory } from '../types/impulso';

interface NewIdeaModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (idea: Idea) => void;
}

export const NewIdeaModal: React.FC<NewIdeaModalProps> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('foco');
  const [time, setTime] = useState(15);
  const [energy, setEnergy] = useState<EnergyLevel>('media');
  const [description, setDescription] = useState('');
  const [stepsRaw, setStepsRaw] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t || !d) return;

    const steps = stepsRaw.trim()
      ? stepsRaw
          .trim()
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : ['Preparar o ambiente', 'Executar com atenção plena', 'Concluir e revisar'];

    onCreate({
      id: 'id-custom-' + Date.now(),
      title: t,
      category,
      pyramid: 'Personalizada',
      time,
      energy,
      xp: Math.max(15, time),
      favorite: true,
      description: d,
      steps,
    });

    setTitle('');
    setDescription('');
    setStepsRaw('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-surface rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Criar Nova Ideia de Produtividade
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">
              Título da Ideia
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Organizar pastas de downloads da semana"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IdeaCategory)}
                className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
              >
                {(Object.keys(CATEGORY_META) as IdeaCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">
                Tempo
              </label>
              <select
                value={time}
                onChange={(e) => setTime(parseInt(e.target.value, 10))}
                className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
              >
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={25}>25 min</option>
                <option value={45}>45 min</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">
                Energia
              </label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value as EnergyLevel)}
                className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#191B24] border border-slate-200/80 dark:border-white/10"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">
              Descrição Curta
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Por que fazer isso e qual o resultado prático?"
              className="w-full px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-300 mb-1">
              Passos Práticos (1 por linha)
            </label>
            <textarea
              rows={3}
              value={stepsRaw}
              onChange={(e) => setStepsRaw(e.target.value)}
              placeholder={'Abrir a pasta de downloads\nApagar instaladores antigos\nMover PDFs importantes'}
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[40px] px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-950"
            >
              Salvar Ideia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
