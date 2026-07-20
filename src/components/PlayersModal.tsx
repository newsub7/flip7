import { useState } from 'react';
import type { Player } from '../types';
import { CloseIcon, TrashIcon } from './Icons';

interface PlayersModalProps {
  players: Player[];
  hasRounds: boolean;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onNewGame: () => void;
  onClose: () => void;
}

export default function PlayersModal({
  players,
  hasRounds,
  onAdd,
  onRename,
  onRemove,
  onNewGame,
  onClose,
}: PlayersModalProps) {
  const [newName, setNewName] = useState('');

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName('');
  }

  function handleRemove(id: string, name: string) {
    if (hasRounds && !window.confirm(`${name} entfernen? Bisherige Rundenpunkte dieses Spielers gehen verloren.`)) {
      return;
    }
    onRemove(id);
  }

  function handleNewGame() {
    if (!window.confirm('Neues Spiel starten? Alle Spieler und Runden werden gelöscht.')) return;
    onNewGame();
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>Spieler verwalten</h2>
          <button className="icon-btn" aria-label="Schließen" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <ul className="player-list">
          {players.length === 0 && (
            <li style={{ color: 'var(--text-muted)', justifyContent: 'center' }}>Noch keine Spieler</li>
          )}
          {players.map((p) => (
            <li key={p.id}>
              <input
                type="text"
                defaultValue={p.name}
                maxLength={20}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== p.name) onRename(p.id, value);
                  else e.target.value = p.name;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
              />
              <button
                className="remove-btn icon-btn"
                aria-label="Spieler entfernen"
                onClick={() => handleRemove(p.id, p.name)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>

        <div className="add-player-row">
          <input
            type="text"
            placeholder="Name des Spielers"
            maxLength={20}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <button className="primary-btn small" onClick={handleAdd}>
            Hinzufügen
          </button>
        </div>

        <div className="modal-footer">
          <button className="danger-ghost-btn" onClick={handleNewGame}>
            Neues Spiel (alles zurücksetzen)
          </button>
        </div>
      </div>
    </div>
  );
}
