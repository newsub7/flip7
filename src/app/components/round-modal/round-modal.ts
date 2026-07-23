import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modifier, type BonusChoice, type Player, type RoundEntry, type Ruleset } from '../../../types';
import { CLASSIC_MODIFIERS, CLASSIC_NUMBERS, MODIFIER_OPTIONS, VENGEANCE_MODIFIERS, VENGEANCE_NUMBERS, calcEntryTotal, showsClassicModifiers, showsVengeanceModifiers } from '../../../logic';
import { CloseIcon } from '../../icons';
import { StandingPlayer } from '../../game-state.service';

@Component({
  selector: 'app-round-modal',
  imports: [FormsModule, CloseIcon],
  templateUrl: './round-modal.html',
})
export class RoundModal {
  player = input.required<Player>();
  players = input.required<StandingPlayer[]>();
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
  readonly actualPoints = computed(() => this.calcActualPoints())

  // Hängt von ruleset() ab -> computed() statt eines normalen Felds, damit es sich
  // automatisch neu berechnet, wenn der Nutzer das Regelwerk wechselt.
  readonly numbers = computed<number[]>(() => {
    switch (this.ruleset()) {
      case 'classic':
        return CLASSIC_NUMBERS;
      case 'vengeance':
        return VENGEANCE_NUMBERS;
      case 'combined':
        // return [...new Set([...CLASSIC_NUMBERS, ...VENGEANCE_NUMBERS])].sort((a, b) => a - b);
        return [];
    }
  });

  readonly modifiers = computed<Modifier[]>(() => {
    switch (this.ruleset()) {
      case 'classic':
        return CLASSIC_MODIFIERS;
      case 'vengeance':
        return VENGEANCE_MODIFIERS;
      case 'combined':
        return [];
    }
  });

  calcActualPoints(): number {
    let p = this.players().find(x => x.id == this.player().id);
    if (!p)
      return 0;
        
    return p.total;
  }

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

  toggleModifier(modifier: Modifier): void {
    if (modifier.modifier == 'multiply') {
      this.update({ x2: !this.local().x2 });
      this.update({ divide2: false });
    }
      
    if (modifier.modifier == 'divide') {
      this.update({ x2: false });
      this.update({ divide2: !this.local().divide2})
    }
    
    const list = this.local().modifiers;
    const next = list.some(x => x.label === modifier.label) ? list.filter((v) => v.label !== modifier.label) : [...list, modifier];
    this.update({ modifiers: next} as Partial<RoundEntry>); 

  }

  setBonusChoice(choice: BonusChoice): void {
    if (choice === 'steal') {
      const target = this.local().bonusTarget ?? this.otherPlayers()[0]?.id ?? null;
      this.update({ bonusChoice: 'steal', bonusTarget: target });
    } else {
      this.update({ bonusChoice: 'self' });
    }
  }

  handleSave(): void {
    this.save.emit(this.local());
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.cancel.emit();
  }
}
