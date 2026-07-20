import { Component, input } from '@angular/core';

@Component({
  selector: 'app-toast',
  template: `<div class="toast">{{ message() }}</div>`,
})
export class Toast {
  message = input.required<string>();
}
