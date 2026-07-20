import { Component, output } from '@angular/core';
import { GearIcon, HistoryIcon, PeopleIcon } from '../../icons';

@Component({
  selector: 'app-header',
  imports: [HistoryIcon, PeopleIcon, GearIcon],
  templateUrl: './header.html',
})
export class Header {
  history = output<void>();
  players = output<void>();
  settings = output<void>();
}
