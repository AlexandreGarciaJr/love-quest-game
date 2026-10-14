import { useCallback, useEffect, useRef, useState } from 'react';
import type * as Phaser from 'phaser';
import { gameText, mapText, type Line, type Profile } from '../../content';
import { createGame } from '../../game';
import { bridge, type HudState, type LevelResult } from '../../game/bridge';
import { TILE } from '../../game/config';
import { withResult, type Progress } from '../../game/progress';
import { playSfx } from '../../audio';
import { PixelHeart } from '../PixelHeart';
import { SoundToggle } from '../SoundToggle';
import { TouchControls, releaseTouch } from './TouchControls';
import { DialogBox } from './DialogBox';

export type Layout = 'landscape' | 'portrait';
type SceneName = 'map' | 'level' | 'boss';

interface Props {
  profile: Profile;
  progress: Progress;
  soundOn: boolean;
  onToggleSound: () => void;
  onProgress: (p: Progress) => void;
  onFinished: () => void;
  toast: (text: string) => void;
}

interface PlayableScene extends Phaser.Scene {
  restartFromCheckpoint(): void;
}

const LAYOUT_KEY = 'love-quest:layout';
/** Phaser.Scenes.PAUSED (o Phaser é importado só como tipo aqui). */
const PAUSED = 6;
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    (import.meta.env.DEV && location.search.includes('lqtouch')));

function readLayout(): Layout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'portrait' ? 'portrait' : 'landscape';
  } catch {
    return 'landscape';
  }
}

