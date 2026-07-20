import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface StandingPlayer {
  id: string;
  name: string;
  total: number;
}

interface StandingsProps {
  players: StandingPlayer[];
  roundsPlayed: number;
  targetScore: number;
}

const COLORS = ['#F2B705', '#2DD4BF', '#E5484D', '#7C9CF2', '#F28B05', '#A98DF2'];

type RankColorStyle = CSSProperties & { '--rank-color'?: string };

export default function Standings({ players, roundsPlayed, targetScore }: StandingsProps) {
  const prevTotals = useRef<Record<string, number>>({});
  const [flipping, setFlipping] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const changed: string[] = [];
    players.forEach((p) => {
      const prev = prevTotals.current[p.id];
      if (prev !== undefined && prev !== p.total) changed.push(p.id);
      prevTotals.current[p.id] = p.total;
    });
    if (changed.length === 0) return;

    setFlipping((f) => {
      const next = { ...f };
      changed.forEach((id) => { next[id] = true; });
      return next;
    });
    const timer = setTimeout(() => {
      setFlipping((f) => {
        const next = { ...f };
        changed.forEach((id) => { next[id] = false; });
        return next;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [players]);

  return (
    <section className="standings" aria-label="Punktestand">
      {players.map((p, i) => {
        const pct = Math.max(0, Math.min(100, (p.total / targetScore) * 100));
        const isLeader = i === 0 && p.total > 0;
        const color = COLORS[i % COLORS.length];
        const style: RankColorStyle = { '--rank-color': color };

        return (
          <div key={p.id} className={`player-card ${isLeader ? 'leader' : ''}`} style={style}>
            <div className="rank-badge">{i + 1}</div>
            <div className="name-block">
              <div className="name">{p.name}</div>
              <div className="sub">
                {roundsPlayed} {roundsPlayed === 1 ? 'Runde' : 'Runden'} gespielt
              </div>
            </div>
            <div className={`score ${flipping[p.id] ? 'flipping' : ''}`}>{p.total}</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
