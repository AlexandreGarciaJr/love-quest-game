import { useEffect, useMemo, useState } from 'react';
import { allLettersLine, content, letterLines, type Profile } from '../content';
import { playSfx, setMusicTheme } from '../audio';
import { Speech } from '../components/Speech';
import { PixelHeart } from '../components/PixelHeart';
import { Credits } from '../components/Credits';
import type { LevelResult } from '../game/bridge';

interface Props {
  profile: Profile;
  results: LevelResult[];
  onReplay: () => void;
  toast: (text: string) => void;
}

const t = content.final;

export function FinalScene({ profile, results, onReplay, toast }: Props) {
  const hearts = results.reduce((n, r) => n + r.hearts, 0);
  const heartsTotal = results.reduce((n, r) => n + r.heartsTotal, 0);
  const letters = ['sky', 'garden', 'city'].map((id) => !!results.find((r) => r.levelId === id)?.letter);
  const [opened, setOpened] = useState(false);
  useEffect(() => setMusicTheme('final'), []);
  const [leaveTries, setLeaveTries] = useState(0);

  const tryLeave = () => {
    playSfx('error');
    setLeaveTries((n) => n + 1);
  };

  const open = () => {
    playSfx('fanfare');
    setOpened(true);
  };

  const share = async () => {
    playSfx('tap');
    // Compartilha o link genérico, sem nomes.
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: content.title, text: t.shareText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast(t.copied);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast(url);
    }
  };

  if (!opened) {
    const text = leaveTries === 0 ? t.intro(profile) : t.leaveReactions[Math.min(leaveTries, 3) - 1];
    return (
      <section className="scene" aria-labelledby="final-title">
        <h2 id="final-title" className="scene__title" tabIndex={-1} data-autofocus>
          Fase final · A mensagem
        </h2>
        <Speech text={text} mood={leaveTries > 0 ? 'smug' : 'happy'} />
        <div className="envelope-wrap" aria-hidden="true">
          <div className="envelope">
            <PixelHeart size={40} />
          </div>
        </div>
        <div className="actions">
          <button type="button" className={leaveTries > 0 ? 'btn btn--primary btn--big is-pulsing' : 'btn btn--primary btn--big'} onClick={open}>
            {t.open}
          </button>
          <button type="button" className="btn btn--ghost btn--small" onClick={tryLeave} aria-disabled={leaveTries > 0}>
            {leaveTries > 0 ? t.leaveLocked : t.leave}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="scene final" aria-labelledby="final-message">
      <Confetti />
      <div className="letter pop-in">
        <p className="letter__greeting" id="final-message" tabIndex={-1} data-autofocus>
          {t.greeting(profile)}
        </p>
        <p className="letter__main">{t.message(profile)}</p>
        <p className="letter__body">{t.paragraph}</p>
        {letters.map((found, i) => found && <p key={i} className="letter__extra">{letterLines[i]}</p>)}
        {letters.every(Boolean) && <p className="letter__extra letter__extra--all">{allLettersLine}</p>}
        <p className="letter__signature">{t.signature(profile)}</p>
        {heartsTotal > 0 && <p className="letter__score">{t.score(profile, hearts, heartsTotal)}</p>}
      </div>
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={onReplay}>
          ↺ {t.replay}
        </button>
        <button type="button" className="btn btn--ghost" onClick={share}>
          💌 {t.share}
        </button>
      </div>
      <p className="share-line share-line--end">{content.shareLine}</p>
      <Credits portfolio />
    </section>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 53) % 100}%`,
        delay: `${(i % 6) * 0.35}s`,
        duration: `${3.2 + (i % 4) * 0.6}s`,
        color: ['var(--pink)', 'var(--violet)', 'var(--pink-light)', '#fff'][i % 4],
        size: 12 + (i % 3) * 6,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }}>
          <PixelHeart size={p.size} color={p.color} />
        </span>
      ))}
    </div>
  );
}
