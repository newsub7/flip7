import { Component, computed, inject, signal } from '@angular/core';
import { GameStateService } from './game-state.service';
import type { RoundDraft, RoundEntry, Ruleset } from '../types';
import { createEmptyEntry } from '../logic';
import type { WinnerInfo } from '../logic';
import { Header } from './components/header/header';
import { TargetBar } from './components/target-bar/target-bar';
import { Standings } from './components/standings/standings';
import { EmptyState } from './components/empty-state/empty-state';
import { RoundModal } from './components/round-modal/round-modal';
import { PlayersModal } from './components/players-modal/players-modal';
import { HistoryModal } from './components/history-modal/history-modal';
import { SettingsModal } from './components/settings-modal/settings-modal';
import { WinnerOverlay } from './components/winner-overlay/winner-overlay';
import { Toast } from './components/toast/toast';

type ModalKind = null | 'players' | 'history' | 'settings';

@Component({
  selector: 'app-root',
  imports: [
    Header,
    TargetBar,
    Standings,
    EmptyState,
    RoundModal,
    PlayersModal,
    HistoryModal,
    SettingsModal,
    WinnerOverlay,
    Toast,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly game = inject(GameStateService);

  protected readonly openModal = signal<ModalKind>(null);
  protected readonly winner = signal<WinnerInfo | null>(null);
  protected readonly toast = signal<string | null>(null);

  // Laufende, noch nicht abgeschlossene Runde: Spieler tragen ihre Punkte nacheinander über
  // den Button auf ihrer Karte ein; sobald alle aktuellen Spieler eingetragen haben, wird die
  // Runde automatisch abgeschlossen und gespeichert.
  protected readonly roundDraft = signal<RoundDraft>({});
  protected readonly submittedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly activePlayerId = signal<string | null>(null);

  protected readonly activePlayer = computed(
    () => this.game.players().find((p) => p.id === this.activePlayerId()) ?? null,
  );
  protected readonly activeOtherPlayers = computed(() =>
    this.game.players().filter((p) => p.id !== this.activePlayerId()),
  );
  protected readonly activeEntry = computed<RoundEntry>(
    () => this.roundDraft()[this.activePlayerId() ?? ''] ?? createEmptyEntry(),
  );

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        /* Offline-Support ist ein Nice-to-have, kein Blocker */
      });
    }
  }

  private showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2200);
  }

  protected addPlayer(name: string): void {
    this.game.addPlayer(name);
  }

  protected renamePlayer(e: { id: string; name: string }): void {
    this.game.renamePlayer(e.id, e.name);
  }

  protected removePlayer(id: string): void {
    this.game.removePlayer(id);

    const draft = { ...this.roundDraft() };
    delete draft[id];
    this.roundDraft.set(draft);

    const submitted = new Set(this.submittedIds());
    submitted.delete(id);
    this.submittedIds.set(submitted);

    this.maybeFinalizeRound();
  }

  protected startNewGame(): void {
    this.game.startNewGame();
    this.roundDraft.set({});
    this.submittedIds.set(new Set());
    this.activePlayerId.set(null);
    this.openModal.set(null);
    this.showToast('Neues Spiel gestartet');
  }

  protected openRoundEntry(playerId: string): void {
    this.activePlayerId.set(playerId);
  }

  protected closeRoundEntry(): void {
    this.activePlayerId.set(null);
  }

  protected saveRoundEntry(entry: RoundEntry): void {
    const id = this.activePlayerId();
    if (!id) return;

    this.roundDraft.set({ ...this.roundDraft(), [id]: entry });
    this.submittedIds.set(new Set(this.submittedIds()).add(id));
    this.activePlayerId.set(null);

    this.maybeFinalizeRound();
  }

  /** Schließt die laufende Runde automatisch ab, sobald jeder aktuelle Spieler eingetragen hat. */
  private maybeFinalizeRound(): void {
    const allIds = this.game.players().map((p) => p.id);
    if (allIds.length === 0) return;

    const submitted = this.submittedIds();
    if (!allIds.every((id) => submitted.has(id))) return;

    const w = this.game.saveRound(this.roundDraft());
    this.roundDraft.set({});
    this.submittedIds.set(new Set());
    if (w) this.winner.set(w);
  }

  protected updateSettings(next: { targetScore: number; ruleset: Ruleset; brutalMode: boolean }): void {
    this.game.updateSettings(next);
    this.openModal.set(null);
  }

  protected winnerNames(w: WinnerInfo): string {
    return w.players.map((p) => p.name).join(' & ');
  }
}
