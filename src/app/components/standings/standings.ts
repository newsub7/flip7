import { Component, effect, input, output, signal } from '@angular/core';
import type { StandingPlayer } from '../../game-state.service';
import { CheckIcon, PlusIcon } from '../../icons';

const COLORS = ['#F2B705', '#2DD4BF', '#E5484D', '#7C9CF2', '#F28B05', '#A98DF2'];

@Component({
  selector: 'app-standings',
  imports: [PlusIcon, CheckIcon],
  templateUrl: './standings.html',
})
export class Standings {
  players = input.required<StandingPlayer[]>();
  roundsPlayed = input.required<number>();
  targetScore = input.required<number>();
  submittedIds = input.required<ReadonlySet<string>>();
  enterRound = output<string>();

  readonly flipping = signal<Record<string, boolean>>({});
  private prevTotals: Record<string, number> = {};

  constructor() {
    effect(() => {
      const players = this.players();
      const changed: string[] = [];
      players.forEach((p) => {
        const prev = this.prevTotals[p.id];
        if (prev !== undefined && prev !== p.total) changed.push(p.id);
        this.prevTotals[p.id] = p.total;
      });
      if (changed.length === 0) return;

      this.flipping.update((f) => {
        const next = { ...f };
        changed.forEach((id) => (next[id] = true));
        return next;
      });
      setTimeout(() => {
        this.flipping.update((f) => {
          const next = { ...f };
          changed.forEach((id) => (next[id] = false));
          return next;
        });
      }, 500);
    });
  }

  color(i: number): string {
    return COLORS[i % COLORS.length];
  }

  pct(total: number): number {
    return Math.max(0, Math.min(100, (total / this.targetScore()) * 100));
  }
}
