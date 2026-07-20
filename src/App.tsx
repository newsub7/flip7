import { useEffect, useMemo, useState } from 'react';
import type { GameState, Round, RoundDraft, Ruleset } from './types';
import { createDefaultState, createEmptyEntry, finalizeRound, findWinners, loadState, saveState, totalFor } from './logic';
import type { WinnerInfo } from './logic';
import Header from './components/Header';
import TargetBar from './components/TargetBar';
import Standings from './components/Standings';
import EmptyState from './components/EmptyState';
import RoundModal from './components/RoundModal';
import PlayersModal from './components/PlayersModal';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import WinnerOverlay from './components/WinnerOverlay';
import Toast from './components/Toast';
import { PlusIcon } from './components/Icons';

type ModalKind = null | 'round' | 'players' | 'history' | 'settings';

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [openModal, setOpenModal] = useState<ModalKind>(null);
  const [draft, setDraft] = useState<RoundDraft | null>(null);
  const [winner, setWinner] = useState<WinnerInfo | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;
      navigator.serviceWorker.register(swUrl).catch(() => {
        /* Offline-Support ist ein Nice-to-have, kein Blocker */
      });
    }
  }, []);

  const standings = useMemo(
    () =>
      [...state.players]
        .map((p) => ({ ...p, total: totalFor(state, p.id) }))
        .sort((a, b) => b.total - a.total),
    [state],
  );

  function addPlayer(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      players: [...s.players, { id: `p${s.nextPlayerId}`, name: trimmed }],
      nextPlayerId: s.nextPlayerId + 1,
    }));
  }

  function renamePlayer(id: string, name: string) {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }

  function removePlayer(id: string) {
    setState((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== id),
      rounds: s.rounds.map((r) => {
        const scores = { ...r.scores };
        delete scores[id];
        return { ...r, scores };
      }),
    }));
  }

  function startNewGame() {
    setState((s) => ({ ...createDefaultState(), targetScore: s.targetScore }));
    setOpenModal(null);
    setToast('Neues Spiel gestartet');
  }

  function openRoundModal() {
    if (state.players.length === 0) return;
    const d: RoundDraft = {};
    state.players.forEach((p) => {
      d[p.id] = createEmptyEntry();
    });
    setDraft(d);
    setOpenModal('round');
  }

  function saveRound() {
    if (!draft) return;
    const round: Round = finalizeRound(draft, state.brutalMode);
    const nextState: GameState = { ...state, rounds: [...state.rounds, round] };
    setState(nextState);
    setOpenModal(null);
    setDraft(null);

    const w = findWinners(nextState);
    if (w) setWinner(w);
  }

  function updateSettings(next: { targetScore: number; ruleset: Ruleset; brutalMode: boolean }) {
    setState((s) => ({ ...s, ...next }));
    setOpenModal(null);
  }

  return (
    <>
      <div className="table-felt" />

      <Header
        onHistory={() => setOpenModal('history')}
        onPlayers={() => setOpenModal('players')}
        onSettings={() => setOpenModal('settings')}
      />

      <main id="app">
        <TargetBar
          targetScore={state.targetScore}
          ruleset={state.ruleset}
          brutalMode={state.brutalMode}
          onOpenSettings={() => setOpenModal('settings')}
        />

        {state.players.length === 0 ? (
          <EmptyState onAddPlayer={() => setOpenModal('players')} />
        ) : (
          <>
            <Standings players={standings} roundsPlayed={state.rounds.length} targetScore={state.targetScore} />
            <button className="fab" aria-label="Neue Runde eintragen" onClick={openRoundModal}>
              <PlusIcon />
            </button>
          </>
        )}
      </main>

      {openModal === 'round' && draft && (
        <RoundModal
          players={state.players}
          draft={draft}
          setDraft={setDraft}
          ruleset={state.ruleset}
          brutalMode={state.brutalMode}
          roundNumber={state.rounds.length + 1}
          onCancel={() => {
            setOpenModal(null);
            setDraft(null);
          }}
          onSave={saveRound}
        />
      )}

      {openModal === 'players' && (
        <PlayersModal
          players={state.players}
          hasRounds={state.rounds.length > 0}
          onAdd={addPlayer}
          onRename={renamePlayer}
          onRemove={removePlayer}
          onNewGame={startNewGame}
          onClose={() => setOpenModal(null)}
        />
      )}

      {openModal === 'history' && (
        <HistoryModal players={state.players} rounds={state.rounds} onClose={() => setOpenModal(null)} />
      )}

      {openModal === 'settings' && (
        <SettingsModal
          targetScore={state.targetScore}
          ruleset={state.ruleset}
          brutalMode={state.brutalMode}
          onSave={updateSettings}
          onClose={() => setOpenModal(null)}
        />
      )}

      {winner && (
        <WinnerOverlay
          names={winner.players.map((p) => p.name).join(' & ')}
          score={winner.score}
          onClose={() => setWinner(null)}
        />
      )}

      {toast && <Toast message={toast} />}
    </>
  );
}
