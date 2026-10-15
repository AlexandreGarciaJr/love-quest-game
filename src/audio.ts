// Efeitos sonoros gerados no navegador (Web Audio) e trilha sonora em MP3 (public/music/).

type Sfx = 'tap' | 'pop' | 'boing' | 'error' | 'success' | 'fanfare' | 'jump' | 'doubleJump' | 'stomp' | 'die' | 'checkpoint' | 'dash' | 'letter' | 'punch';

const STORAGE_KEY = 'love-quest:sound';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = readPreference();

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
// As faixas de public/music/ tocam em sequência, em loop, durante o jogo todo.
// Músicas: "Love" e "Love Love Music", de nastelbom (Pixabay Content License).

export type MusicTheme = 'map' | 'sky' | 'garden' | 'city' | 'boss' | 'final';

const PLAYLIST = ['/music/love-1.mp3', '/music/love-2.mp3'];
const MUSIC_VOLUME = 0.4;

let player: HTMLAudioElement | null = null;
let trackIndex = 0;

function nextTrack(): void {
  if (!player) return;
  trackIndex = (trackIndex + 1) % PLAYLIST.length;
  player.src = PLAYLIST[trackIndex];
  if (enabled) void player.play().catch(() => undefined);
}

function getPlayer(): HTMLAudioElement {
  if (player) return player;
  player = new Audio(PLAYLIST[trackIndex]);
  player.preload = 'auto';
  player.volume = MUSIC_VOLUME;
  player.addEventListener('ended', nextTrack);
  return player;
}

/**
 * Chamado ao entrar em cada cena. A trilha é a mesma em todas as cenas e continua
 * de onde parou; o tema fica como ponto de troca caso cada cena ganhe a sua música.
 */
export function setMusicTheme(_theme: MusicTheme): void {
  startMusic();
}

function startMusic(): void {
  if (!enabled) return;
  const p = getPlayer();
  if (p.paused) void p.play().catch(() => undefined);
}

function stopMusic(): void {
  player?.pause();
}

/** Pausa a música quando a aba fica em segundo plano. */
export function handleVisibility(hidden: boolean): void {
  if (!enabled) return;
  if (hidden) {
    stopMusic();
    void ctx?.suspend();
  } else {
    void ctx?.resume();
    if (player) startMusic();
  }
}

/** Liga o áudio no primeiro gesto (botão "Começar aventura"). */
export function unlockAudio(): void {
  if (enabled) startMusic();
}
