import { GearIcon, HistoryIcon, PeopleIcon } from './Icons';

interface HeaderProps {
  onHistory: () => void;
  onPlayers: () => void;
  onSettings: () => void;
}

export default function Header({ onHistory, onPlayers, onSettings }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          7
        </span>
        <div className="brand-text">
          <h1>Flip 7</h1>
          <p>Punktezähler</p>
        </div>
      </div>
      <div className="header-actions">
        <button className="icon-btn" title="Rundenverlauf" aria-label="Rundenverlauf anzeigen" onClick={onHistory}>
          <HistoryIcon />
        </button>
        <button className="icon-btn" title="Spieler verwalten" aria-label="Spieler verwalten" onClick={onPlayers}>
          <PeopleIcon />
        </button>
        <button className="icon-btn" title="Einstellungen" aria-label="Einstellungen" onClick={onSettings}>
          <GearIcon />
        </button>
      </div>
    </header>
  );
}
