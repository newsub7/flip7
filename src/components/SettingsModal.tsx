import { useState } from 'react';
import type { Ruleset } from '../types';
import { RULESET_HINTS, RULESET_LABELS } from '../logic';
import { CloseIcon } from './Icons';

interface SettingsModalProps {
  targetScore: number;
  ruleset: Ruleset;
  brutalMode: boolean;
  onSave: (next: { targetScore: number; ruleset: Ruleset; brutalMode: boolean }) => void;
  onClose: () => void;
}

const RULESETS: Ruleset[] = ['classic', 'vengeance', 'combined'];

export default function SettingsModal({ targetScore, ruleset, brutalMode, onSave, onClose }: SettingsModalProps) {
  const [target, setTarget] = useState(targetScore);
  const [rs, setRs] = useState<Ruleset>(ruleset);
  const [brutal, setBrutal] = useState(brutalMode);

  function handleRulesetClick(next: Ruleset) {
    setRs(next);
    if (next === 'classic') setBrutal(false);
  }

  function handleSave() {
    const val = Number.isFinite(target) && target > 0 ? target : targetScore;
    onSave({ targetScore: val, ruleset: rs, brutalMode: rs === 'classic' ? false : brutal });
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Einstellungen</h2>
          <button className="icon-btn" aria-label="Schließen" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <span className="field-label">Zielpunktzahl</span>
        <input
          type="number"
          min={50}
          step={10}
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value, 10))}
        />

        <div style={{ marginTop: 18 }}>
          <span className="field-label">Regelwerk</span>
          <div className="segmented">
            {RULESETS.map((r) => (
              <button key={r} className={`segment ${rs === r ? 'active' : ''}`} onClick={() => handleRulesetClick(r)}>
                {RULESET_LABELS[r]}
              </button>
            ))}
          </div>
          <p className="hint-text">{RULESET_HINTS[rs]}</p>
        </div>

        <div
          className="toggle-row"
          style={{ marginTop: 14, opacity: rs === 'classic' ? 0.4 : 1, pointerEvents: rs === 'classic' ? 'none' : 'auto' }}
        >
          <div>
            <div className="toggle-label">Brutal Mode</div>
            <div className="toggle-sub">
              Negative Rundenpunkte erlaubt · Flip-7-Bonus kann einem Gegner abgezogen werden
            </div>
          </div>
          <div className={`switch ${brutal ? 'on' : ''}`} onClick={() => setBrutal((b) => !b)} />
        </div>

        <div className="modal-footer">
          <button className="primary-btn" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
