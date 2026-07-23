export type Ruleset = 'classic' | 'vengeance' | 'combined';
export type BonusChoice = 'self' | 'steal';

export type ModifierKind = 'plus' | 'minus' | 'multiply' | 'divide';

export interface Player {
  id: string;
  name: string;
}

export interface RoundEntry {
  sum: number; // Summe der Zahlenkarten
  x2: boolean; // klassische x2-Karte
  cards: number[];
  modifiers: Modifier[]; // Modifikatoren
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

export interface Modifier {
  label: string;
  value: number;
  modifier: ModifierKind;
}

// Entwurf während der Eingabe einer neuen (noch nicht gespeicherten) Runde
export type RoundDraft = Record<string, RoundEntry>;
