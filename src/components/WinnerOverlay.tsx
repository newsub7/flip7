interface WinnerOverlayProps {
  names: string;
  score: number;
  onClose: () => void;
}

export default function WinnerOverlay({ names, score, onClose }: WinnerOverlayProps) {
  return (
    <div className="winner-overlay">
      <div className="winner-card">
        <div className="winner-flip">🏆</div>
        <h2>{names}</h2>
        <p>
          gewinnt mit <span>{score}</span> Punkten!
        </p>
        <button className="primary-btn" onClick={onClose}>
          Weiter
        </button>
      </div>
    </div>
  );
}
