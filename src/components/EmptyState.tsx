interface EmptyStateProps {
  onAddPlayer: () => void;
}

export default function EmptyState({ onAddPlayer }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-card">7</div>
      <h2>Noch keine Spieler</h2>
      <p>Füge Mitspieler hinzu, um die erste Runde zu zählen.</p>
      <button className="primary-btn" onClick={onAddPlayer}>
        Spieler hinzufügen
      </button>
    </div>
  );
}
