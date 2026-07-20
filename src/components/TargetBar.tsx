import type { Ruleset } from '../types';
import { RULESET_LABELS } from '../logic';

interface TargetBarProps {
  targetScore: number;
  ruleset: Ruleset;
  brutalMode: boolean;
  onOpenSettings: () => void;
}

export default function TargetBar({ targetScore, ruleset, brutalMode, onOpenSettings }: TargetBarProps) {
  const badgeClass = ruleset === 'classic' ? 'mode-classic' : ruleset === 'combined' ? 'mode-combined' : '';

  return (
    <section className="target-bar">
      <span>Zielpunktzahl</span>
      <strong>{targetScore}</strong>
      <span className={`ruleset-badge ${badgeClass}`}>
        {RULESET_LABELS[ruleset]}
        {brutalMode ? ' · Brutal' : ''}
      </span>
      <button className="link-btn" onClick={onOpenSettings}>
        Einstellungen
      </button>
    </section>
  );
}
