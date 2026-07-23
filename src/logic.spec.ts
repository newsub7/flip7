import { describe, expect, it, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  calcBaseScore,
  calcEntryTotal,
  createDefaultState,
  createEmptyEntry,
  finalizeRound,
  findWinners,
  loadState,
  saveState,
  showsClassicModifiers,
  showsVengeanceModifiers,
  totalFor,
} from './logic';
import type { GameState, RoundDraft, RoundEntry } from './types';

function entry(overrides: Partial<RoundEntry> = {}): RoundEntry {
  return { ...createEmptyEntry(), ...overrides };
}

describe('createDefaultState / createEmptyEntry', () => {
  it('returns a fresh empty game with classic ruleset and target 200', () => {
    const state = createDefaultState();
    expect(state.players).toEqual([]);
    expect(state.rounds).toEqual([]);
    expect(state.targetScore).toBe(200);
    expect(state.nextPlayerId).toBe(1);
    expect(state.ruleset).toBe('classic');
    expect(state.brutalMode).toBe(false);
  });

  it('returns a zeroed-out entry', () => {
    expect(createEmptyEntry()).toEqual({
      sum: 0,
      x2: false,
      modifiers: [],
      zero: false,
      divide2: false,
      bonus: false,
      bonusChoice: 'self',
      bonusTarget: null,
      bust: false,
      total: 0,
    });
  });
});

describe('showsClassicModifiers / showsVengeanceModifiers', () => {
  it('classic ruleset only shows classic modifiers', () => {
    expect(showsClassicModifiers('classic')).toBe(true);
    expect(showsVengeanceModifiers('classic')).toBe(false);
  });

  it('vengeance ruleset only shows vengeance modifiers', () => {
    expect(showsClassicModifiers('vengeance')).toBe(false);
    expect(showsVengeanceModifiers('vengeance')).toBe(true);
  });

  it('combined ruleset shows both', () => {
    expect(showsClassicModifiers('combined')).toBe(true);
    expect(showsVengeanceModifiers('combined')).toBe(true);
  });
});

describe('calcBaseScore', () => {
  it('sums the number cards', () => {
    expect(calcBaseScore(entry({ sum: 12 }), false)).toBe(12);
  });

  it('doubles the sum with the x2 card', () => {
    expect(calcBaseScore(entry({ sum: 12, x2: true }), false)).toBe(24);
  });

  it('halves and floors the sum with the ÷2 card, before modifiers', () => {
    expect(calcBaseScore(entry({ sum: 13, divide2: true }), false)).toBe(6);
  });

  it('applies positive modifiers on top of the sum', () => {
    expect(calcBaseScore(entry({ sum: 10, modifiers: [2, 4] }), false)).toBe(16);
  });

  it('is always 0 on a bust, regardless of other fields', () => {
    expect(calcBaseScore(entry({ bust: true, sum: 40, modifiers: [10] }), false)).toBe(0);
  });

  it('is always 0 with the zero card, ignoring sum and modifiers', () => {
    expect(calcBaseScore(entry({ zero: true, sum: 40, modifiers: [10], x2: true }), false)).toBe(0);
  });
});

describe('calcEntryTotal', () => {
  it('adds the 15-point Flip-7 bonus for the player who keeps it', () => {
    const e = entry({ sum: 20, bonus: true });
    expect(calcEntryTotal(e, false)).toBe(35);
  });

  it('is 0 on a bust even with a bonus flagged', () => {
    const e = entry({ bust: true, bonus: true });
    expect(calcEntryTotal(e, false)).toBe(0);
  });

  it('does not add the bonus for the scorer when it is stolen in brutal mode', () => {
    const e = entry({ sum: 20, bonus: true, bonusChoice: 'steal', bonusTarget: 'p2' });
    expect(calcEntryTotal(e, true)).toBe(20);
  });

  it('keeps the bonus for the scorer when bonusChoice is steal but brutal mode is off', () => {
    const e = entry({ sum: 20, bonus: true, bonusChoice: 'steal', bonusTarget: 'p2' });
    expect(calcEntryTotal(e, false)).toBe(35);
  });
});

