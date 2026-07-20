import { Component, computed, input, output } from '@angular/core';
import type { Ruleset } from '../../types';
import { RULESET_LABELS } from '../../logic';

@Component({
  selector: 'app-target-bar',
  templateUrl: './target-bar.html',
})
export class TargetBar {
  targetScore = input.required<number>();
  ruleset = input.required<Ruleset>();
  brutalMode = input.required<boolean>();
  openSettings = output<void>();

  badgeClass = computed(() => {
    const r = this.ruleset();
    return r === 'classic' ? 'mode-classic' : r === 'combined' ? 'mode-combined' : '';
  });

  rulesetLabel = computed(() => RULESET_LABELS[this.ruleset()]);
}
