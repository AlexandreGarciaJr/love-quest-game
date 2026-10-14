import { useRef, type PointerEvent } from 'react';
import { touch } from '../../game/input';
import { gameText } from '../../content';

/** Direcional (arrastar o dedo entre ◀ e ▶) + botões Pular e Ação. Multitoque. */
export function TouchControls({ showAction = true }: { showAction?: boolean }) {
  const padRef = useRef<HTMLDivElement>(null);
  const padPointer = useRef<number | null>(null);

  const updatePad = (e: PointerEvent) => {
    const rect = padRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    touch.left = x < rect.width / 2;
    touch.right = !touch.left;
    padRef.current!.dataset.dir = touch.left ? 'left' : 'right';
  };

  const onPadDown = (e: PointerEvent) => {
    e.preventDefault();
    padPointer.current = e.pointerId;
    capture(e);
    updatePad(e);
  };
  const onPadMove = (e: PointerEvent) => {
    if (padPointer.current === e.pointerId) updatePad(e);
  };
  const onPadUp = (e: PointerEvent) => {
    if (padPointer.current !== e.pointerId) return;
    padPointer.current = null;
    touch.left = touch.right = false;
    padRef.current!.dataset.dir = '';
  };

  const hold = (key: 'jump' | 'action') => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      capture(e);
      touch[key] = true;
      e.currentTarget.dataset.on = '1';
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      touch[key] = false;
      e.currentTarget.dataset.on = '';
    },
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
      touch[key] = false;
      e.currentTarget.dataset.on = '';
    },
  });

  return (
    <div className="pad" onContextMenu={(e) => e.preventDefault()}>
      <div
        ref={padRef}
        className="pad__dpad"
        onPointerDown={onPadDown}
        onPointerMove={onPadMove}
        onPointerUp={onPadUp}
        onPointerCancel={onPadUp}
        aria-hidden="true"
      >
        <span className="pad__arrow pad__arrow--left">◀</span>
        <span className="pad__arrow pad__arrow--right">▶</span>
      </div>
      <div className="pad__buttons">
        {showAction && (
          <button type="button" className="pad__btn pad__btn--action" aria-label={gameText.controls.action} {...hold('action')}>
            B
          </button>
        )}
        <button type="button" className="pad__btn pad__btn--jump" aria-label={gameText.controls.jump} {...hold('jump')}>
          A
        </button>
      </div>
    </div>
  );
}

/** Mantém o dedo "preso" ao botão mesmo se escorregar para fora dele. */
function capture(e: PointerEvent<Element>): void {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    /* alguns navegadores recusam; o botão continua funcionando */
  }
}

export function releaseTouch(): void {
  touch.left = touch.right = touch.jump = touch.action = false;
}
