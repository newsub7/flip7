import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { BonusChoice, Player, RoundEntry, Ruleset } from '../../../types';
import { CLASSIC_NUMBERS, MODIFIER_OPTIONS, VENGEANCE_NUMBERS, calcEntryTotal, showsClassicModifiers, showsVengeanceModifiers } from '../../../logic';
import { CloseIcon } from '../../icons';

@Component({
  selector: 'app-round-modal',
  imports: [FormsModule, CloseIcon],
  templateUrl: './round-modal.html',
})
export class RoundModal {
  player = input.required<Player>();
  otherPlayers = input.required<Player[]>();
  entry = input.required<RoundEntry>();
  ruleset = input.required<Ruleset>();
  brutalMode = input.required<boolean>();
  roundNumber = input.required<number>();

  save = output<RoundEntry>();
  cancel = output<void>();

  readonly modifierOptions = MODIFIER_OPTIONS;  
  
  readonly local = linkedSignal(() => this.entry());

  readonly showClassic = computed(() => showsClassicModifiers(this.ruleset()));
  readonly showVengeance = computed(() => showsVengeanceModifiers(this.ruleset()));
  readonly total = computed(() => calcEntryTotal(this.local(), this.brutalMode()));

  // Hängt von ruleset() ab -> computed() statt eines normalen Felds, damit es sich
  // automatisch neu berechnet, wenn der Nutzer das Regelwerk wechselt.
  readonly numbers = computed<number[]>(() => {
    switch (this.ruleset()) {
      case 'classic':
        return CLASSIC_NUMBERS;
      case 'vengeance':
        return VENGEANCE_NUMBERS;
      case 'combined':
        return [...new Set([...CLASSIC_NUMBERS, ...VENGEANCE_NUMBERS])].sort((a, b) => a - b);
    }
  });

  update(patch: Partial<RoundEntry>): void {
    this.local.update((e) => ({ ...e, ...patch }));
  }

  toggleBust(): void {
    const e = this.local();
    if (e.bust) {
      this.update({ bust: false });
    } else {
      this.update({
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

  toggleNumber(value: number): void {
    const list = this.local().cards;
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    this.update({cards: next} as Partial<RoundEntry>);

    if (this.local().cards.length === 7) {
      this.update({zero: false});
      this.update({bonus: true});      
    } else {
      this.update({bonus: false});
      let zero: boolean = this.local().cards.includes(0) && this.showVengeance() ? true : false;
      this.update({zero: zero});
    }
    
  }

  toggleModifier(value: number, kind: 'modifiers' | 'negModifiers'): void {
    console.log(value);
    console.log(kind);
    const list = this.local()[kind];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    this.update({ [kind]: next } as Partial<RoundEntry>);
  }

  setBonusChoice(choice: BonusChoice): void {
    if (choice === 'steal') {
      const target = this.local().bonusTarget ?? this.otherPlayers()[0]?.id ?? null;
      this.update({ bonusChoice: 'steal', bonusTarget: target });
    } else {
      this.update({ bonusChoice: 'self' });
    }
  }

  decSum(): void {
    this.update({ sum: Math.max(0, this.local().sum - 1) });
  }

  incSum(): void {
    this.update({ sum: this.local().sum + 1 });
  }

  onSumInput(value: string): void {
    const val = parseInt(value, 10);
    this.update({ sum: isNaN(val) ? 0 : Math.max(0, val) });
  }

  handleSave(): void {
    this.save.emit(this.local());
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.cancel.emit();
  }
}