export function GameView({ profile, progress, soundOn, onToggleSound, onProgress, onFinished, toast }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const progressRef = useRef(progress);
  const [layout, setLayout] = useState<Layout>(readLayout);
  const [touchUi] = useState(isTouchDevice);
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth);
  const [scene, setScene] = useState<SceneName | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [bossHp, setBossHp] = useState<{ hp: number; max: number } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [mapSelect, setMapSelect] = useState<{ label: string; locked: boolean } | null>(null);
  const [dialog, setDialog] = useState<Line[] | null>(null);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<LevelResult | null>(null);

  progressRef.current = progress;
  const needsRotate = touchUi && layout === 'landscape' && isPortrait;

  const updateProgress = useCallback(
    (p: Progress) => {
      progressRef.current = p;
      gameRef.current?.registry.set('progress', p);
      onProgress(p);
    },
    [onProgress],
  );

  // Um jogo Phaser por sessão (mapa, fases e chefão vivem nele).
  useEffect(() => {
    const game = createGame({ parent: hostRef.current!, profile, progress: progressRef.current, width: 320, height: 216 });
    gameRef.current = game;
    const overlay = touchUi && readLayout() === 'landscape';
    game.registry.set('camOffsetY', overlay ? -48 : -16);
    game.registry.set('camExtraRows', overlay);
    return () => {
      releaseTouch();
      // O Phaser ignora destroy() antes de terminar de iniciar; espera o "ready".
      if (game.isBooted) game.destroy(true);
      else game.events.once('ready', () => game.destroy(true));
      gameRef.current = null;
    };
  }, [profile, touchUi]);

  // Com os controles por cima da tela (deitado), a câmera sobe para a personagem não ficar escondida.
  useEffect(() => {
    const overlay = touchUi && layout === 'landscape';
    gameRef.current?.registry.set('camOffsetY', overlay ? -48 : -16);
    gameRef.current?.registry.set('camExtraRows', overlay);
  }, [touchUi, layout]);

  // Resolução interna: ~12 blocos de altura deitado; em pé, ~11,5 de largura.
  useEffect(() => {
    const host = hostRef.current!;
    const fit = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h || !gameRef.current) return;
      const zoom =
        touchUi && layout === 'portrait'
          ? Math.max(1, w / (11.5 * TILE))
          : Math.max(1, Math.min(h / (12 * TILE), w / (14 * TILE)));
      gameRef.current.scale.resize(Math.round(w / zoom), Math.round(h / zoom));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    const onOrient = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', onOrient);
    fit();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onOrient);
    };
  }, [layout, touchUi]);

  useEffect(() => {
    const offs = [
      bridge.on('scene', (s) => {
        setScene(s);
        if (s !== 'level') setHud(null);
        if (s !== 'map') setMapSelect(null);
        setHint(null);
      }),
      bridge.on('hud', setHud),
      bridge.on('bossHp', setBossHp),
      bridge.on('hint', setHint),
      bridge.on('mapSelect', setMapSelect),
      bridge.on('dialog', setDialog),
      bridge.on('levelComplete', (r) => setResult(r)),
      bridge.on('pauseRequest', () => setPaused((p) => !p)),
      bridge.on('introSeen', () => updateProgress({ ...progressRef.current, introSeen: true })),
      bridge.on('bossDefeated', () => onFinished()),
    ];
    return () => offs.forEach((off) => off());
  }, [updateProgress, onFinished]);

  const activeScene = (): PlayableScene | undefined => {
    const g = gameRef.current;
    if (!g || !scene) return undefined;
    return g.scene.getScene(scene) as PlayableScene;
  };

  // Pausa o jogo quando há menu, aviso de rotação ou resultado na tela.
  const shouldPause = paused || needsRotate || !!result;
  useEffect(() => {
    const s = activeScene();
    if (!s) return;
    if (shouldPause && s.scene.isActive()) {
      releaseTouch();
      s.scene.pause();
    } else if (!shouldPause && s.sys.settings.status === PAUSED) {
      s.scene.resume();
    }
  }, [shouldPause, scene]);

  const closeDialog = (dodges: number) => {
    setDialog(null);
    bridge.emit('dialogDone', { dodges });
  };

  const changeLayout = (l: Layout) => {
    setLayout(l);
    try {
      localStorage.setItem(LAYOUT_KEY, l);
    } catch {
      /* preferência opcional */
    }
  };

  const fullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      if (layout === 'landscape') await orientation.lock?.('landscape').catch(() => undefined);
    } catch {
      /* navegador sem suporte */
    }
  };

  /** Troca de cena sem deixar o efeito de pausa "despausar" a cena que está saindo. */
  const transition = (from: SceneName, to: SceneName, data: object) => {
    const g = gameRef.current;
    if (!g) return;
    setScene(null);
    setPaused(false);
    setResult(null);
    releaseTouch();
    g.scene.stop(from);
    g.scene.start(to, data);
  };

  const continueAfterLevel = () => {
    if (!result) return;
    updateProgress(withResult(progressRef.current, result));
    transition('level', 'map', { from: result.levelIndex, reveal: true });
  };

  const replayLevel = () => {
    if (!result) return;
    updateProgress(withResult(progressRef.current, result));
    transition('level', 'level', { levelIndex: result.levelIndex });
  };

  const backToMap = () => {
    if (!scene || scene === 'map') return;
    transition(scene, 'map', { from: scene === 'boss' ? 3 : (activeScene() as unknown as { levelIndex: number }).levelIndex });
  };

  const pt = gameText.pause;
  const totals = Object.values(progress.results);
  const totalHearts = totals.reduce((n, r) => n + r.hearts, 0);
  const totalLetters = totals.filter((r) => r.letter).length;

  return (
    <div className={`game game--${layout}${touchUi ? ' game--touch' : ''}`}>
      <div className="game__viewport">
        <div ref={hostRef} className="game__canvas" />

        {(hud || scene === 'map') && (
          <div className="hud">
            {scene === 'map' ? (
              <>
                <span className="hud__chip">
                  <PixelHeart size={16} /> {totalHearts}
                </span>
                <span className="hud__chip">💌 {totalLetters}/3</span>
                <span className="hud__level">{mapText.title}</span>
              </>
            ) : (
              hud && (
                <>
                  {hud.heartsTotal > 0 && (
                    <span className="hud__chip">
                      <PixelHeart size={16} /> {hud.hearts}/{hud.heartsTotal}
                    </span>
                  )}
                  {scene === 'level' && (
                    <span className={hud.letter ? 'hud__chip' : 'hud__chip is-dim'} aria-label={hud.letter ? 'Carta encontrada' : 'Carta não encontrada'}>
                      💌
                    </span>
                  )}
                  {bossHp && (
                    <span className="boss-bar" aria-label={`Tédio: ${bossHp.hp} de ${bossHp.max}`}>
                      <span className="boss-bar__fill" style={{ width: `${(bossHp.hp / bossHp.max) * 100}%` }} />
                      <span className="boss-bar__label">Tédio</span>
                    </span>
                  )}
                  <span className="hud__level">{hud.levelName}</span>
                </>
              )
            )}
            <button type="button" className="hud__pause" onClick={() => setPaused(true)} aria-label={gameText.controls.pause}>
              <span className="hud__bars" aria-hidden="true" />
            </button>
          </div>
        )}

        {hint && !dialog && (
          <p className="hint" role="status" key={hint}>
            {hint}
          </p>
        )}

        {mapSelect && !dialog && (
          <p className={mapSelect.locked ? 'map-banner is-locked' : 'map-banner'} role="status">
            {mapSelect.label}
          </p>
        )}

        {dialog && <DialogBox lines={dialog} onDone={closeDialog} />}

        {touchUi && layout === 'landscape' && !dialog && <TouchControls />}
      </div>

      {touchUi && layout === 'portrait' && (
        <div className="game__pad">
          <TouchControls />
        </div>
      )}

      {paused && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label={pt.title}>
          <div className="menu">
            <h2 className="menu__title">{pt.title}</h2>
            <button type="button" className="btn btn--primary btn--big" onClick={() => setPaused(false)} autoFocus>
              ▶ {pt.resume}
            </button>
            {touchUi && (
              <div className="menu__row">
                <span>{pt.layout}</span>
                <div className="segmented__row">
                  <button type="button" className={layout === 'landscape' ? 'chip is-on' : 'chip'} onClick={() => changeLayout('landscape')}>
                    {pt.landscape}
                  </button>
                  <button type="button" className={layout === 'portrait' ? 'chip is-on' : 'chip'} onClick={() => changeLayout('portrait')}>
                    {pt.portrait}
                  </button>
                </div>
              </div>
            )}
            <div className="menu__row">
              <span>{pt.sound}</span>
              <SoundToggle on={soundOn} onToggle={onToggleSound} inline />
            </div>
            {document.fullscreenEnabled && !document.fullscreenElement && (
              <button type="button" className="btn btn--ghost" onClick={fullscreen}>
                ⛶ {pt.fullscreen}
              </button>
            )}
            {scene !== 'map' && (
              <>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setPaused(false);
                    activeScene()?.restartFromCheckpoint();
                  }}
                >
                  ↺ {pt.restart}
                </button>
                {progress.completed > 0 && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={backToMap}
                  >
                    🗺️ {pt.map}
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="btn btn--ghost btn--small is-locked"
              onClick={() => {
                playSfx('error');
                toast(pt.quitToast);
              }}
            >
              🚪 {pt.quit}
            </button>
          </div>
        </div>
      )}

      {needsRotate && !paused && (
        <div className="overlay rotate" role="dialog" aria-modal="true">
          <div className="rotate__phone" aria-hidden="true">📱</div>
          <h2 className="menu__title">{gameText.rotate.title}</h2>
          <p>{gameText.rotate.text}</p>
          <button type="button" className="btn btn--ghost" onClick={() => changeLayout('portrait')}>
            {gameText.rotate.portrait}
          </button>
        </div>
      )}

      {result && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="menu result-card pop-in">
            <h2 className="menu__title">{gameText.levelComplete.title}</h2>
            <dl className="stats">
              <dt>{gameText.levelComplete.hearts}</dt>
              <dd>
                <PixelHeart size={16} /> {result.hearts}/{result.heartsTotal}
              </dd>
              <dt>{gameText.levelComplete.letter}</dt>
              <dd>{result.letter ? gameText.levelComplete.found : gameText.levelComplete.missing}</dd>
              <dt>{gameText.levelComplete.deaths}</dt>
              <dd>{result.deaths}</dd>
            </dl>
            <button type="button" className="btn btn--primary btn--big" onClick={continueAfterLevel} autoFocus>
              {gameText.levelComplete.next} ▶
            </button>
            <button type="button" className="btn btn--ghost btn--small" onClick={replayLevel}>
              ↺ {gameText.levelComplete.replay}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
