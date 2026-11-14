import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type PanInfo,
} from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface VerticalStackedCardRenderMeta {
  isFront: boolean;
  stackDepth: number;
  index: number;
  total: number;
}

interface VerticalStackedCarouselProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, meta: VerticalStackedCardRenderMeta) => React.ReactNode;
  emptyState?: React.ReactNode;
  maxVisible?: number;
  cardHeightClassName?: string;
}

const BOUNCY_SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 18,
  mass: 0.78,
};

export function VerticalStackedCarousel<T>({
  items,
  keyExtractor,
  renderCard,
  emptyState,
  maxVisible = 3,
  cardHeightClassName = 'h-[310px] sm:h-[330px]',
}: VerticalStackedCarouselProps<T>) {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const wheelLockRef = useRef<number>(0);

  // Shared live MotionValue for front card vertical drag -> back cards subtly react in real time
  const frontDragY = useMotionValue(0);
  const rawDragProgress = useTransform(frontDragY, (v) => Math.min(1, Math.abs(v) / 145));
  const smoothDragProgress = useSpring(rawDragProgress, {
    stiffness: 420,
    damping: 22,
    mass: 0.65,
  });

  const total = items.length;
  const safeIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;

  useEffect(() => {
    if (activeIndex !== safeIndex) {
      setActiveIndex(safeIndex);
    }
  }, [activeIndex, safeIndex]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    frontDragY.set(0);
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % total);
  }, [frontDragY, total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    frontDragY.set(0);
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [frontDragY, total]);

  const goToIndex = useCallback(
    (targetIdx: number) => {
      if (total <= 1 || targetIdx === safeIndex) return;
      frontDragY.set(0);
      setDirection(targetIdx > safeIndex ? 1 : -1);
      setActiveIndex(((targetIdx % total) + total) % total);
    },
    [frontDragY, safeIndex, total]
  );

  // Up to 3 visible cards stacked vertically
  const visibleLayers = useMemo(() => {
    if (total === 0) return [];
    const count = Math.min(maxVisible, total);
    return Array.from({ length: count }, (_, depth) => {
      const idx = (safeIndex + depth) % total;
      const item = items[idx];
      return {
        item,
        key: keyExtractor(item),
        depth,
        index: idx,
      };
    });
  }, [items, keyExtractor, maxVisible, safeIndex, total]);

  // Indicator window (shows up to 7 dots centered around current position)
  const dotWindow = useMemo(() => {
    if (total <= 1) return [];
    const maxDots = 7;
    if (total <= maxDots) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const half = Math.floor(maxDots / 2);
    let start = safeIndex - half;
    if (start < 0) start = 0;
    if (start + maxDots > total) start = total - maxDots;
    return Array.from({ length: maxDots }, (_, i) => start + i);
  }, [safeIndex, total]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    const absY = Math.abs(e.deltaY);
    if (absY < 24) return;
    const now = Date.now();
    if (now - wheelLockRef.current < 260) return;
    wheelLockRef.current = now;
    if (e.deltaY > 0) goNext();
    else goPrev();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev]);

  if (total === 0) {
    return <>{emptyState || null}</>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
        {/* Main 3D Vertical Stack Viewport */}
        <div
          onWheel={handleWheel}
          style={{ perspective: '1200px' }}
          className={`relative w-full max-w-xl ${cardHeightClassName} mb-5 select-none touch-none`}
        >
          {/* Ambient Liquid Glass Glow Behind Stack */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-6 bottom-0 rounded-[32px] blur-2xl opacity-30 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, var(--accent) 0%, transparent 72%)',
            }}
          />

          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            {visibleLayers
              .slice()
              .reverse()
              .map(({ item, key, depth, index }) => (
                <StackedLayerCard
                  key={key}
                  depth={depth}
                  direction={direction}
                  canDrag={depth === 0 && total > 1}
                  shouldReduceMotion={!!shouldReduceMotion}
                  frontDragY={frontDragY}
                  dragProgress={smoothDragProgress}
                  onNext={goNext}
                  onPrev={goPrev}
                >
                  {renderCard(item, {
                    isFront: depth === 0,
                    stackDepth: depth,
                    index,
                    total,
                  })}
                </StackedLayerCard>
              ))}
          </AnimatePresence>
        </div>

        {/* Side / Bottom Manual Controls & Position Indicators */}
        {total > 1 && (
          <div className="flex sm:flex-col items-center justify-center gap-3 shrink-0">
            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.86 }}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 460, damping: 18 }}
              type="button"
              onClick={goPrev}
              aria-label="Cartão anterior"
              title="Cartão anterior (deslizar para baixo)"
              className="w-10 h-10 rounded-full liquid-glass-pill text-slate-700 dark:text-slate-200 flex items-center justify-center hover:accent-text transition"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>

            {/* Position Indicators */}
            <div
              className="flex sm:flex-col items-center gap-1.5 px-2.5 py-2 rounded-full liquid-glass-pill"
              aria-label={`Cartão ${safeIndex + 1} de ${total}`}
            >
              {dotWindow.map((dotIdx) => {
                const isActive = dotIdx === safeIndex;
                return (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => goToIndex(dotIdx)}
                    aria-label={`Ir para cartão ${dotIdx + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-5 sm:w-2 h-2 sm:h-5 accent-bg shadow-sm'
                        : 'w-2 h-2 bg-slate-400/45 dark:bg-white/25 hover:bg-slate-500/70'
                    }`}
                  />
                );
              })}
            </div>

            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.86 }}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 460, damping: 18 }}
              type="button"
              onClick={goNext}
              aria-label="Próximo cartão"
              title="Próximo cartão (deslizar para cima)"
              className="w-10 h-10 rounded-full liquid-glass-pill text-slate-700 dark:text-slate-200 flex items-center justify-center hover:accent-text transition"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Bottom Position Readout */}
      <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <span className="font-mono-num px-3 py-1 rounded-full liquid-glass-pill text-slate-700 dark:text-slate-200">
          {safeIndex + 1} / {total}
        </span>
      </div>
    </div>
  );
}

