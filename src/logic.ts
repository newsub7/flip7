import type { GameState, Modifier, Player, Round, RoundDraft, RoundEntry, Ruleset } from './types';

export const STORAGE_KEY = 'flip7-state-v1';
export const MODIFIER_OPTIONS = [2, 4, 6, 8, 10] as const;
export const CLASSIC_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ,10, 11, 12];
export const VENGEANCE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ,10, 11, 12, 13];

export const RULESET_LABELS: Record<Ruleset, string> = {
  classic: 'Klassisch',
  vengeance: 'With a Vengeance',
  combined: 'Kombiniert',
};

export const CLASSIC_MODIFIERS: Modifier[] = [
  {label: '+2', value: 2, modifier: 'plus'},
  {label: '+4', value: 4, modifier: 'plus'},
  {label: '+6', value: 6, modifier: 'plus'},
  {label: '+8', value: 8, modifier: 'plus'},
  {label: '+10', value: 10, modifier: 'plus'},
  {label: 'x2', value: 2, modifier: 'multiply'}
];

export const VENGEANCE_MODIFIERS: Modifier[] = [
  {label: '-2', value: 2, modifier: 'minus'},
  {label: '-4', value: 4, modifier: 'minus'},
  {label: '-6', value: 6, modifier: 'minus'},
  {label: '-8', value: 8, modifier: 'minus'},
  {label: '-10', value: 10, modifier: 'minus'},
  {label: '÷2', value: 2, modifier: 'divide'}
];

export const RULESET_HINTS: Record<Ruleset, string> = {
  classic: 'Original-Regeln: Modifikatoren +2 bis +10 und x2-Karte.',
  vengeance:
    'Erweiterung "With a Vengeance": −2 bis −10, ÷2-Karte und Null-Karte statt der Original-Modifikatoren.',
  combined: 'Beide Kartensets gemischt im Spiel – alle Modifikatoren stehen zur Auswahl.',
};

export function showsClassicModifiers(ruleset: Ruleset): boolean {
  return ruleset === 'classic' || ruleset === 'combined';
}

export function showsVengeanceModifiers(ruleset: Ruleset): boolean {
  return ruleset === 'vengeance' || ruleset === 'combined';
}

export function createDefaultState(): GameState {
  return {
    players: [],
    rounds: [],
    targetScore: 200,
    nextPlayerId: 1,
    ruleset: 'classic',
    brutalMode: false,
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        players: Array.isArray(parsed.players) ? parsed.players : [],
        rounds: Array.isArray(parsed.rounds) ? parsed.rounds : [],
        targetScore: typeof parsed.targetScore === 'number' ? parsed.targetScore : 200,
        nextPlayerId: typeof parsed.nextPlayerId === 'number' ? parsed.nextPlayerId : 1,
        ruleset: parsed.ruleset === 'vengeance' || parsed.ruleset === 'combined' ? parsed.ruleset : 'classic',
        brutalMode: typeof parsed.brutalMode === 'boolean' ? parsed.brutalMode : false,
      };
    }
  } catch (e) {
    console.warn('State konnte nicht geladen werden', e);
  }
  return createDefaultState();
}

export function startNewGame(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        players: Array.isArray(parsed.players) ? parsed.players : [],
        rounds: [],
        targetScore: typeof parsed.targetScore === 'number' ? parsed.targetScore : 200,
        nextPlayerId: typeof parsed.nextPlayerId === 'number' ? parsed.nextPlayerId : 1,
        ruleset: parsed.ruleset === 'vengeance' || parsed.ruleset === 'combined' ? parsed.ruleset : 'classic',
        brutalMode: typeof parsed.brutalMode === 'boolean' ? parsed.brutalMode : false,
      };
    }
  } catch (e) {
    console.warn('State konnte nicht geladen werden', e);
  }
  return createDefaultState();
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('State konnte nicht gespeichert werden', e);
  }
}

export function totalFor(state: GameState, playerId: string): number {
  let total = 0;
  for (const round of state.rounds) {
    const entry = round.scores[playerId];
    if (entry) total += entry.total;
  }
  return total;
}

