import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GameStateService } from './game-state.service';
import { STORAGE_KEY, createEmptyEntry } from '../logic';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
  });

  it('starts with the default state', () => {
    expect(service.players()).toEqual([]);
    expect(service.rounds()).toEqual([]);
    expect(service.targetScore()).toBe(200);
    expect(service.ruleset()).toBe('classic');
    expect(service.brutalMode()).toBe(false);
  });

  it('adds a player with an incrementing id, trimming whitespace', () => {
    service.addPlayer('  Anna  ');
    service.addPlayer('Ben');
    expect(service.players()).toEqual([
      { id: 'p1', name: 'Anna' },
      { id: 'p2', name: 'Ben' },
    ]);
  });

  it('ignores blank player names', () => {
    service.addPlayer('   ');
    expect(service.players()).toEqual([]);
  });

  it('renames a player by id', () => {
    service.addPlayer('Anna');
    const id = service.players()[0].id;
    service.renamePlayer(id, 'Annabel');
    expect(service.players()[0].name).toBe('Annabel');
  });

  it('removes a player and strips them from existing round scores', () => {
    service.addPlayer('Anna');
    service.addPlayer('Ben');
    const [anna, ben] = service.players();
    service.saveRound({
      [anna.id]: { ...createEmptyEntry(), sum: 10 },
      [ben.id]: { ...createEmptyEntry(), sum: 20 },
    });

    service.removePlayer(anna.id);

    expect(service.players()).toEqual([{ id: ben.id, name: 'Ben' }]);
    expect(service.rounds()[0].scores[anna.id]).toBeUndefined();
    expect(service.rounds()[0].scores[ben.id]).toBeDefined();
  });

  it('computes standings sorted by total descending', () => {
    service.addPlayer('Anna');
    service.addPlayer('Ben');
    const [anna, ben] = service.players();
    service.saveRound({
      [anna.id]: { ...createEmptyEntry(), sum: 5 },
      [ben.id]: { ...createEmptyEntry(), sum: 40 },
    });

    const standings = service.standings();
    expect(standings.map((p) => p.name)).toEqual(['Ben', 'Anna']);
    expect(standings.map((p) => p.total)).toEqual([40, 5]);
  });

  it('reports winners once a round pushes a player past the target score', () => {
    service.updateSettings({ targetScore: 20, ruleset: 'classic', brutalMode: false });
    service.addPlayer('Anna');
    const anna = service.players()[0];

    const winner = service.saveRound({ [anna.id]: { ...createEmptyEntry(), sum: 25 } });

    expect(winner?.score).toBe(25);
    expect(winner?.players.map((p) => p.id)).toEqual([anna.id]);
  });

  it('returns null from saveRound while nobody has reached the target', () => {
    service.addPlayer('Anna');
    const anna = service.players()[0];
    const winner = service.saveRound({ [anna.id]: { ...createEmptyEntry(), sum: 5 } });
    expect(winner).toBeNull();
  });

  it('startNewGame clears players and rounds but preserves the target score', () => {
    service.updateSettings({ targetScore: 350, ruleset: 'combined', brutalMode: true });
    service.addPlayer('Anna');
    service.startNewGame();

    expect(service.players()).toEqual([]);
    expect(service.rounds()).toEqual([]);
    expect(service.targetScore()).toBe(350);
    expect(service.ruleset()).toBe('classic');
    expect(service.brutalMode()).toBe(false);
  });

  it('persists state to localStorage on every mutation', () => {
    service.addPlayer('Anna');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.players).toEqual([{ id: 'p1', name: 'Anna' }]);
  });
});
