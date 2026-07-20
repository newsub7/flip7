import { Component, inject, signal } from '@angular/core';
import { GameStateService } from './game-state.service';
import type { RoundDraft, Ruleset } from '../types';
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
import { PlusIcon } from './icons';

type ModalKind = null | 'round' | 'players' | 'history' | 'settings';

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
    PlusIcon,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly game = inject(GameStateService);

  protected readonly openModal = signal<ModalKind>(null);
  protected readonly draft = signal<RoundDraft | null>(null);
  protected readonly winner = signal<WinnerInfo | null>(null);
  protected readonly toast = signal<string | null>(null);

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
  }

  protected startNewGame(): void {
    this.game.startNewGame();
    this.openModal.set(null);
    this.showToast('Neues Spiel gestartet');
  }

  protected openRoundModal(): void {
    const players = this.game.players();
    if (players.length === 0) return;
    const d: RoundDraft = {};
    players.forEach((p) => {
      d[p.id] = createEmptyEntry();
    });
    this.draft.set(d);
    this.openModal.set('round');
  }

  protected closeRoundModal(): void {
    this.openModal.set(null);
    this.draft.set(null);
  }

  protected saveRound(): void {
    const d = this.draft();
    if (!d) return;
    const w = this.game.saveRound(d);
    this.openModal.set(null);
    this.draft.set(null);
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
