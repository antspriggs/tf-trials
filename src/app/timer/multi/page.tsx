'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { formatTime } from '@/lib/utils/time-parser';

interface Athlete {
  id: number;
  first_name: string;
  last_name: string;
  bib_number: number | null;
  gender: 'M' | 'F';
}

interface Event {
  id: number;
  name: string;
  type: 'time' | 'distance' | 'height';
  unit: string;
}

interface HeatAthlete {
  athlete_id: number;
  bib: number;
  name: string;
  finishedAt: number | null;
  performanceId: number | null;
  displayTime: string | null;
  qualStatus: string | null;
  submitting: boolean;
}

type Phase = 'setup' | 'race' | 'results';
type TimerState = 'idle' | 'running' | 'stopped';

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const sStr = seconds < 10 ? '0' + seconds.toFixed(2) : seconds.toFixed(2);
  return `${String(minutes).padStart(2, '0')}:${sStr}`;
}

export default function MultiTimerPage() {
  // --- Data ---
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // --- Setup phase ---
  const [selectedEvent, setSelectedEvent] = useState('');
  const [bibInput, setBibInput] = useState('');
  const [roster, setRoster] = useState<HeatAthlete[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);

  // --- Race phase ---
  const [phase, setPhase] = useState<Phase>('setup');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [displayTime, setDisplayTime] = useState('00:00.00');
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);
  const elapsedAtStopRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const bibRef = useRef<HTMLInputElement>(null);

  // --- Load athletes and events ---
  useEffect(() => {
    fetch('/api/athletes').then(r => r.json()).then(setAllAthletes);
    fetch('/api/events').then(r => r.json()).then((evts: Event[]) => {
      setEvents(evts.filter(e => e.type === 'time'));
    });
  }, []);

  // --- Bib preview for setup ---
  const bibPreview = useMemo(() => {
    const trimmed = bibInput.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    return parts.map(p => {
      const num = parseInt(p);
      if (isNaN(num)) return { input: p, athlete: null };
      const athlete = allAthletes.find(a => a.bib_number === num);
      return { input: p, athlete: athlete ?? null };
    });
  }, [bibInput, allAthletes]);

  // --- Setup: add bibs ---
  const addBibs = () => {
    const trimmed = bibInput.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    const errors: string[] = [];

    for (const p of parts) {
      const num = parseInt(p);
      if (isNaN(num)) {
        errors.push(`"${p}" is not a valid bib`);
        continue;
      }
      const athlete = allAthletes.find(a => a.bib_number === num);
      if (!athlete) {
        errors.push(`No athlete with bib #${num}`);
        continue;
      }
      if (roster.some(r => r.athlete_id === athlete.id)) {
        errors.push(`Bib #${num} already added`);
        continue;
      }
      setRoster(prev => [...prev, {
        athlete_id: athlete.id,
        bib: athlete.bib_number ?? 0,
        name: `${athlete.first_name} ${athlete.last_name}`,
        finishedAt: null,
        performanceId: null,
        displayTime: null,
        qualStatus: null,
        submitting: false,
      }]);
    }

    setBibInput('');
    setSetupError(errors.length > 0 ? errors.join('; ') : null);
    bibRef.current?.focus();
  };

  const removeBib = (athleteId: number) => {
    setRoster(prev => prev.filter(r => r.athlete_id !== athleteId));
  };

  const handleSetupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBibs();
    }
  };

  // --- Timer ---
  const updateDisplay = useCallback(() => {
    const now = performance.now();
    const elapsedMs = now - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    setDisplayTime(formatElapsed(elapsedSec));
    rafRef.current = requestAnimationFrame(updateDisplay);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const startRace = () => {
    setPhase('race');
    setTimerState('running');
    startTimeRef.current = performance.now();
    elapsedAtStopRef.current = 0;
    rafRef.current = requestAnimationFrame(updateDisplay);
  };

  const handleStop = () => {
    cancelAnimationFrame(rafRef.current);
    const now = performance.now();
    elapsedAtStopRef.current = now - startTimeRef.current;
    setTimerState('stopped');
  };

  const handleResume = () => {
    const now = performance.now();
    startTimeRef.current = now - elapsedAtStopRef.current;
    setTimerState('running');
    rafRef.current = requestAnimationFrame(updateDisplay);
  };

  // --- Tap to finish ---
  const handleTap = async (athleteId: number) => {
    if (timerState !== 'running') return;

    // Snapshot elapsed time synchronously
    const elapsedMs = performance.now() - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    const valueStr = formatTime(elapsedSec);
    const elapsed = formatElapsed(elapsedSec);

    // Optimistically update
    setRoster(prev => prev.map(a =>
      a.athlete_id === athleteId
        ? { ...a, finishedAt: elapsedSec, displayTime: elapsed, submitting: true }
        : a
    ));

    try {
      const res = await fetch('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: athleteId,
          event_id: parseInt(selectedEvent),
          value: valueStr,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setRoster(prev => prev.map(a =>
          a.athlete_id === athleteId
            ? {
                ...a,
                performanceId: data.id,
                displayTime: data.display_value,
                qualStatus: data.qual_status,
                submitting: false,
              }
            : a
        ));
      } else {
        setError(data.error || 'Failed to record');
        // Revert
        setRoster(prev => prev.map(a =>
          a.athlete_id === athleteId
            ? { ...a, finishedAt: null, displayTime: null, submitting: false }
            : a
        ));
      }
    } catch {
      setError('Network error');
      setRoster(prev => prev.map(a =>
        a.athlete_id === athleteId
          ? { ...a, finishedAt: null, displayTime: null, submitting: false }
          : a
      ));
    }
  };

  // --- Undo finish ---
  const handleUndo = async (athleteId: number) => {
    const athlete = roster.find(a => a.athlete_id === athleteId);
    if (!athlete?.performanceId) return;

    const perfId = athlete.performanceId;
    // Optimistically revert
    setRoster(prev => prev.map(a =>
      a.athlete_id === athleteId
        ? { ...a, finishedAt: null, performanceId: null, displayTime: null, qualStatus: null, submitting: false }
        : a
    ));

    try {
      const res = await fetch(`/api/performances/${perfId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Failed to undo');
      }
    } catch {
      setError('Network error');
    }
  };

  // --- Finish heat ---
  const finishHeat = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase('results');
  };

  // --- New heat ---
  const newHeat = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase('setup');
    setTimerState('idle');
    setDisplayTime('00:00.00');
    startTimeRef.current = 0;
    elapsedAtStopRef.current = 0;
    setRoster([]);
    setBibInput('');
    setError(null);
    setSetupError(null);
  };

  // --- Results ---
  const sortedResults = useMemo(() => {
    const finished = roster
      .filter(a => a.finishedAt !== null)
      .sort((a, b) => a.finishedAt! - b.finishedAt!);
    const dnf = roster.filter(a => a.finishedAt === null);
    return { finished, dnf };
  }, [roster]);

  const selectedEventName = events.find(e => String(e.id) === selectedEvent)?.name;

  const qualBadge = (status: string | null) => {
    if (status === 'automatic') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-500 text-white">AUTO</span>;
    if (status === 'provisional') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-400 text-yellow-900">PROV</span>;
    if (status) return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">DNQ</span>;
    return null;
  };

  const cardBg = (status: string | null) => {
    if (status === 'automatic') return 'bg-green-900/40 border-green-700/60';
    if (status === 'provisional') return 'bg-yellow-900/30 border-yellow-700/50';
    return 'bg-gray-700/50 border-gray-600/50';
  };

  // ====================
  // RENDER
  // ====================

  // --- SETUP PHASE ---
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <div className="px-4 md:px-8 pt-6 pb-4 max-w-3xl mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Multi-Athlete Timer</h1>

          {/* Event selector */}
          <label className="block text-sm font-medium text-gray-400 mb-1">Event</label>
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 text-base md:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          >
            <option value="">Select event...</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          {/* Bib entry */}
          <label className="block text-sm font-medium text-gray-400 mb-1">Add Athletes by Bib</label>
          <div className="flex gap-2 mb-2">
            <input
              ref={bibRef}
              type="text"
              inputMode="numeric"
              value={bibInput}
              onChange={e => setBibInput(e.target.value)}
              onKeyDown={handleSetupKeyDown}
              placeholder="Bib # (or comma-separated)"
              autoFocus
              className="flex-1 min-w-0 bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
            />
            <button
              onClick={addBibs}
              className="shrink-0 px-5 py-3 bg-blue-600 text-white rounded-xl text-base font-bold active:bg-blue-700 transition"
            >
              Add
            </button>
          </div>

          {/* Bib preview */}
          {bibPreview && bibPreview.length > 0 && (
            <div className="mb-4 px-1 space-y-0.5">
              {bibPreview.map((bp, i) => (
                <div key={i} className={bp.athlete ? 'text-green-400 text-sm' : 'text-gray-500 text-sm'}>
                  {bp.athlete
                    ? `#${bp.input} — ${bp.athlete.first_name} ${bp.athlete.last_name}`
                    : `#${bp.input} — No match`}
                </div>
              ))}
            </div>
          )}

          {setupError && (
            <div className="mb-4 px-3 py-2 bg-red-900/50 text-red-300 rounded-lg text-sm font-medium">
              {setupError}
            </div>
          )}

          {/* Heat roster */}
          {roster.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Heat Roster ({roster.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                {roster.map(a => (
                  <div
                    key={a.athlete_id}
                    className="relative bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 min-h-[60px]"
                  >
                    <button
                      onClick={() => removeBib(a.athlete_id)}
                      className="absolute top-1 right-1 text-gray-500 hover:text-red-400 p-0.5"
                      aria-label="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="text-2xl font-bold font-mono">{a.bib}</div>
                    <div className="text-sm font-semibold text-gray-300 truncate">{a.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Start Race button */}
          <button
            onClick={startRace}
            disabled={!selectedEvent || roster.length === 0}
            className="w-full py-4 bg-green-600 text-white rounded-xl text-xl font-bold active:bg-green-700 disabled:opacity-40 transition"
          >
            Start Race
          </button>
        </div>
      </div>
    );
  }

  // --- RESULTS PHASE ---
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <div className="px-4 md:px-8 pt-6 pb-4 max-w-3xl mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Heat Results</h1>
          {selectedEventName && (
            <div className="text-gray-400 mb-6">{selectedEventName}</div>
          )}

          {/* Finished athletes */}
          {sortedResults.finished.length > 0 && (
            <div className="space-y-2 mb-6">
              {sortedResults.finished.map((a, i) => (
                <div
                  key={a.athlete_id}
                  className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border ${cardBg(a.qualStatus)}`}
                >
                  <div className="text-lg md:text-xl font-bold text-gray-400 w-7 md:w-9 text-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs md:text-sm bg-gray-700 px-1.5 py-0.5 rounded">{a.bib}</span>
                      <span className="font-medium md:text-lg truncate">{a.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-lg md:text-xl font-bold">{a.displayTime}</span>
                    {qualBadge(a.qualStatus)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DNF */}
          {sortedResults.dnf.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">DNF</h2>
              <div className="space-y-2 mb-6">
                {sortedResults.dnf.map(a => (
                  <div
                    key={a.athlete_id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50"
                  >
                    <div className="text-lg font-bold text-gray-600 w-7 text-center shrink-0">—</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-700 px-1.5 py-0.5 rounded">{a.bib}</span>
                        <span className="font-medium text-gray-400 truncate">{a.name}</span>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm font-medium shrink-0">DNF</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={newHeat}
            className="w-full py-4 bg-blue-600 text-white rounded-xl text-xl font-bold active:bg-blue-700 transition"
          >
            New Heat
          </button>
        </div>
      </div>
    );
  }

  // --- RACE PHASE ---
  const finishedCount = roster.filter(a => a.finishedAt !== null).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        {/* Timer display */}
        <div className="px-4 py-3 md:py-5 text-center">
          {selectedEventName && (
            <div className="text-sm md:text-base text-gray-400 mb-1">{selectedEventName}</div>
          )}
          <div
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-mono tracking-wider"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {displayTime}
          </div>
        </div>

        {/* Controls */}
        <div className="px-4 md:px-8 pb-3 flex gap-3 max-w-3xl mx-auto w-full">
          {timerState === 'running' ? (
            <button
              onClick={handleStop}
              className="flex-1 py-3.5 md:py-4 bg-red-600 text-white rounded-xl text-lg md:text-xl font-bold active:bg-red-700 transition"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="flex-1 py-3.5 md:py-4 bg-green-600 text-white rounded-xl text-lg md:text-xl font-bold active:bg-green-700 transition"
            >
              Resume
            </button>
          )}
          {timerState === 'stopped' && (
            <button
              onClick={finishHeat}
              className="py-3.5 md:py-4 px-5 md:px-8 bg-gray-700 text-white rounded-xl text-lg md:text-xl font-bold active:bg-gray-600 transition"
            >
              Finish Heat
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-4 md:px-8 pb-2 max-w-3xl mx-auto w-full">
          <div className="text-xs text-gray-500">
            {finishedCount} / {roster.length} finished
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 md:px-8 py-2">
          <div className="max-w-3xl mx-auto px-3 py-2 bg-red-900/50 text-red-300 rounded-lg text-sm font-medium">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
          </div>
        </div>
      )}

      {/* Athlete grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-4xl mx-auto">
          {roster.map(a => {
            const isFinished = a.finishedAt !== null;
            const dimmed = timerState !== 'running' && !isFinished;

            return (
              <div key={a.athlete_id} className="relative">
                <button
                  onClick={() => !isFinished && handleTap(a.athlete_id)}
                  disabled={isFinished || timerState !== 'running'}
                  className={`w-full min-h-[80px] rounded-lg border px-3 py-3 text-left transition select-none ${
                    isFinished
                      ? `${cardBg(a.qualStatus)} cursor-default`
                      : dimmed
                        ? 'bg-gray-800/40 border-gray-700/30 opacity-50 cursor-not-allowed'
                        : 'bg-gray-800 border-gray-600 active:bg-gray-700 cursor-pointer'
                  }`}
                >
                  <div className={`text-2xl md:text-3xl font-bold font-mono ${isFinished ? 'text-white/70' : ''}`}>
                    {a.bib}
                  </div>
                  <div className={`text-sm font-semibold truncate ${isFinished ? 'text-white/60' : 'text-gray-300'}`}>
                    {a.name}
                  </div>
                  {isFinished && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-sm md:text-base font-bold text-white">
                        {a.submitting ? '...' : a.displayTime}
                      </span>
                      {!a.submitting && qualBadge(a.qualStatus)}
                    </div>
                  )}
                </button>
                {/* Undo button on finished cards */}
                {isFinished && !a.submitting && (
                  <button
                    onClick={() => handleUndo(a.athlete_id)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-red-400 active:text-red-400 p-1 rounded"
                    aria-label="Undo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
