import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { BonusChoice, Player, RoundDraft, RoundEntry, Ruleset } from '../../../types';
import { MODIFIER_OPTIONS, calcEntryTotal, showsClassicModifiers, showsVengeanceModifiers } from '../../../logic';
import { CloseIcon } from '../../icons';

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

@Component({
  selector: 'app-round-modal',
  imports: [FormsModule, CloseIcon],
  templateUrl: './round-modal.html',
})
export class RoundModal {
  players = input.required<Player[]>();
  draft = input.required<RoundDraft>();
  ruleset = input.required<Ruleset>();
  brutalMode = input.required<boolean>();
  roundNumber = input.required<number>();

  draftChange = output<RoundDraft>();
  cancel = output<void>();
  save = output<void>();

  readonly modifierOptions = MODIFIER_OPTIONS;

  private readonly activeId = signal<string | null>(null);
  readonly effectiveActiveId = computed(() => this.activeId() ?? this.players()[0]?.id ?? '');

  readonly showClassic = computed(() => showsClassicModifiers(this.ruleset()));
  readonly showVengeance = computed(() => showsVengeanceModifiers(this.ruleset()));

  setActive(id: string): void {
    this.activeId.set(id);
  }

  tabClass(p: Player): string {
    const entry = this.draft()[p.id];
    const cls = ['player-tab'];
    if (p.id === this.effectiveActiveId()) cls.push('active');
    if (entry.bust) cls.push('bust');
    else if (isFilled(entry)) cls.push('done');
    return cls.join(' ');
  }

  entryFor(id: string): RoundEntry {
    return this.draft()[id];
  }

  total(entry: RoundEntry): number {
    return calcEntryTotal(entry, this.brutalMode());
  }

  otherPlayers(id: string): Player[] {
    return this.players().filter((o) => o.id !== id);
  }

  updateEntry(id: string, patch: Partial<RoundEntry>): void {
    const d = this.draft();
    this.draftChange.emit({ ...d, [id]: { ...d[id], ...patch } });
  }

  toggleBust(id: string): void {
    const entry = this.draft()[id];
    if (entry.bust) {
      this.updateEntry(id, { bust: false });
    } else {
      this.updateEntry(id, {
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

  toggleModifier(id: string, value: number, kind: 'modifiers' | 'negModifiers'): void {
    const list = this.draft()[id][kind];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    this.updateEntry(id, { [kind]: next } as Partial<RoundEntry>);
  }

  setBonusChoice(id: string, choice: BonusChoice): void {
    if (choice === 'steal') {
      const target = this.draft()[id].bonusTarget ?? this.otherPlayers(id)[0]?.id ?? null;
      this.updateEntry(id, { bonusChoice: 'steal', bonusTarget: target });
    } else {
      this.updateEntry(id, { bonusChoice: 'self' });
    }
  }

  decSum(id: string, entry: RoundEntry): void {
    this.updateEntry(id, { sum: Math.max(0, entry.sum - 1) });
  }

  incSum(id: string, entry: RoundEntry): void {
    this.updateEntry(id, { sum: entry.sum + 1 });
  }

  onSumInput(id: string, value: string): void {
    const val = parseInt(value, 10);
    this.updateEntry(id, { sum: isNaN(val) ? 0 : Math.max(0, val) });
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.cancel.emit();
  }
}
