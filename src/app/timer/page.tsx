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

interface Capture {
  id: number;
  rank: number;
  bib: number;
  athleteName: string;
  athlete_id: number;
  time: string;
  rawSeconds: number;
  qual_status: string;
}

type TimerState = 'idle' | 'running' | 'stopped';

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const sStr = seconds < 10 ? '0' + seconds.toFixed(2) : seconds.toFixed(2);
  return `${String(minutes).padStart(2, '0')}:${sStr}`;
}

export default function TimerPage() {
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [displayTime, setDisplayTime] = useState('00:00.00');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bibInput, setBibInput] = useState('');

  const startTimeRef = useRef<number>(0);
  const elapsedAtStopRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const bibRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/athletes').then(r => r.json()).then(setAllAthletes);
    fetch('/api/events').then(r => r.json()).then((evts: Event[]) => {
      setEvents(evts.filter(e => e.type === 'time'));
    });
  }, []);

  const matchedAthlete = useMemo(() => {
    const bibNum = parseInt(bibInput.trim());
    if (isNaN(bibNum)) return null;
    return allAthletes.find(a => a.bib_number === bibNum) ?? null;
  }, [bibInput, allAthletes]);

  const updateDisplay = useCallback(() => {
    const now = performance.now();
    const elapsedMs = now - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    setDisplayTime(formatElapsed(elapsedSec));
    rafRef.current = requestAnimationFrame(updateDisplay);
  }, []);

  const handleStart = () => {
    if (timerState === 'idle') {
      startTimeRef.current = performance.now();
      elapsedAtStopRef.current = 0;
    } else if (timerState === 'stopped') {
      const now = performance.now();
      startTimeRef.current = now - elapsedAtStopRef.current;
    }
    setTimerState('running');
    rafRef.current = requestAnimationFrame(updateDisplay);
    setTimeout(() => bibRef.current?.focus(), 50);
  };

  const handleStop = () => {
    cancelAnimationFrame(rafRef.current);
    const now = performance.now();
    elapsedAtStopRef.current = now - startTimeRef.current;
    setTimerState('stopped');
  };

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current);
    setTimerState('idle');
    setDisplayTime('00:00.00');
    startTimeRef.current = 0;
    elapsedAtStopRef.current = 0;
    setCaptures([]);
    setBibInput('');
    setError(null);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const submitBib = async () => {
    if (submitting) return;
    const bibNum = parseInt(bibInput.trim());
    if (isNaN(bibNum)) {
      setError('Enter a valid bib number');
      return;
    }
    if (!matchedAthlete) {
      setError(`No athlete with bib #${bibNum}`);
      return;
    }
    if (!selectedEvent) {
      setError('Select an event first');
      return;
    }
    if (captures.some(c => c.athlete_id === matchedAthlete.id)) {
      setError(`${matchedAthlete.first_name} ${matchedAthlete.last_name} already recorded`);
      return;
    }

    const elapsedMs = timerState === 'stopped'
      ? elapsedAtStopRef.current
      : performance.now() - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    const valueStr = formatTime(elapsedSec);

    const athlete = matchedAthlete;
    setError(null);
    setBibInput('');
    setSubmitting(true);
    bibRef.current?.focus();

    try {
      const res = await fetch('/api/performances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: athlete.id,
          event_id: parseInt(selectedEvent),
          value: valueStr,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const newCapture: Capture = {
          id: data.id,
          rank: captures.length + 1,
          bib: athlete.bib_number ?? 0,
          athleteName: `${athlete.first_name} ${athlete.last_name}`,
          athlete_id: athlete.id,
          time: data.display_value,
          rawSeconds: data.raw_value,
          qual_status: data.qual_status,
        };
        setCaptures(prev => [...prev, newCapture]);
      } else {
        setError(data.error || 'Failed to record');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (captureId: number, index: number) => {
    try {
      const res = await fetch(`/api/performances/${captureId}`, { method: 'DELETE' });
      if (res.ok) {
        setCaptures(prev => {
          const updated = prev.filter((_, i) => i !== index);
          return updated.map((c, i) => ({ ...c, rank: i + 1 }));
        });
      } else {
        setError('Failed to delete');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleBibKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBib();
    }
  };

  const qualBadge = (status: string) => {
    if (status === 'automatic') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-green-500 text-white">AUTO</span>;
    if (status === 'provisional') return <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-400 text-yellow-900">PROV</span>;
    return <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">DNQ</span>;
  };

  const selectedEventName = events.find(e => String(e.id) === selectedEvent)?.name;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        {/* Event selector */}
        <div className="px-4 md:px-8 pt-3 pb-2 max-w-3xl mx-auto w-full">
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            disabled={timerState === 'running'}
            className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2.5 text-base md:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Select event...</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {/* Timer display */}
        <div className="px-4 py-3 md:py-5 text-center">
          <div
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-mono tracking-wider"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {displayTime}
          </div>
          {selectedEventName && timerState !== 'idle' && (
            <div className="text-sm md:text-base text-gray-400 mt-1">{selectedEventName}</div>
          )}
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
              onClick={handleStart}
              disabled={!selectedEvent}
              className="flex-1 py-3.5 md:py-4 bg-green-600 text-white rounded-xl text-lg md:text-xl font-bold active:bg-green-700 disabled:opacity-40 transition"
            >
              {timerState === 'stopped' ? 'Resume' : 'Start'}
            </button>
          )}
          {timerState === 'stopped' && (
            <button
              onClick={handleReset}
              className="py-3.5 md:py-4 px-5 md:px-8 bg-gray-700 text-white rounded-xl text-lg md:text-xl font-bold active:bg-gray-600 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bib input — always visible */}
      <div className="px-4 md:px-8 py-3 border-b border-gray-800" style={{ backgroundColor: '#1a2332' }}>
        <div className="flex gap-2 max-w-3xl mx-auto w-full">
          <input
            ref={bibRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bibInput}
            onChange={e => setBibInput(e.target.value)}
            onKeyDown={handleBibKeyDown}
            placeholder="Bib #"
            autoFocus
            className="flex-1 min-w-0 bg-gray-800 text-white border border-gray-600 rounded-xl px-4 py-3 md:py-4 text-2xl md:text-3xl font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
          />
          <button
            onClick={submitBib}
            disabled={submitting || !matchedAthlete}
            className="shrink-0 px-5 md:px-8 py-3 md:py-4 bg-blue-600 text-white rounded-xl text-base md:text-lg font-bold active:bg-blue-700 disabled:opacity-40 transition"
          >
            Log
          </button>
        </div>
        <div className="max-w-3xl mx-auto w-full">
          {/* Live athlete preview */}
          {bibInput.trim() && (
            <div className="mt-2 px-1">
              {matchedAthlete ? (
                <div className="text-green-400 font-medium md:text-lg">
                  {matchedAthlete.first_name} {matchedAthlete.last_name}
                </div>
              ) : (
                <div className="text-gray-500 text-sm md:text-base">No match</div>
              )}
            </div>
          )}
          {error && (
            <div className="mt-2 px-3 py-2 bg-red-900/50 text-red-300 rounded-lg text-sm md:text-base font-medium">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-3">
        {captures.length > 0 && (
          <div className="max-w-3xl mx-auto w-full">
            <h2 className="text-sm md:text-base font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Finishers ({captures.length})
            </h2>
            <div className="space-y-2">
              {captures.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2.5 md:py-3 rounded-lg ${
                    c.qual_status === 'automatic' ? 'bg-green-900/30 border border-green-800/50' :
                    c.qual_status === 'provisional' ? 'bg-yellow-900/20 border border-yellow-800/40' :
                    'bg-gray-800 border border-gray-700/50'
                  }`}
                >
                  <div className="text-lg md:text-xl font-bold text-gray-500 w-7 md:w-9 text-center shrink-0">
                    {c.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs md:text-sm bg-gray-700 px-1.5 py-0.5 rounded">{c.bib}</span>
                      <span className="font-medium md:text-lg truncate">{c.athleteName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-lg md:text-xl font-bold">{c.time}</span>
                    {qualBadge(c.qual_status)}
                  </div>
                  <button
                    onClick={() => handleDelete(c.id, i)}
                    className="text-gray-500 hover:text-red-400 active:text-red-400 p-1 shrink-0"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {captures.length === 0 && timerState === 'running' && (
          <div className="text-center py-8 md:py-12 text-gray-500">
            <p className="md:text-lg">Type bib numbers as athletes finish</p>
          </div>
        )}

        {timerState === 'idle' && (
          <div className="text-center py-12 md:py-16 text-gray-500">
            <p className="text-lg md:text-xl mb-1">Select an event and press Start</p>
            <p className="text-sm md:text-base">Type bib numbers as athletes cross the finish line</p>
          </div>
        )}
      </div>
    </div>
  );
}