export function createEmptyEntry(): RoundEntry {
  return {
    sum: 0,
    x2: false,
    cards: [],
    modifiers: [],
    zero: false,
    divide2: false,
    bonus: false,
    bonusChoice: 'self',
    bonusTarget: null,
    bust: false,
    total: 0,
  };
}

/**
 * Rundenwert OHNE Flip-7-Bonus, aber inkl. aller Zahlen- und Modifikator-Effekte.
 * Reihenfolge laut offiziellen Regeln: Null-Karte übersteuert alles, dann x2,
 * dann ÷2 (abrunden), dann +/- Modifikatoren, danach Deckelung bei 0 (außer Brutal Mode).
 */
export function calcBaseScore(entry: RoundEntry, brutalMode: boolean): number {
  if (entry.bust) return 0;
  if (entry.zero) return 0;
  let base = entry.sum || 0;
  const numSum = entry.cards.reduce((a, b) => a + b, 0);
  base = base + numSum;
  if (entry.x2) base *= 2;
  if (entry.divide2) base = Math.floor(base / 2);
  const posModifs: number[] = entry.modifiers.filter(x => x.modifier == 'plus')?.map(x => x.value);//.reduce((a, b) => a + b, 0);
  const negModifs: number[] = entry.modifiers.filter(x => x.modifier == 'minus')?.map(x => x.value);//.reduce((a, b) => a + b, 0);
  const posSum = posModifs == null ? 0 : posModifs.reduce((a, b) => a + b, 0);
  const negSum = negModifs == null ? 0 : negModifs.reduce((a, b) => a + b, 0);
  base = base + posSum - negSum;
  if (base < 0 && !brutalMode) base = 0;
  return base;
}

/**
 * Eigener Rundenscore inkl. Flip-7-Bonus, aber OHNE Effekt eines evtl. verschenkten
 * Bonus (der wird erst beim Abschließen der Runde dem Zielspieler abgezogen).
 */
export function calcEntryTotal(entry: RoundEntry, brutalMode: boolean): number {
  if (entry.bust) return 0;
  const base = calcBaseScore(entry, brutalMode);
  const keepsBonusForSelf = entry.bonus && !(brutalMode && entry.bonusChoice === 'steal');
  return base + (keepsBonusForSelf ? 15 : 0);
}

/** Wandelt einen Rundenentwurf in eine gespeicherte Runde um (inkl. Bonus-Diebstahl-Effekt). */
export function finalizeRound(draft: RoundDraft, brutalMode: boolean): Round {
  const scores: Record<string, RoundEntry> = {};

  Object.entries(draft).forEach(([id, d]) => {
    const stealsBonus = !d.bust && d.bonus && brutalMode && d.bonusChoice === 'steal' && !!d.bonusTarget;
    scores[id] = {
      ...d,
      modifiers: [...d.modifiers],
      bonusTarget: stealsBonus ? d.bonusTarget : null,
      total: calcEntryTotal(d, brutalMode),
    };
  });

  // Gestohlene Flip-7-Boni: 15 Punkte werden dem Zielspieler abgezogen (nur Brutal Mode)
  Object.values(scores).forEach((entry) => {
    if (entry.bonusTarget && scores[entry.bonusTarget]) {
      scores[entry.bonusTarget].total -= 15;
    }
  });

  return { scores, timestamp: Date.now() };
}

export interface WinnerInfo {
  players: Player[];
  score: number;
}

export function findWinners(state: GameState): WinnerInfo | null {
  const withTotals = state.players.map((p) => ({ ...p, total: totalFor(state, p.id) }));
  const qualifiers = withTotals.filter((p) => p.total >= state.targetScore);
  if (qualifiers.length === 0) return null;
  qualifiers.sort((a, b) => b.total - a.total);
  const topScore = qualifiers[0].total;
  const tied = qualifiers.filter((p) => p.total === topScore);
  return { players: tied.map(({ id, name }) => ({ id, name })), score: topScore };
}
