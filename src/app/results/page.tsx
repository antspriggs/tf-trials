'use client';

import { useEffect, useMemo, useState } from 'react';

interface ResultRow {
  id: number;
  athlete_id: number;
  event_id: number;
  raw_value: number;
  display_value: string;
  qual_status: 'automatic' | 'provisional' | 'dnq';
  first_name: string;
  last_name: string;
  bib_number: number | null;
  grade: number;
  gender: string;
  event_name: string;
  event_type: string;
  event_unit: string;
  coaches_discretion: boolean;
}

interface Event {
  id: number;
  name: string;
  type: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Record<string, ResultRow[]>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [genderFilter, setGenderFilter] = useState<'' | 'M' | 'F'>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'' | 'automatic' | 'provisional' | 'dnq'>('');
  const [athleteFilter, setAthleteFilter] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);

  const fetchResults = () => {
    fetch('/api/results')
      .then(r => r.json())
      .then(data => {
        setResults(data.results);
        setEvents(data.events);
        setLastUpdate(new Date());
      });
  };

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, []);

  const qualBadge = (status: string) => {
    if (status === 'automatic') return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white">AUTO</span>;
    if (status === 'provisional') return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-yellow-900">PROV</span>;
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">DNQ</span>;
  };

  const allGrades = useMemo(() => {
    const grades = new Set<number>();
    Object.values(results).flat().forEach(r => grades.add(r.grade));
    return Array.from(grades).sort((a, b) => a - b);
  }, [results]);

  const allAthletes = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    Object.values(results).flat().forEach(r => {
      if (!map.has(r.athlete_id)) {
        map.set(r.athlete_id, { id: r.athlete_id, name: `${r.first_name} ${r.last_name}` });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [results]);

  const discretionAthletes = useMemo(() => {
    const allRows = Object.values(results).flat();
    // Find athletes flagged as coach's discretion
    const athleteRows = new Map<number, ResultRow[]>();
    const athleteHasQual = new Set<number>();
    for (const r of allRows) {
      if (!r.coaches_discretion) continue;
      if (!athleteRows.has(r.athlete_id)) athleteRows.set(r.athlete_id, []);
      athleteRows.get(r.athlete_id)!.push(r);
      if (r.qual_status === 'automatic' || r.qual_status === 'provisional') {
        athleteHasQual.add(r.athlete_id);
      }
    }
    // Only show athletes who don't already have qualifying performances
    const result: { athlete: { id: number; name: string; bib: number | null; grade: number; gender: string }; rows: ResultRow[] }[] = [];
    for (const [id, rows] of athleteRows) {
      if (athleteHasQual.has(id)) continue;
      const first = rows[0];
      result.push({
        athlete: { id, name: `${first.first_name} ${first.last_name}`, bib: first.bib_number, grade: first.grade, gender: first.gender },
        rows,
      });
    }
    result.sort((a, b) => a.athlete.name.localeCompare(b.athlete.name));
    return result;
  }, [results]);

  const filteredResults = useMemo(() => {
    const out: Record<string, ResultRow[]> = {};
    for (const [eventName, rows] of Object.entries(results)) {
      const filtered = rows.filter(r => {
        if (genderFilter && r.gender !== genderFilter) return false;
        if (gradeFilter && String(r.grade) !== gradeFilter) return false;
        if (athleteFilter && String(r.athlete_id) !== athleteFilter) return false;
        if (statusFilter && r.qual_status !== statusFilter) return false;
        return true;
      });
      // Time events: lower is better (ascending). Distance/height: higher is better (descending).
      // sortAsc flips the natural order for the user.
      const isTime = filtered[0]?.event_type === 'time';
      const naturalAsc = isTime; // natural ranking direction
      const asc = sortAsc ? naturalAsc : !naturalAsc;
      filtered.sort((a, b) => asc ? a.raw_value - b.raw_value : b.raw_value - a.raw_value);
      if (filtered.length > 0) out[eventName] = filtered;
    }
    return out;
  }, [results, genderFilter, gradeFilter, athleteFilter, statusFilter, sortAsc]);

  const eventsWithResults = events.filter(e => filteredResults[e.name]?.length > 0);
  const eventsWithoutResults = events.filter(e => !filteredResults[e.name]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Live Results</h1>
            <p className="text-gray-400 text-xs sm:text-sm truncate">
              Updated: {lastUpdate.toLocaleTimeString()} (auto-refreshes)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex rounded overflow-hidden text-sm">
            {([['', 'All'], ['M', 'Boys'], ['F', 'Girls']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setGenderFilter(val)}
                className={`px-3 py-1.5 font-medium transition ${genderFilter === val ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="bg-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 border-none outline-none hover:bg-gray-600 transition"
          >
            <option value="">All Grades</option>
            {allGrades.map(g => (
              <option key={g} value={String(g)}>Grade {g}</option>
            ))}
          </select>

          <select
            value={athleteFilter}
            onChange={e => setAthleteFilter(e.target.value)}
            className="bg-gray-700 text-gray-300 text-sm rounded px-3 py-1.5 border-none outline-none hover:bg-gray-600 transition"
          >
            <option value="">All Athletes</option>
            {allAthletes.map(a => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </select>

          <div className="flex rounded overflow-hidden text-sm">
            {([['', 'All'], ['automatic', 'AUTO'], ['provisional', 'PROV'], ['dnq', 'DNQ']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 font-medium transition ${statusFilter === val ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortAsc(prev => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-300 text-sm rounded font-medium hover:bg-gray-600 transition"
          >
            Sort {sortAsc ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        {eventsWithResults.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-4">&#127939;</div>
            <p className="text-xl">No results yet</p>
            <p>Results will appear here as coaches enter performances</p>
          </div>
        )}

        <div className="space-y-6">
          {eventsWithResults.map(event => (
            <div key={event.id} className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold">{event.name}</h2>
                <span className="text-sm text-gray-400">
                  {filteredResults[event.name].length} result{filteredResults[event.name].length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="text-white border-b border-gray-600 bg-gray-700/50 text-xs sm:text-sm uppercase tracking-wide">
                      <th className="text-left px-2 sm:px-4 py-2.5 w-8 sm:w-12 font-semibold">#</th>
                      <th className="text-left px-2 sm:px-4 py-2.5 font-semibold">Athlete</th>
                      <th className="text-center px-2 sm:px-4 py-2.5 w-12 sm:w-16 font-semibold">Bib</th>
                      <th className="text-center px-2 sm:px-4 py-2.5 w-16 hidden sm:table-cell font-semibold">Grade</th>
                      <th className="text-right px-2 sm:px-4 py-2.5 font-semibold">Result</th>
                      <th className="text-right px-2 sm:px-4 py-2.5 w-16 sm:w-20 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults[event.name].map((r, idx) => (
                      <tr key={r.id} className={`border-b border-gray-700/50 ${
                        r.qual_status === 'automatic' ? 'bg-green-900/20' :
                        r.qual_status === 'provisional' ? 'bg-yellow-900/15' : ''
                      }`}>
                        <td className="px-2 sm:px-4 py-2.5 text-white font-mono">{idx + 1}</td>
                        <td className="px-2 sm:px-4 py-2.5 font-semibold text-white">{r.first_name} {r.last_name}</td>
                        <td className="px-2 sm:px-4 py-2.5 text-center font-mono text-white">{r.bib_number ?? '—'}</td>
                        <td className="px-2 sm:px-4 py-2.5 text-center text-white hidden sm:table-cell">{r.grade}</td>
                        <td className="px-2 sm:px-4 py-2.5 text-right font-mono font-bold text-base sm:text-lg text-white">{r.display_value}</td>
                        <td className="px-2 sm:px-4 py-2.5 text-right">{qualBadge(r.qual_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {discretionAthletes.length > 0 && (
          <div className="mt-8">
            <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-purple-800/40 flex items-center gap-2">
                <h2 className="text-xl font-bold text-purple-200">Coach&apos;s Discretion</h2>
                <span className="text-sm text-purple-400">
                  {discretionAthletes.length} athlete{discretionAthletes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-purple-800/30">
                {discretionAthletes.map(({ athlete, rows }) => (
                  <div key={athlete.id} className="px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-purple-100">{athlete.name}</span>
                      <span className="font-mono text-sm text-purple-300">Bib {athlete.bib ?? '—'}</span>
                      <span className="text-sm text-purple-400">Grade {athlete.grade}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {rows.map(r => (
                        <div key={r.id} className="bg-purple-900/40 rounded px-3 py-1.5 text-sm">
                          <span className="text-purple-300">{r.event_name}:</span>{' '}
                          <span className="font-mono font-bold text-white">{r.display_value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {eventsWithoutResults.length > 0 && (
          <div className="mt-8">
            <h3 className="text-gray-500 text-sm mb-2">Upcoming Events (no results yet)</h3>
            <div className="flex flex-wrap gap-2">
              {eventsWithoutResults.map(e => (
                <span key={e.id} className="px-3 py-1 bg-gray-800 text-gray-400 rounded text-sm">{e.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
