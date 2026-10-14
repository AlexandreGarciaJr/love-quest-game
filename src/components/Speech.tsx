import { Mascot, type Mood } from './Mascot';

interface Props {
  text: string;
  mood?: Mood;
}

/** Mascote + balão de fala. O texto é anunciado por leitores de tela. */
export function Speech({ text, mood = 'happy' }: Props) {
  return (
    <div className="speech">
      <div className="speech__mascot">
        <Mascot mood={mood} />
      </div>
      <p className="bubble" aria-live="polite" key={text}>
        {text}
      </p>
    </div>
  );
}
