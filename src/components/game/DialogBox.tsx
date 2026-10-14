import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Line } from '../../content';
import { playSfx } from '../../audio';

interface Props {
  lines: Line[];
  /** `dodges` = quantas vezes a pessoa tentou o "Não". */
  onDone: (dodges: number) => void;
}

// Posições para onde o "Não" foge dentro da caixa.
// (relativas à caixa inteira; nenhuma cobre o botão "Sim", que fica no canto inferior direito).
const NO_SPOTS = [
  { right: '4%', bottom: '72%' },
  { right: '58%', bottom: '8%' },
  { right: '30%', bottom: '8%' },
];

export function DialogBox({ lines, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const [dodges, setDodges] = useState(0);
  const total = useRef(0);
  const lastDodge = useRef(0);
  const line = lines[index];
  const choice = line.choice;
  const converted = dodges >= 3;

  useEffect(() => {
    setDodges(0);
  }, [index]);

  const next = useCallback(() => {
    playSfx('tap');
    if (index < lines.length - 1) setIndex((i) => i + 1);
    else onDone(total.current);
  }, [index, lines.length, onDone]);

  const dodge = () => {
    const now = Date.now();
    if (converted || now - lastDodge.current < 300) return;
    lastDodge.current = now;
    total.current++;
    setDodges((d) => d + 1);
    playSfx(dodges >= 2 ? 'success' : 'boing');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'z', 'Z', 'k', 'K'].includes(e.key)) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next]);

  const text = choice && dodges > 0 ? choice.dodges[Math.min(dodges, choice.dodges.length) - 1] : line.text;
  const spot = NO_SPOTS[(dodges - 1 + NO_SPOTS.length) % NO_SPOTS.length];

  return (
    <div
      className={choice ? 'dialog dialog--choice' : 'dialog'}
      role="dialog"
      aria-live="polite"
      onClick={choice ? undefined : next}
    >
      <span className="dialog__speaker">{line.speaker}</span>
      <span className="dialog__text" key={`${index}-${dodges}`}>
        {text}
      </span>
      {choice ? (
        <div className="dialog__choices">
          <button type="button" className="btn btn--primary btn--small" onClick={next} autoFocus>
            {choice.yes}
          </button>
          <button
            type="button"
            className={converted ? 'btn btn--primary btn--small pop-in' : 'btn btn--ghost btn--small dialog__no'}
            style={dodges > 0 && !converted ? { position: 'absolute', ...spot } : undefined}
            onPointerEnter={(e: PointerEvent) => e.pointerType === 'mouse' && dodge()}
            onClick={converted ? next : dodge}
          >
            {converted ? choice.yes : choice.no}
          </button>
        </div>
      ) : (
        <span className="dialog__next" aria-hidden="true">▼</span>
      )}
    </div>
  );
}
