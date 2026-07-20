import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Player } from '../../types';
import { CloseIcon, TrashIcon } from '../../icons';

@Component({
  selector: 'app-players-modal',
  imports: [FormsModule, CloseIcon, TrashIcon],
  templateUrl: './players-modal.html',
})
export class PlayersModal {
  players = input.required<Player[]>();
  hasRounds = input.required<boolean>();
  add = output<string>();
  rename = output<{ id: string; name: string }>();
  remove = output<string>();
  newGame = output<void>();
  close = output<void>();

  newName = '';

  handleAdd(): void {
    if (!this.newName.trim()) return;
    this.add.emit(this.newName);
    this.newName = '';
  }

  handleRename(id: string, currentName: string, inputEl: HTMLInputElement): void {
    const value = inputEl.value.trim();
    if (value && value !== currentName) this.rename.emit({ id, name: value });
    else inputEl.value = currentName;
  }

  handleRemove(id: string, name: string): void {
    if (
      this.hasRounds() &&
      !window.confirm(`${name} entfernen? Bisherige Rundenpunkte dieses Spielers gehen verloren.`)
    ) {
      return;
    }
    this.remove.emit(id);
  }

  handleNewGame(): void {
    if (!window.confirm('Neues Spiel starten? Alle Spieler und Runden werden gelöscht.')) return;
    this.newGame.emit();
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
