import { Component, inject, output } from '@angular/core';
import { GearIcon, HistoryIcon, MoonIcon, PeopleIcon, SunIcon } from '../../icons';
import { ThemeService } from '../../theme.service';

@Component({
  selector: 'app-header',
  imports: [HistoryIcon, PeopleIcon, GearIcon, SunIcon, MoonIcon],
  templateUrl: './header.html',
})
export class Header {
  protected readonly themeService = inject(ThemeService);

  history = output<void>();
  players = output<void>();
  settings = output<void>();
}
