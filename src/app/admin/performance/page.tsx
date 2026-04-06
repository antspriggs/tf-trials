'use client';

import { useEffect, useState, useRef, useMemo } from 'react';

interface Athlete {
  id: number;
  first_name: string;
  last_name: string;
  bib_number: number | null;
}

interface Event {
  id: number;
  name: string;
  type: 'time' | 'distance' | 'height';
  unit: string;
}

interface Performance {
  id: number;
  athlete_id: number;
  event_id: number;
  raw_value: number;
  display_value: string;
  qual_status: string;
  created_at: string;
}

export default function PerformancePage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [recentPerfs, setRecentPerfs] = useState<Performance[]>([]);

  const [bibInput, setBibInput] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const bibRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/athletes').then(r => r.json()).then(setAthletes);
    fetch('/api/events').then(r => r.json()).then(setEvents);
    fetch('/api/performances').then(r => r.json()).then((p: Performance[]) => setRecentPerfs(p.slice(0, 20)));
  }, []);

  const selectedAthlete = useMemo(() => {
    const bib = parseInt(bibInput);
    if (isNaN(bib)) return null;
    return athletes.find(a => a.bib_number === bib) || null;
  }, [bibInput, athletes]);

  const bibError = useMemo(() => {
    const bib = parseInt(bibInput);
    if (isNaN(bib) || !bibInput.trim()) return null;
    const athlete = athletes.find(a => a.bib_number === bib);
    if (!athlete) return `No athlete with bib #${bib}`;
    return null;
  }, [bibInput, athletes]);

  const submit = async () => {
    if (!selectedAthlete || !selectedEvent || !value) {
      setMessage({ text: 'Fill in all fields', type: 'error' });
      return;
    }

    const res = await fetch('/api/performances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        athlete_id: selectedAthlete.id,
        event_id: parseInt(selectedEvent),
        value,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const qualLabel = data.qual_status === 'automatic' ? 'AUTO QUALIFY' :
                        data.qual_status === 'provisional' ? 'PROVISIONAL' : 'DNQ';
      const qualColor = data.qual_status === 'automatic' ? 'success' :
                        data.qual_status === 'provisional' ? 'warning' : 'error';
      setMessage({ text: `Recorded: ${data.display_value} — ${qualLabel}`, type: qualColor });
      setRecentPerfs(prev => [data, ...prev.slice(0, 19)]);
      // Reset for next entry
      setBibInput('');
      setValue('');
      bibRef.current?.focus();
    } else {
      setMessage({ text: data.error, type: 'error' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submit();
    }
  };

  const startEdit = (perf: Performance) => {
    setEditingId(perf.id);
    setEditValue(perf.display_value);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: number) => {
    const res = await fetch(`/api/performances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: editValue }),
    });
    const data = await res.json();
    if (res.ok) {
      setRecentPerfs(prev => prev.map(p => p.id === id ? data : p));
      setEditingId(null);
      setEditValue('');
      setMessage({ text: 'Performance updated', type: 'success' });
    } else {
      setMessage({ text: data.error || 'Failed to update', type: 'error' });
    }
  };

  const deletePerf = async (id: number) => {
    if (!confirm('Delete this performance?')) return;
    const res = await fetch(`/api/performances/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRecentPerfs(prev => prev.filter(p => p.id !== id));
      setMessage({ text: 'Performance deleted', type: 'success' });
    } else {
      const data = await res.json();
      setMessage({ text: data.error || 'Failed to delete', type: 'error' });
    }
  };

  const getEventName = (id: number) => events.find(e => e.id === id)?.name || 'Unknown';
  const getAthleteName = (id: number) => {
    const a = athletes.find(a => a.id === id);
    return a ? `${a.first_name} ${a.last_name}` : 'Unknown';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Enter Performance</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bib Number</label>
            <input
              ref={bibRef}
              type="text"
              value={bibInput}
              onChange={e => setBibInput(e.target.value)}
              placeholder="Enter bib #"
              className="w-full border border-gray-300 rounded px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {selectedAthlete && (
              <div className="mt-1 text-sm text-green-700 font-medium">
                {selectedAthlete.first_name} {selectedAthlete.last_name}
              </div>
            )}
            {bibError && (
              <div className="mt-1 text-sm text-red-600 font-medium">
                {bibError}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
            <select
              value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); valueRef.current?.focus(); }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select event</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value {selectedEvent && events.find(e => e.id === parseInt(selectedEvent)) &&
                `(${events.find(e => e.id === parseInt(selectedEvent))?.unit})`}
            </label>
            <input
              ref={valueRef}
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedEvent && events.find(e => e.id === parseInt(selectedEvent))?.type === 'time' ? 'e.g. 12.5 or 1:05.3' : 'e.g. 15.5 or 5\'10"'}
              className="w-full border border-gray-300 rounded px-3 py-2 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={submit}
            disabled={!selectedAthlete || !selectedEvent || !value}
            className="px-6 py-2 bg-blue-600 text-white rounded text-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Record
          </button>
        </div>

        {message && (
          <div className={`mt-4 px-4 py-2 rounded font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' :
              message.type === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="px-4 py-3 font-semibold text-gray-900 bg-gray-50 border-b border-gray-200">Recent Entries</h2>
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-2 font-medium">Athlete</th>
              <th className="text-left px-4 py-2 font-medium">Event</th>
              <th className="text-left px-4 py-2 font-medium">Value</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentPerfs.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{getAthleteName(p.athlete_id)}</td>
                <td className="px-4 py-2">{getEventName(p.event_id)}</td>
                <td className="px-4 py-2 font-mono">
                  {editingId === p.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(p.id); if (e.key === 'Escape') cancelEdit(); }}
                      className="w-28 border border-gray-300 rounded px-2 py-0.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    p.display_value
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    p.qual_status === 'automatic' ? 'bg-green-100 text-green-700' :
                    p.qual_status === 'provisional' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {p.qual_status === 'automatic' ? 'AUTO' : p.qual_status === 'provisional' ? 'PROV' : 'DNQ'}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {editingId === p.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(p.id)} className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                      <button onClick={cancelEdit} className="px-2 py-0.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(p)} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Edit</button>
                      <button onClick={() => deletePerf(p.id)} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {recentPerfs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No performances recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
