'use client';

import { useEffect, useState } from 'react';

interface Event {
  id: number;
  name: string;
  type: 'time' | 'distance' | 'height';
  unit: string;
  auto_qualify: number | null;
  prov_qualify: number | null;
  auto_qualify_m: number | null;
  prov_qualify_m: number | null;
  auto_qualify_f: number | null;
  prov_qualify_f: number | null;
  sort_order: number;
}

interface EditValues {
  auto_qualify_m: string;
  prov_qualify_m: string;
  auto_qualify_f: string;
  prov_qualify_f: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ auto_qualify_m: '', prov_qualify_m: '', auto_qualify_f: '', prov_qualify_f: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', type: 'time', unit: 'seconds', sort_order: '99' });
  const [message, setMessage] = useState('');

  const loadEvents = () => {
    fetch('/api/events').then(r => r.json()).then(setEvents);
  };

  useEffect(() => { loadEvents(); }, []);

  const startEdit = (event: Event) => {
    setEditing(event.id);
    setEditValues({
      auto_qualify_m: event.auto_qualify_m !== null ? String(event.auto_qualify_m) : '',
      prov_qualify_m: event.prov_qualify_m !== null ? String(event.prov_qualify_m) : '',
      auto_qualify_f: event.auto_qualify_f !== null ? String(event.auto_qualify_f) : '',
      prov_qualify_f: event.prov_qualify_f !== null ? String(event.prov_qualify_f) : '',
    });
  };

  const saveEdit = async (eventId: number) => {
    await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auto_qualify_m: editValues.auto_qualify_m,
        prov_qualify_m: editValues.prov_qualify_m,
        auto_qualify_f: editValues.auto_qualify_f,
        prov_qualify_f: editValues.prov_qualify_f,
      }),
    });
    setEditing(null);
    setMessage('Standards updated. Qualifications recalculated.');
    loadEvents();
  };

  const addEvent = async () => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });
    if (res.ok) {
      setNewEvent({ name: '', type: 'time', unit: 'seconds', sort_order: '99' });
      setShowAdd(false);
      loadEvents();
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Delete this event? All performances for it will also be deleted.')) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    loadEvents();
  };

  const formatStandard = (val: number | null) => {
    if (val === null) return <span className="text-gray-400">—</span>;
    return <span className="font-medium">{val}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events & Standards</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {showAdd ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded mb-4">{message}</div>
      )}

      {showAdd && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input placeholder="Event Name" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value, unit: e.target.value === 'time' ? 'seconds' : 'feet' })} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="time">Time</option>
              <option value="distance">Distance</option>
              <option value="height">Height</option>
            </select>
            <input placeholder="Unit" value={newEvent.unit} onChange={e => setNewEvent({ ...newEvent, unit: e.target.value })} className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={addEvent} className="bg-green-600 text-white rounded hover:bg-green-700">Create</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium" rowSpan={2}>Event</th>
              <th className="text-left px-4 py-3 font-medium" rowSpan={2}>Type</th>
              <th className="text-center px-4 py-3 font-medium border-l border-gray-200" colSpan={2}>Boys (M)</th>
              <th className="text-center px-4 py-3 font-medium border-l border-gray-200" colSpan={2}>Girls (F)</th>
              <th className="text-right px-4 py-3 font-medium border-l border-gray-200" rowSpan={2}>Actions</th>
            </tr>
            <tr>
              <th className="text-center px-3 py-1 text-xs font-medium text-green-700 border-l border-gray-200">Auto</th>
              <th className="text-center px-3 py-1 text-xs font-medium text-yellow-700">Prov</th>
              <th className="text-center px-3 py-1 text-xs font-medium text-green-700 border-l border-gray-200">Auto</th>
              <th className="text-center px-3 py-1 text-xs font-medium text-yellow-700">Prov</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events.map(event => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{event.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    event.type === 'time' ? 'bg-blue-100 text-blue-700' :
                    event.type === 'distance' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>{event.type}</span>
                </td>
                <td className="px-4 py-3 text-center border-l border-gray-200">
                  {editing === event.id ? (
                    <input value={editValues.auto_qualify_m} onChange={e => setEditValues({ ...editValues, auto_qualify_m: e.target.value })} className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 12.5" />
                  ) : (
                    <span className={event.auto_qualify_m !== null ? 'text-green-700' : ''}>
                      {formatStandard(event.auto_qualify_m)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editing === event.id ? (
                    <input value={editValues.prov_qualify_m} onChange={e => setEditValues({ ...editValues, prov_qualify_m: e.target.value })} className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 13.0" />
                  ) : (
                    <span className={event.prov_qualify_m !== null ? 'text-yellow-700' : ''}>
                      {formatStandard(event.prov_qualify_m)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center border-l border-gray-200">
                  {editing === event.id ? (
                    <input value={editValues.auto_qualify_f} onChange={e => setEditValues({ ...editValues, auto_qualify_f: e.target.value })} className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 13.5" />
                  ) : (
                    <span className={event.auto_qualify_f !== null ? 'text-green-700' : ''}>
                      {formatStandard(event.auto_qualify_f)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editing === event.id ? (
                    <input value={editValues.prov_qualify_f} onChange={e => setEditValues({ ...editValues, prov_qualify_f: e.target.value })} className="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 14.0" />
                  ) : (
                    <span className={event.prov_qualify_f !== null ? 'text-yellow-700' : ''}>
                      {formatStandard(event.prov_qualify_f)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right border-l border-gray-200">
                  {editing === event.id ? (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => saveEdit(event.id)} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Save</button>
                      <button onClick={() => setEditing(null)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(event)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200">Edit Standards</button>
                      <button onClick={() => handleDeleteEvent(event.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
