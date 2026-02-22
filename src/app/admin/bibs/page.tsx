'use client';

import { useEffect, useState } from 'react';

interface Bib {
  bib_number: number;
  is_assigned: boolean;
  assigned_to: number | null;
}

export default function BibsPage() {
  const [bibs, setBibs] = useState<Bib[]>([]);
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState('50');
  const [customBibs, setCustomBibs] = useState('');
  const [message, setMessage] = useState('');

  const loadBibs = () => {
    fetch('/api/bibs').then(r => r.json()).then(setBibs);
  };

  useEffect(() => { loadBibs(); }, []);

  const addRange = async () => {
    const res = await fetch('/api/bibs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ range_start: rangeStart, range_end: rangeEnd }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Added ${data.added} bib numbers`);
      loadBibs();
    } else {
      setMessage(data.error);
    }
  };

  const addCustom = async () => {
    const numbers = customBibs.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (numbers.length === 0) { setMessage('Enter valid numbers'); return; }
    const res = await fetch('/api/bibs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bibs: numbers }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Added ${data.added} bib numbers`);
      setCustomBibs('');
      loadBibs();
    } else {
      setMessage(data.error);
    }
  };

  const deleteBib = async (bibNumber: number) => {
    if (!confirm(`Delete bib #${bibNumber}?`)) return;
    const res = await fetch(`/api/bibs/${bibNumber}`, { method: 'DELETE' });
    if (res.ok) {
      setMessage(`Deleted bib #${bibNumber}`);
      loadBibs();
    } else {
      const data = await res.json();
      setMessage(data.error || 'Failed to delete');
    }
  };

  const assigned = bibs.filter(b => b.is_assigned);
  const available = bibs.filter(b => !b.is_assigned);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bib Numbers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Add by Range</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start</label>
              <input
                type="number" min="1" value={rangeStart} onChange={e => setRangeStart(e.target.value)}
                className="w-20 sm:w-24 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End</label>
              <input
                type="number" min="1" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
                className="w-20 sm:w-24 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button onClick={addRange} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add Range
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Add Custom</h2>
          <div className="flex gap-2">
            <input
              type="text" value={customBibs} onChange={e => setCustomBibs(e.target.value)}
              placeholder="e.g. 101, 102, 103"
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={addCustom} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded mb-4">{message}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">Available ({available.length})</h2>
          <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
            {available.map(b => (
              <span key={b.bib_number} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-green-100 text-green-800 rounded text-sm">
                {b.bib_number}
                <button
                  onClick={() => deleteBib(b.bib_number)}
                  className="ml-0.5 text-green-600 hover:text-red-600 font-bold leading-none"
                  title={`Delete bib #${b.bib_number}`}
                >
                  &times;
                </button>
              </span>
            ))}
            {available.length === 0 && <p className="text-gray-400 text-sm">No bibs available</p>}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-2">Assigned ({assigned.length})</h2>
          <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
            {assigned.map(b => (
              <span key={b.bib_number} className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded text-sm">
                {b.bib_number}
              </span>
            ))}
            {assigned.length === 0 && <p className="text-gray-400 text-sm">No bibs assigned yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
