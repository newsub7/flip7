import { Component, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
})
export class EmptyState {
  addPlayer = output<void>();
}
