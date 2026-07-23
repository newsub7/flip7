import { Component, computed, input, output } from '@angular/core';
import type { Player, Round } from '../../../types';
import { CloseIcon } from '../../icons';

interface HistoryRow {
  pid: string;
  name: string;
  breakdown: string;
  total: number;
  bust: boolean;
}

interface HistoryRoundView {
  timestamp: number;
  roundNumber: number;
  rows: HistoryRow[];
}

@Component({
  selector: 'app-history-modal',
  imports: [CloseIcon],
  templateUrl: './history-modal.html',
})
export class HistoryModal {
  players = input.required<Player[]>();
  rounds = input.required<Round[]>();
  close = output<void>();

  readonly viewRounds = computed<HistoryRoundView[]>(() => {
    const players = this.players();
    const rounds = this.rounds();
    const byId = Object.fromEntries(players.map((p) => [p.id, p.name]));


    const result = [...rounds].reverse().map((round, idx) => {
      const roundNumber = rounds.length - idx;
      const stolenFrom: Record<string, number> = {};
      Object.values(round.scores).forEach((s) => {
        if (s.bonusTarget) stolenFrom[s.bonusTarget] = (stolenFrom[s.bonusTarget] || 0) + 15;
      });

      const rows: HistoryRow[] = Object.entries(round.scores).map(([pid, s]) => {
        const name = byId[pid] || '(entfernt)';
        let breakdown: string;
        if (s.bust) {
          breakdown = 'Bust';
        } else if (s.zero) {
          breakdown = s.bonus ? 'Null-Karte · +15 Flip7' : 'Null-Karte';
        } else {
          const parts = [`${s.cards.reduce((a, b) => a + b, 0)} Zahlen`];
          // if (s.x2) parts.push('×2');
          // if (s.divide2) parts.push('÷2');
          if (s.modifiers.length) {
            parts.push(`${s.modifiers.map(x => x.label).join(', ')}`)
          }
          if (s.bonus && s.bonusTarget) parts.push('Flip7-Bonus abgegeben');
          else if (s.bonus) parts.push('+15 Flip7');
          breakdown = parts.join(' · ');
        }
        if (stolenFrom[pid]) {
          breakdown += (breakdown ? ' · ' : '') + `−${stolenFrom[pid]} (Bonus gestohlen)`;
        }
        return { pid, name, breakdown, total: s.total, bust: s.bust };
      });

      return { timestamp: round.timestamp, roundNumber, rows };
    });

    return result;
  });

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
