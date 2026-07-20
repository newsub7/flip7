import { useState } from 'react';
import type { Player, RoundDraft, RoundEntry, Ruleset } from '../types';
import { MODIFIER_OPTIONS, calcEntryTotal, showsClassicModifiers, showsVengeanceModifiers } from '../logic';
import { CloseIcon } from './Icons';

interface RoundModalProps {
  players: Player[];
  draft: RoundDraft;
  setDraft: (d: RoundDraft) => void;
  ruleset: Ruleset;
  brutalMode: boolean;
  roundNumber: number;
  onCancel: () => void;
  onSave: () => void;
}

function isFilled(entry: RoundEntry): boolean {
  return (
    entry.bust ||
    entry.sum > 0 ||
    entry.modifiers.length > 0 ||
    entry.negModifiers.length > 0 ||
    entry.bonus ||
    entry.zero ||
    entry.divide2
  );
}

export default function RoundModal({
  players,
  draft,
  setDraft,
  ruleset,
  brutalMode,
  roundNumber,
  onCancel,
  onSave,
}: RoundModalProps) {
  const [activeId, setActiveId] = useState<string>(players[0]?.id ?? '');
  const showClassic = showsClassicModifiers(ruleset);
  const showVengeance = showsVengeanceModifiers(ruleset);

  function updateEntry(id: string, patch: Partial<RoundEntry>) {
    setDraft({ ...draft, [id]: { ...draft[id], ...patch } });
  }

  function toggleBust(id: string) {
    const entry = draft[id];
    if (entry.bust) {
      updateEntry(id, { bust: false });
    } else {
      // Ein Bust wirft alle Karten ab – Runde zählt garantiert 0 Punkte
      updateEntry(id, {
        bust: true,
        sum: 0,
        x2: false,
        modifiers: [],
        negModifiers: [],
        zero: false,
        divide2: false,
        bonus: false,
        bonusChoice: 'self',
        bonusTarget: null,
      });
    }
  }

  function toggleModifier(id: string, value: number, kind: 'modifiers' | 'negModifiers') {
    const list = draft[id][kind];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    updateEntry(id, { [kind]: next } as Partial<RoundEntry>);
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal round-modal">
        <div className="modal-header">
          <h2>Runde {roundNumber} eintragen</h2>
          <button className="icon-btn" aria-label="Schließen" onClick={onCancel}>
            <CloseIcon />
          </button>
        </div>

        <div className="player-tabs">
          {players.map((p) => {
            const entry = draft[p.id];
            const cls = ['player-tab'];
            if (p.id === activeId) cls.push('active');
            if (entry.bust) cls.push('bust');
            else if (isFilled(entry)) cls.push('done');
            return (
              <button key={p.id} className={cls.join(' ')} onClick={() => setActiveId(p.id)}>
                {p.name}
              </button>
            );
          })}
        </div>

        {players.map((p) => {
          const entry = draft[p.id];
          const total = calcEntryTotal(entry, brutalMode);
          const otherPlayers = players.filter((o) => o.id !== p.id);

          return (
            <div key={p.id} className={`score-form ${p.id === activeId ? 'active' : ''}`}>
              <button className={`bust-btn ${entry.bust ? 'active' : ''}`} onClick={() => toggleBust(p.id)}>
                {entry.bust ? 'Bust – 0 Punkte diese Runde' : 'Als Bust markieren (doppelte Zahl gezogen)'}
              </button>

              {!entry.bust && (
                <div className="bust-hideable">
                  {showVengeance && (
                    <div className="toggle-row">
                      <div>
                        <div className="toggle-label">Null-Karte</div>
                        <div className="toggle-sub">Score wird 0, außer durch Flip-7-Bonus</div>
                      </div>
                      <div
                        className={`switch ${entry.zero ? 'on' : ''}`}
                        onClick={() => updateEntry(p.id, { zero: !entry.zero })}
                      />
                    </div>
                  )}

                  <div style={{ marginTop: 16, opacity: entry.zero ? 0.4 : 1 }}>
                    <span className="field-label">Summe der Zahlenkarten</span>
                    <div className="number-input-row">
                      <button
                        className="stepper-btn"
                        disabled={entry.zero}
                        onClick={() => updateEntry(p.id, { sum: Math.max(0, entry.sum - 1) })}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={entry.sum}
                        disabled={entry.zero}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateEntry(p.id, { sum: isNaN(val) ? 0 : Math.max(0, val) });
                        }}
                      />
                      <button
                        className="stepper-btn"
                        disabled={entry.zero}
                        onClick={() => updateEntry(p.id, { sum: entry.sum + 1 })}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {entry.zero ? (
                    <div className="zero-note">
                      Null-Karte aktiv: Zahlenkarten &amp; Modifikatoren zählen nicht, nur der Flip-7-Bonus kann noch
                      Punkte bringen.
                    </div>
                  ) : (
                    <>
                      {showClassic && (
                        <>
                          <div style={{ marginTop: 16 }}>
                            <span className="field-label">Modifikator-Karten (+)</span>
                            <div className="chip-row">
                              {MODIFIER_OPTIONS.map((m) => (
                                <button
                                  key={m}
                                  className={`chip ${entry.modifiers.includes(m) ? 'selected' : ''}`}
                                  onClick={() => toggleModifier(p.id, m, 'modifiers')}
                                >
                                  +{m}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="toggle-row" style={{ marginTop: 12 }}>
                            <div>
                              <div className="toggle-label">x2-Karte</div>
                              <div className="toggle-sub">Verdoppelt nur die Zahlenkarten-Summe</div>
                            </div>
                            <div
                              className={`switch ${entry.x2 ? 'on' : ''}`}
                              onClick={() => updateEntry(p.id, { x2: !entry.x2 })}
                            />
                          </div>
                        </>
                      )}

                      {showVengeance && (
                        <>
                          <div style={{ marginTop: 16 }}>
                            <span className="field-label">Abzug-Karten (−)</span>
                            <div className="chip-row">
                              {MODIFIER_OPTIONS.map((m) => (
                                <button
                                  key={m}
                                  className={`chip negative ${entry.negModifiers.includes(m) ? 'selected' : ''}`}
                                  onClick={() => toggleModifier(p.id, m, 'negModifiers')}
                                >
                                  −{m}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="toggle-row" style={{ marginTop: 12 }}>
                            <div>
                              <div className="toggle-label">÷2-Karte</div>
                              <div className="toggle-sub">
                                Halbiert die Zahlenkarten-Summe (abgerundet), vor +/− Modifikatoren
                              </div>
                            </div>
                            <div
                              className={`switch ${entry.divide2 ? 'on' : ''}`}
                              onClick={() => updateEntry(p.id, { divide2: !entry.divide2 })}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="toggle-row" style={{ marginTop: 16 }}>
                    <div>
                      <div className="toggle-label">Flip-7-Bonus (+15)</div>
                      <div className="toggle-sub">7 verschiedene Zahlenkarten erreicht</div>
                    </div>
                    <div
                      className={`switch ${entry.bonus ? 'on' : ''}`}
                      onClick={() => updateEntry(p.id, { bonus: !entry.bonus })}
                    />
                  </div>

                  {entry.bonus && brutalMode && otherPlayers.length > 0 && (
                    <div className="bonus-choice">
                      <div className="bonus-choice-options">
                        <button
                          className={`bonus-radio ${entry.bonusChoice !== 'steal' ? 'active' : ''}`}
                          onClick={() => updateEntry(p.id, { bonusChoice: 'self' })}
                        >
                          Ich behalte die 15 Punkte
                        </button>
                        <button
                          className={`bonus-radio ${entry.bonusChoice === 'steal' ? 'active' : ''}`}
                          onClick={() =>
                            updateEntry(p.id, {
                              bonusChoice: 'steal',
                              bonusTarget: entry.bonusTarget ?? otherPlayers[0].id,
                            })
                          }
                        >
                          15 Punkte abziehen bei…
                        </button>
                      </div>
                      {entry.bonusChoice === 'steal' && (
                        <select
                          className="bonus-target-select"
                          value={entry.bonusTarget ?? otherPlayers[0].id}
                          onChange={(e) => updateEntry(p.id, { bonusTarget: e.target.value })}
                        >
                          {otherPlayers.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="round-total-preview" style={{ marginTop: 16 }}>
                    <span className="value">{total}</span>
                    <span className="label">
                      Punkte diese Runde
                      {entry.bonusChoice === 'steal' && entry.bonus && brutalMode ? ' (Bonus geht an Gegner)' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="modal-footer">
          <button className="ghost-btn" onClick={onCancel}>
            Abbrechen
          </button>
          <button className="primary-btn" onClick={onSave}>
            Runde speichern
          </button>
        </div>
      </div>
    </div>
  );
}
