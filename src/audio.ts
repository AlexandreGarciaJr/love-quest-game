// Som 100% gerado no navegador (Web Audio), sem arquivos.
// Se existir public/music.mp3, ele toca no lugar do chiptune.

type Sfx = 'tap' | 'pop' | 'boing' | 'error' | 'success' | 'fanfare' | 'jump' | 'doubleJump' | 'stomp' | 'die' | 'checkpoint' | 'dash' | 'letter' | 'punch';

const STORAGE_KEY = 'love-quest:sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let enabled = readPreference();
let musicTimer: number | null = null;

function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.22;
  musicGain.connect(master);
  return ctx;
}

/** Deve ser chamado dentro de um gesto do usuário (toque/clique). */
export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* preferências são opcionais */
  }
  if (on) startMusic();
  else stopMusic();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode, slideTo?: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(dest ?? master);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

export function playSfx(name: Sfx): void {
  if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime;
  switch (name) {
    case 'tap':
      tone(880, t, 0.06, 'square', 0.12);
      break;
    case 'pop':
      tone(520, t, 0.12, 'square', 0.18, undefined, 1040);
      tone(1320, t + 0.06, 0.1, 'triangle', 0.12);
      break;
    case 'boing':
      tone(200, t, 0.3, 'triangle', 0.3, undefined, 600);
      break;
    case 'error':
      tone(160, t, 0.14, 'sawtooth', 0.12);
      tone(120, t + 0.16, 0.2, 'sawtooth', 0.12);
      break;
    case 'success':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.16, 'square', 0.13));
      break;
    case 'jump':
      tone(330, t, 0.12, 'square', 0.1, undefined, 660);
      break;
    case 'doubleJump':
      tone(520, t, 0.1, 'square', 0.1, undefined, 1040);
      tone(780, t + 0.05, 0.1, 'triangle', 0.08);
      break;
    case 'stomp':
      tone(180, t, 0.08, 'square', 0.2, undefined, 90);
      tone(660, t + 0.05, 0.12, 'square', 0.12, undefined, 990);
      break;
    case 'die':
      tone(660, t, 0.12, 'square', 0.14, undefined, 440);
      tone(440, t + 0.12, 0.14, 'square', 0.14, undefined, 220);
      tone(220, t + 0.26, 0.3, 'triangle', 0.18, undefined, 110);
      break;
    case 'checkpoint':
      [659, 784, 988].forEach((f, i) => tone(f, t + i * 0.07, 0.14, 'triangle', 0.16));
      break;
    case 'dash':
      tone(900, t, 0.14, 'sawtooth', 0.06, undefined, 300);
      break;
    case 'punch':
      tone(240, t, 0.07, 'square', 0.14, undefined, 120);
      tone(1200, t, 0.04, 'triangle', 0.06);
      break;
    case 'letter':
      [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.22, 'triangle', 0.16));
      break;
    case 'fanfare':
      [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.28, 'square', 0.12));
      [262, 330, 392].forEach((f, i) => tone(f, t + i * 0.24, 0.5, 'triangle', 0.16));
      break;
  }
}

// --- Música --------------------------------------------------------------
// Uma trilha chiptune por ambiente, gerada a partir de acordes + um padrão de arpejo.
// Para usar uma faixa própria, coloque public/music-<tema>.mp3 (ou public/music.mp3 para todas).

export type MusicTheme = 'map' | 'sky' | 'garden' | 'city' | 'boss' | 'final';

interface Track {
  bpm: number;
  /** [nota MIDI da fundamental, menor?] — um acorde por compasso. */
  chords: [number, boolean][];
  /** 8 colcheias por compasso: índice da nota do acorde (0-3) ou -1 para pausa. */
  pattern: number[];
  lead: OscillatorType;
  leadVol: number;
  /** Baixo pulando oitava em vez de nota longa. */
  bounce: boolean;
}

