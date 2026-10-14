import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Profile } from './content';
import { handleVisibility, isSoundEnabled, playSfx, setSoundEnabled, unlockAudio } from './audio';
import { readInvite } from './urlParams';
import { Sky } from './components/Sky';
import { Toast, useToast } from './components/Toast';
import { clearSave, emptyProgress, loadSave, writeSave, type Progress } from './game/progress';
import { EntryScene } from './scenes/EntryScene';
import { FinalScene } from './scenes/FinalScene';

// O Phaser é pesado: fica num arquivo separado, baixado em segundo plano enquanto a pessoa digita os nomes.
const loadGameView = () => import('./components/game/GameView');
const GameView = lazy(() => loadGameView().then((m) => ({ default: m.GameView })));

type Screen = 'entry' | 'game' | 'final';

const invite = readInvite();

export function App() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [save, setSave] = useState(loadSave);
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const { toast, show: showToast } = useToast();

  useEffect(() => {
    const onVis = () => handleVisibility(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void loadGameView(), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const begin = (p: Profile, prog: Progress, sound: boolean) => {
    setProfile(p);
    setProgress(prog);
    setSoundOn(sound);
    setSoundEnabled(sound);
    unlockAudio();
    playSfx('success');
    writeSave(p, prog);
    setScreen('game');
  };

  const start = (p: Profile, sound: boolean) => begin(p, emptyProgress(), sound);

  const resume = (sound: boolean) => {
    if (save) begin(save.profile, save.progress, sound);
  };

  const onProgress = useCallback(
    (p: Progress) => {
      setProgress(p);
      if (profile) writeSave(profile, p);
    },
    [profile],
  );

  const onFinished = useCallback(() => setScreen('final'), []);

  const toggleSound = () => {
    const on = !soundOn;
    setSoundOn(on);
    setSoundEnabled(on);
  };

  const replay = () => {
    clearSave();
    setSave(null);
    setScreen('entry');
  };

  return (
    <div className={screen === 'game' ? 'app app--game' : 'app'}>
      {screen !== 'game' && <Sky />}
      {screen === 'entry' && (
        <main className="stage">
          <EntryScene invite={invite} initialSound={soundOn} onStart={start} save={save} onResume={resume} />
        </main>
      )}
      {profile && screen === 'game' && (
        <Suspense fallback={<div className="loading">Carregando aventura…</div>}>
          <GameView
            profile={profile}
            progress={progress}
            soundOn={soundOn}
            onToggleSound={toggleSound}
            onProgress={onProgress}
            onFinished={onFinished}
            toast={showToast}
          />
        </Suspense>
      )}
      {profile && screen === 'final' && (
        <main className="stage">
          <FinalScene profile={profile} results={Object.values(progress.results)} onReplay={replay} toast={showToast} />
        </main>
      )}
      <Toast toast={toast} />
    </div>
  );
}
