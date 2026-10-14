import { content } from '../content';

interface Props {
  on: boolean;
  onToggle: () => void;
  /** Dentro de um menu, em vez de fixo no canto. */
  inline?: boolean;
}

export function SoundToggle({ on, onToggle, inline = false }: Props) {
  return (
    <button
      type="button"
      className={inline ? 'sound-toggle sound-toggle--inline' : 'sound-toggle'}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={on ? content.sound.on : content.sound.off}
      title={on ? content.sound.on : content.sound.off}
    >
      {on ? '🔊' : '🔇'}
    </button>
  );
}
