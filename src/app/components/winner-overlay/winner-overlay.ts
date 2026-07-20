import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-winner-overlay',
  templateUrl: './winner-overlay.html',
})
export class WinnerOverlay {
  names = input.required<string>();
  score = input.required<number>();
  close = output<void>();
}
