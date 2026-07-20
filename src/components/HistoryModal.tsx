import type { Player, Round } from '../types';
import { CloseIcon } from './Icons';

interface HistoryModalProps {
  players: Player[];
  rounds: Round[];
  onClose: () => void;
}

export default function HistoryModal({ players, rounds, onClose }: HistoryModalProps) {
  const byId = Object.fromEntries(players.map((p) => [p.id, p.name]));

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Rundenverlauf</h2>
          <button className="icon-btn" aria-label="Schließen" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="history-content">
          {rounds.length === 0 && <div className="history-empty">Noch keine Runden gespielt.</div>}

          {[...rounds].reverse().map((round, idx) => {
            const roundNumber = rounds.length - idx;
            const stolenFrom: Record<string, number> = {};
            Object.values(round.scores).forEach((s) => {
              if (s.bonusTarget) stolenFrom[s.bonusTarget] = (stolenFrom[s.bonusTarget] || 0) + 15;
            });

            return (
              <div className="history-round" key={round.timestamp}>
                <div className="history-round-header">
                  <span>Runde {roundNumber}</span>
                </div>
                {Object.entries(round.scores).map(([pid, s]) => {
                  const name = byId[pid] || '(entfernt)';
                  let breakdown: string;
                  if (s.bust) {
                    breakdown = 'Bust';
                  } else if (s.zero) {
                    breakdown = s.bonus ? 'Null-Karte · +15 Flip7' : 'Null-Karte';
                  } else {
                    const parts = [`${s.sum} Zahlen`];
                    if (s.x2) parts.push('×2');
                    if (s.divide2) parts.push('÷2');
                    if (s.modifiers.length) parts.push(`+${s.modifiers.reduce((a, b) => a + b, 0)} Mod.`);
                    if (s.negModifiers.length) parts.push(`−${s.negModifiers.reduce((a, b) => a + b, 0)} Mod.`);
                    if (s.bonus && s.bonusTarget) parts.push('Flip7-Bonus abgegeben');
                    else if (s.bonus) parts.push('+15 Flip7');
                    breakdown = parts.join(' · ');
                  }
                  if (stolenFrom[pid]) {
                    breakdown += (breakdown ? ' · ' : '') + `−${stolenFrom[pid]} (Bonus gestohlen)`;
                  }

                  return (
                    <div className="history-row" key={pid}>
                      <div>
                        <div>{name}</div>
                        <div className="breakdown">{breakdown}</div>
                      </div>
                      <div className={`val ${s.bust ? 'bust' : ''}`}>{s.total}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
