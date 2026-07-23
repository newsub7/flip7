import { Component, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Ruleset } from '../../../types';
import { RULESET_HINTS, RULESET_LABELS } from '../../../logic';
import { CloseIcon } from '../../icons';

// 'combined' ist aktuell deaktiviert und daher hier nicht wählbar.
const RULESETS: Ruleset[] = ['classic', 'vengeance'];

@Component({
  selector: 'app-settings-modal',
  imports: [FormsModule, CloseIcon],
  templateUrl: './settings-modal.html',
})
export class SettingsModal {
  targetScore = input.required<number>();
  ruleset = input.required<Ruleset>();
  brutalMode = input.required<boolean>();
  save = output<{ targetScore: number; ruleset: Ruleset; brutalMode: boolean }>();
  close = output<void>();

  readonly rulesets = RULESETS;
  readonly labels = RULESET_LABELS;
  readonly hints = RULESET_HINTS;

  readonly target = linkedSignal(() => this.targetScore());
  readonly rs = linkedSignal(() => this.ruleset());
  readonly brutal = linkedSignal(() => this.brutalMode());

  handleRulesetClick(next: Ruleset): void {
    this.rs.set(next);
    if (next === 'classic') this.brutal.set(false);
  }

  handleSave(): void {
    const t = this.target();
    const val = Number.isFinite(t) && t > 0 ? t : this.targetScore();
    this.save.emit({
      targetScore: val,
      ruleset: this.rs(),
      brutalMode: this.rs() === 'classic' ? false : this.brutal(),
    });
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