interface StackedLayerCardProps {
  depth: number;
  direction: 1 | -1;
  canDrag: boolean;
  shouldReduceMotion: boolean;
  frontDragY: MotionValue<number>;
  dragProgress: MotionValue<number>;
  onNext: () => void;
  onPrev: () => void;
  children: React.ReactNode;
}

const StackedLayerCard: React.FC<StackedLayerCardProps> = ({
  depth,
  direction,
  canDrag,
  shouldReduceMotion,
  frontDragY,
  dragProgress,
  onNext,
  onPrev,
  children,
}) => {
  // Subtle reactive scale & opacity decrease on back cards while front card is dragged
  const backReactiveScale = useTransform(
    dragProgress,
    [0, 1],
    [1, depth === 1 ? 0.96 : 0.935]
  );
  const backReactiveOpacity = useTransform(
    dragProgress,
    [0, 1],
    [1, depth === 1 ? 0.82 : 0.7]
  );
  const backReactiveY = useTransform(dragProgress, [0, 1], [0, depth === 1 ? 5 : 9]);

  // Dynamic 3D tilt for the front card during vertical drag
  const frontDragRotateX = useTransform(frontDragY, [-180, 0, 180], [11, 0, -11]);

  const targetY = depth === 0 ? 0 : depth === 1 ? 22 : 42;
  const targetScale = depth === 0 ? 1 : depth === 1 ? 0.945 : 0.89;
  const targetOpacity = depth === 0 ? 1 : depth === 1 ? 0.84 : 0.62;
  const targetRotateX = depth === 0 ? 0 : depth === 1 ? -2.5 : -4.5;
  const zIndex = 30 - depth * 10;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canDrag) return;
    if (info.offset.y < -52 || info.velocity.y < -340) {
      onNext();
    } else if (info.offset.y > 52 || info.velocity.y > 340) {
      onPrev();
    }
  };

  return (
    <motion.div
      custom={direction}
      style={{
        zIndex,
        transformOrigin: '50% 20%',
        transformStyle: 'preserve-3d',
      }}
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : depth === 0 && direction === -1
            ? { y: -150, scale: 0.92, opacity: 0, rotateX: 11 }
            : { y: 68, scale: 0.83, opacity: 0, rotateX: -7 }
      }
      animate={
        shouldReduceMotion
          ? { opacity: targetOpacity, y: targetY, scale: targetScale }
          : {
              y: targetY,
              scale: targetScale,
              opacity: targetOpacity,
              rotateX: targetRotateX,
            }
      }
      variants={
        shouldReduceMotion
          ? undefined
          : {
              exit: (dir: 1 | -1) =>
                dir === 1
                  ? {
                      y: -170,
                      scale: 0.9,
                      opacity: 0,
                      rotateX: 13,
                      transition: {
                        type: 'spring',
                        stiffness: 320,
                        damping: 25,
                      },
                    }
                  : {
                      y: 72,
                      scale: 0.82,
                      opacity: 0,
                      rotateX: -7,
                      transition: {
                        type: 'spring',
                        stiffness: 320,
                        damping: 25,
                      },
                    },
            }
      }
      exit={shouldReduceMotion ? { opacity: 0 } : 'exit'}
      transition={shouldReduceMotion ? { duration: 0.15 } : BOUNCY_SPRING_TRANSITION}
      className="absolute inset-0 will-change-transform pointer-events-none"
    >
      {/* Back-card drag reaction layer + Front-card bouncy drag gesture layer */}
      <motion.div
        style={
          depth > 0 && !shouldReduceMotion
            ? {
                scale: backReactiveScale,
                opacity: backReactiveOpacity,
                y: backReactiveY,
                transformStyle: 'preserve-3d',
              }
            : depth === 0 && canDrag && !shouldReduceMotion
              ? {
                  y: frontDragY,
                  rotateX: frontDragRotateX,
                  transformStyle: 'preserve-3d',
                }
              : undefined
        }
        drag={canDrag && !shouldReduceMotion ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.62}
        dragTransition={{ bounceStiffness: 480, bounceDamping: 16 }}
        whileDrag={shouldReduceMotion ? undefined : { scale: 1.03 }}
        onDragEnd={handleDragEnd}
        className={`relative h-full w-full rounded-[28px] liquid-glass-card overflow-hidden will-change-transform ${
          canDrag
            ? 'pointer-events-auto cursor-grab active:cursor-grabbing touch-none'
            : 'pointer-events-none'
        }`}
      >
        {/* Subtle Apple Liquid Glass Top Specular Sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/35 dark:from-white/[0.08] to-transparent"
        />
        <div
          className={`relative h-full w-full transition-opacity duration-200 ${
            depth === 0 ? 'opacity-100' : depth === 1 ? 'opacity-78' : 'opacity-48'
          }`}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
