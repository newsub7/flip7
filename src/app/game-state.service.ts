import { Injectable, computed, effect, signal } from '@angular/core';
import type { GameState, Player, Round, RoundDraft, Ruleset } from '../types';
import { createDefaultState, finalizeRound, findWinners, loadState, saveState, totalFor } from '../logic';
import type { WinnerInfo } from '../logic';

export interface StandingPlayer extends Player {
  total: number;
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly state = signal<GameState>(loadState());

  readonly players = computed(() => this.state().players);
  readonly rounds = computed(() => this.state().rounds);
  readonly targetScore = computed(() => this.state().targetScore);
  readonly ruleset = computed(() => this.state().ruleset);
  readonly brutalMode = computed(() => this.state().brutalMode);

  readonly standings = computed<StandingPlayer[]>(() => {
    const s = this.state();
    return [...s.players].map((p) => ({ ...p, total: totalFor(s, p.id) })).sort((a, b) => b.total - a.total);
  });

  constructor() {
    effect(() => {
      saveState(this.state());
    });
  }

  addPlayer(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.state.update((s) => ({
      ...s,
      players: [...s.players, { id: `p${s.nextPlayerId}`, name: trimmed }],
      nextPlayerId: s.nextPlayerId + 1,
    }));
  }

  renamePlayer(id: string, name: string): void {
    this.state.update((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  removePlayer(id: string): void {
    this.state.update((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== id),
      rounds: s.rounds.map((r) => {
        const scores = { ...r.scores };
        delete scores[id];
        return { ...r, scores };
      }),
    }));
  }

  startNewGame(): void {
    this.state.update((s) => ({ ...createDefaultState(), targetScore: s.targetScore }));
  }

  /** Speichert die Runde und liefert Gewinner-Infos, falls das Zielscore erreicht wurde. */
  saveRound(draft: RoundDraft): WinnerInfo | null {
    const round: Round = finalizeRound(draft, this.brutalMode());
    this.state.update((s) => ({ ...s, rounds: [...s.rounds, round] }));
    return findWinners(this.state());
  }

  updateSettings(next: { targetScore: number; ruleset: Ruleset; brutalMode: boolean }): void {
    this.state.update((s) => ({ ...s, ...next }));
  }
}
