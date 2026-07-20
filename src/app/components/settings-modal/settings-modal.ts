import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Ruleset } from '../../types';
import { RULESET_HINTS, RULESET_LABELS } from '../../logic';
import { CloseIcon } from '../../icons';

const RULESETS: Ruleset[] = ['classic', 'vengeance', 'combined'];

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

  target = this.targetScore();
  rs: Ruleset = this.ruleset();
  brutal = this.brutalMode();

  handleRulesetClick(next: Ruleset): void {
    this.rs = next;
    if (next === 'classic') this.brutal = false;
  }

  handleSave(): void {
    const val = Number.isFinite(this.target) && this.target > 0 ? this.target : this.targetScore();
    this.save.emit({ targetScore: val, ruleset: this.rs, brutalMode: this.rs === 'classic' ? false : this.brutal });
  }

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close.emit();
  }
}