const TRACKS: Record<MusicTheme, Track> = {
  map: { bpm: 112, chords: [[60, false], [55, false], [57, true], [53, false]], pattern: [0, 1, 2, 3, 2, 1, 2, -1], lead: 'square', leadVol: 0.12, bounce: false },
  sky: { bpm: 100, chords: [[53, false], [60, false], [62, true], [58, false]], pattern: [0, -1, 2, 1, 3, -1, 2, 1], lead: 'triangle', leadVol: 0.22, bounce: false },
  garden: { bpm: 126, chords: [[60, false], [65, false], [67, false], [60, false]], pattern: [3, 2, 1, 2, 0, 2, 1, 2], lead: 'square', leadVol: 0.1, bounce: true },
  city: { bpm: 108, chords: [[57, true], [53, false], [60, false], [55, false]], pattern: [0, 2, 3, 2, 1, -1, 2, 1], lead: 'square', leadVol: 0.1, bounce: true },
  boss: { bpm: 150, chords: [[52, true], [48, false], [50, false], [47, false]], pattern: [0, 1, 2, 1, 0, 1, 3, 1], lead: 'sawtooth', leadVol: 0.06, bounce: true },
  final: { bpm: 84, chords: [[60, false], [57, true], [53, false], [55, false]], pattern: [0, -1, 2, -1, 1, -1, 3, -1], lead: 'triangle', leadVol: 0.24, bounce: false },
};

const midiFreq = (m: number) => 440 * 2 ** ((m - 69) / 12);

let currentTheme: MusicTheme = 'map';
let mp3: HTMLAudioElement | null = null;
const mp3Cache = new Map<string, boolean>();

/** Troca a trilha (chamado ao entrar em cada cena). */
export function setMusicTheme(theme: MusicTheme): void {
  if (theme === currentTheme && (musicTimer !== null || mp3)) return;
  currentTheme = theme;
  stopMusic();
  mp3 = null;
  startMusic();
}

function startMusic(): void {
  if (!enabled) return;
  if (mp3) {
    void mp3.play().catch(() => undefined);
    return;
  }
  const c = ensureContext();
  if (!c || musicTimer !== null) return;
  if (c.state === 'suspended') void c.resume();
  void tryLoadMp3(currentTheme);

  const track = TRACKS[currentTheme];
  const step = 60 / track.bpm / 2;
  let i = 0;
  let next = c.currentTime + 0.1;
  const dest = () => musicGain ?? undefined;
  const schedule = () => {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.25) {
      const bar = Math.floor(i / 8) % track.chords.length;
      const beat = i % 8;
      const [root, minor] = track.chords[bar];
      const tones = [0, minor ? 3 : 4, 7, 12];
      const idx = track.pattern[beat];
      // Na segunda volta, a melodia sobe uma oitava em compassos alternados (menos repetitivo).
      const lift = Math.floor(i / (8 * track.chords.length)) % 2 === 1 && bar % 2 === 1 ? 12 : 0;
      if (idx >= 0) tone(midiFreq(root + 12 + tones[idx] + lift), next, step * 0.85, track.lead, track.leadVol, dest());
      if (track.bounce) {
        if (beat % 2 === 0) tone(midiFreq(root - 12 + (beat % 4 === 2 ? 12 : 0)), next, step * 0.9, 'triangle', 0.3, dest());
      } else if (beat === 0) {
        tone(midiFreq(root - 12), next, step * 7.5, 'triangle', 0.32, dest());
      }
      next += step;
      i++;
    }
  };
  schedule();
  musicTimer = window.setInterval(schedule, 80);
}

function stopMusic(): void {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  mp3?.pause();
}

async function hasAudio(url: string): Promise<boolean> {
  if (mp3Cache.has(url)) return mp3Cache.get(url)!;
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const ok = res.ok && (res.headers.get('content-type') ?? '').startsWith('audio');
    mp3Cache.set(url, ok);
    return ok;
  } catch {
    mp3Cache.set(url, false);
    return false;
  }
}

/** Se existir um MP3 para o tema (ou geral), ele substitui o chiptune. */
async function tryLoadMp3(theme: MusicTheme): Promise<void> {
  const url = (await hasAudio(`/music-${theme}.mp3`)) ? `/music-${theme}.mp3` : (await hasAudio('/music.mp3')) ? '/music.mp3' : null;
  if (!url || theme !== currentTheme) return;
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = 0.35;
  mp3 = audio;
  if (musicTimer !== null) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (enabled) await audio.play().catch(() => undefined);
}

/** Pausa a música quando a aba fica em segundo plano. */
export function handleVisibility(hidden: boolean): void {
  if (!enabled) return;
  if (hidden) {
    stopMusic();
    void ctx?.suspend();
  } else if (ctx) {
    void ctx.resume();
    startMusic();
  }
}

/** Liga o áudio no primeiro gesto (botão "Começar aventura"). */
export function unlockAudio(): void {
  if (enabled) startMusic();
}
