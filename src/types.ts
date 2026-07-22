export type Ruleset = 'classic' | 'vengeance' | 'combined';
export type BonusChoice = 'self' | 'steal';

export interface Player {
  id: string;
  name: string;
}

export interface RoundEntry {
  sum: number; // Summe der Zahlenkarten
  x2: boolean; // klassische x2-Karte
  cards: number[];
  modifiers: number[]; // klassische Modifikatoren +2 bis +10
  negModifiers: number[]; // Vengeance-Modifikatoren -2 bis -10
  zero: boolean; // Vengeance Null-Karte
  divide2: boolean; // Vengeance ÷2-Karte
  bonus: boolean; // Flip-7-Bonus erzielt (7 unterschiedliche Zahlenkarten)
  bonusChoice: BonusChoice; // 'self' behalten oder 'steal' einem Gegner abziehen (Brutal Mode)
  bonusTarget: string | null; // Ziel-Spieler-ID, falls bonusChoice === 'steal'
  bust: boolean; // doppelte Zahl gezogen -> 0 Punkte
  total: number; // final berechneter Rundenscore dieses Spielers (ohne fremde Diebstähle an ihm)
}

export interface Round {
  scores: Record<string, RoundEntry>;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  rounds: Round[];
  targetScore: number;
  nextPlayerId: number;
  ruleset: Ruleset;
  brutalMode: boolean;
}

// Entwurf während der Eingabe einer neuen (noch nicht gespeicherten) Runde
export type RoundDraft = Record<string, RoundEntry>;
