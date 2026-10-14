import { useId, useState, type FormEvent } from 'react';
import { content, mapText, sanitizeName, MAX_NAME_LENGTH, type Gender, type Profile } from '../content';
import type { SaveData } from '../game/progress';
import type { Invite } from '../urlParams';
import { Mascot } from '../components/Mascot';
import { Credits } from '../components/Credits';

interface Props {
  invite: Invite | null;
  initialSound: boolean;
  onStart: (profile: Profile, sound: boolean) => void;
  save: SaveData | null;
  onResume: (sound: boolean) => void;
}

type ErrorKey = keyof typeof content.entry.errors;

const t = content.entry;

export function EntryScene({ invite, initialSound, onStart, save, onResume }: Props) {
  const [showForm, setShowForm] = useState(!save);
  const [playerName, setPlayerName] = useState('');
  const [partnerName, setPartnerName] = useState(invite?.partnerName ?? '');
  const [editingPartner, setEditingPartner] = useState(!invite);
  const [playerGender, setPlayerGender] = useState<Gender | null>(null);
  const [partnerGender, setPartnerGender] = useState<Gender | null>(invite?.partnerGender ?? null);
  const [sound, setSound] = useState(initialSound);
  const [error, setError] = useState<ErrorKey | null>(null);
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const player = sanitizeName(playerName);
    const partner = sanitizeName(partnerName);
    const missing: ErrorKey | null = !player
      ? 'playerName'
      : !partner
        ? 'partnerName'
        : !playerGender
          ? 'playerGender'
          : !partnerGender
            ? 'partnerGender'
            : null;
    if (missing) {
      setError(missing);
      if (missing === 'partnerName') setEditingPartner(true);
      requestAnimationFrame(() => document.getElementById(`${id}-${missing}`)?.focus());
      return;
    }
    onStart({ playerName: player, partnerName: partner, playerGender: playerGender!, partnerGender: partnerGender! }, sound);
  };

  return (
    <form className="scene entry" onSubmit={submit} noValidate>
      <header className="entry__header">
        <Mascot mood="love" size={56} />
        <h1 className="logo">
          LOVE<span>QUEST</span>
        </h1>
        <p className="share-line">{content.shareLine}</p>
        <p className="tagline">{content.tagline}</p>
      </header>

      {!showForm && save && (
        <div className="panel">
          <button type="button" className="btn btn--primary btn--big" onClick={() => onResume(sound)}>
            ▶ {mapText.continue(save.profile.playerName)}
          </button>
          <p className="resume-info">
            {save.progress.completed}/3 fases · 💌 {Object.values(save.progress.results).filter((r) => r.letter).length}/3 cartas
          </p>
          <label className="switch">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
            <span className="switch__track" aria-hidden="true" />
            <span>🎵 {t.sound}: {sound ? 'ligado' : 'desligado'}</span>
          </label>
          <button type="button" className="btn btn--ghost" onClick={() => setShowForm(true)}>
            {mapText.newGame}
          </button>
        </div>
      )}

      {showForm && (
      <div className="panel">
        {!editingPartner && invite && (
          <div className="invite">
            <p className="invite__text">{t.sentBy(partnerName)}</p>
            <button type="button" className="link-btn" onClick={() => setEditingPartner(true)}>
              {t.changePartner}
            </button>
          </div>
        )}

        <label className="field" htmlFor={`${id}-playerName`}>
          <span className="field__label">{t.playerLabel}</span>
          <input
            id={`${id}-playerName`}
            className="input"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={t.playerPlaceholder}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="given-name"
            enterKeyHint="next"
            aria-invalid={error === 'playerName'}
          />
        </label>

        {editingPartner && (
          <label className="field" htmlFor={`${id}-partnerName`}>
            <span className="field__label">{t.partnerLabel}</span>
            <input
              id={`${id}-partnerName`}
              className="input"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder={t.partnerPlaceholder}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              enterKeyHint="done"
              aria-invalid={error === 'partnerName'}
            />
          </label>
        )}

        <Segmented
          id={`${id}-playerGender`}
          label={t.iAm}
          value={playerGender}
          onChange={setPlayerGender}
          options={[
            ['f', t.woman],
            ['m', t.man],
          ]}
          invalid={error === 'playerGender'}
        />
        <Segmented
          id={`${id}-partnerGender`}
          label={t.myPartnerIs}
          value={partnerGender}
          onChange={setPartnerGender}
          options={[
            ['m', t.partnerM],
            ['f', t.partnerF],
          ]}
          invalid={error === 'partnerGender'}
        />

        <label className="switch">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          <span className="switch__track" aria-hidden="true" />
          <span>🎵 {t.sound}: {sound ? 'ligado' : 'desligado'}</span>
        </label>

        <p className="form-error" role="alert">
          {error ? t.errors[error] : ''}
        </p>

        <button type="submit" className="btn btn--primary btn--big">
          {t.start} ▶
        </button>
      </div>
      )}
      <Credits />
    </form>
  );
}

interface SegmentedProps {
  id: string;
  label: string;
  value: Gender | null;
  onChange: (g: Gender) => void;
  options: [Gender, string][];
  invalid: boolean;
}

function Segmented({ id, label, value, onChange, options, invalid }: SegmentedProps) {
  return (
    <fieldset className={invalid ? 'segmented is-invalid' : 'segmented'}>
      <legend className="field__label">{label}</legend>
      <div className="segmented__row">
        {options.map(([v, text], i) => (
          <button
            key={v}
            id={i === 0 ? id : undefined}
            type="button"
            className={value === v ? 'chip is-on' : 'chip'}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