describe('finalizeRound', () => {
  it('computes totals per player for a normal round', () => {
    const draft: RoundDraft = {
      p1: entry({ sum: 30, modifiers: [4] }),
      p2: entry({ bust: true }),
    };
    const round = finalizeRound(draft, false);
    expect(round.scores['p1'].total).toBe(34);
    expect(round.scores['p2'].total).toBe(0);
    expect(round.timestamp).toBeGreaterThan(0);
  });

  it('deducts a stolen Flip-7 bonus from the target in brutal mode', () => {
    const draft: RoundDraft = {
      p1: entry({ sum: 10, bonus: true, bonusChoice: 'steal', bonusTarget: 'p2' }),
      p2: entry({ sum: 25 }),
    };
    const round = finalizeRound(draft, true);
    expect(round.scores['p1'].total).toBe(10); // stealer keeps only the base sum
    expect(round.scores['p2'].total).toBe(10); // 25 - 15 stolen
    expect(round.scores['p1'].bonusTarget).toBe('p2');
  });

  it('does not steal the bonus outside brutal mode even if bonusChoice is steal', () => {
    const draft: RoundDraft = {
      p1: entry({ sum: 10, bonus: true, bonusChoice: 'steal', bonusTarget: 'p2' }),
      p2: entry({ sum: 25 }),
    };
    const round = finalizeRound(draft, false);
    expect(round.scores['p1'].total).toBe(25); // keeps the bonus, brutal mode is off
    expect(round.scores['p2'].total).toBe(25); // untouched
    expect(round.scores['p1'].bonusTarget).toBeNull();
  });

  it('ignores a steal target if the scorer busted', () => {
    const draft: RoundDraft = {
      p1: entry({ bust: true, bonus: true, bonusChoice: 'steal', bonusTarget: 'p2' }),
      p2: entry({ sum: 10 }),
    };
    const round = finalizeRound(draft, true);
    expect(round.scores['p1'].total).toBe(0);
    expect(round.scores['p2'].total).toBe(10);
    expect(round.scores['p1'].bonusTarget).toBeNull();
  });
});

describe('totalFor', () => {
  it('sums a player total across all rounds', () => {
    const state: GameState = {
      ...createDefaultState(),
      players: [{ id: 'p1', name: 'A' }],
      rounds: [
        { scores: { p1: entry({ total: 10 }) }, timestamp: 1 },
        { scores: { p1: entry({ total: 25 }) }, timestamp: 2 },
      ],
    };
    expect(totalFor(state, 'p1')).toBe(35);
  });

  it('skips rounds where the player has no entry (e.g. removed player)', () => {
    const state: GameState = {
      ...createDefaultState(),
      players: [{ id: 'p1', name: 'A' }],
      rounds: [{ scores: { p1: entry({ total: 10 }) }, timestamp: 1 }, { scores: {}, timestamp: 2 }],
    };
    expect(totalFor(state, 'p1')).toBe(10);
  });
});

describe('findWinners', () => {
  function stateWithTotals(totals: Record<string, number>, targetScore = 200): GameState {
    const players = Object.keys(totals).map((id) => ({ id, name: id }));
    return {
      ...createDefaultState(),
      targetScore,
      players,
      rounds: [{ scores: Object.fromEntries(Object.entries(totals).map(([id, total]) => [id, entry({ total })])), timestamp: 1 }],
    };
  }

  it('returns null when nobody has reached the target score', () => {
    const state = stateWithTotals({ p1: 150, p2: 100 });
    expect(findWinners(state)).toBeNull();
  });

  it('declares the single player above target as winner', () => {
    const state = stateWithTotals({ p1: 210, p2: 100 });
    const winner = findWinners(state);
    expect(winner?.score).toBe(210);
    expect(winner?.players.map((p) => p.id)).toEqual(['p1']);
  });

  it('declares a tie when multiple players share the top score above target', () => {
    const state = stateWithTotals({ p1: 210, p2: 210, p3: 190 });
    const winner = findWinners(state);
    expect(winner?.score).toBe(210);
    expect(winner?.players.map((p) => p.id).sort()).toEqual(['p1', 'p2']);
  });

  it('only the highest qualifier(s) win when several players are above target', () => {
    const state = stateWithTotals({ p1: 250, p2: 210 });
    const winner = findWinners(state);
    expect(winner?.score).toBe(250);
    expect(winner?.players.map((p) => p.id)).toEqual(['p1']);
  });
});

describe('loadState / saveState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the default state when nothing is stored', () => {
    expect(loadState()).toEqual(createDefaultState());
  });

  it('round-trips a saved state', () => {
    const state: GameState = {
      ...createDefaultState(),
      players: [{ id: 'p1', name: 'Anna' }],
      targetScore: 300,
      ruleset: 'combined',
      brutalMode: true,
    };
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('falls back to defaults for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    expect(loadState()).toEqual(createDefaultState());
  });

  it('falls back field by field for a malformed stored object', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ruleset: 'nonsense', targetScore: 'oops' }));
    const state = loadState();
    expect(state.ruleset).toBe('classic');
    expect(state.targetScore).toBe(200);
    expect(state.players).toEqual([]);
  });
});
