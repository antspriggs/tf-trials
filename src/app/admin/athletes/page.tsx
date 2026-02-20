'use client';

import { useEffect, useState } from 'react';

interface Athlete {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  grade: number;
  gender: 'M' | 'F';
  bib_number: number | null;
  created_at: string;
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterGender, setFilterGender] = useState('');

  const loadAthletes = () => {
    const params = search ? `?q=${encodeURIComponent(search)}` : '';
    fetch(`/api/athletes${params}`).then(r => r.json()).then(setAthletes);
  };

  useEffect(() => { loadAthletes(); }, [search]);

  const deleteAthlete = async (id: number) => {
    if (!confirm('Delete this athlete? Their performances will also be deleted.')) return;
    await fetch(`/api/athletes/${id}`, { method: 'DELETE' });
    loadAthletes();
  };

  const filtered = athletes.filter(a => {
    if (filterGrade && a.grade !== parseInt(filterGrade)) return false;
    if (filterGender && a.gender !== filterGender) return false;
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Athletes ({filtered.length})</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text" placeholder="Search name, ID, or bib..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3">
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="flex-1 sm:flex-none border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Grades</option>
            {[9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="flex-1 sm:flex-none border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Genders</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Bib</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Student ID</th>
              <th className="text-left px-4 py-3 font-medium">Grade</th>
              <th className="text-left px-4 py-3 font-medium">Gender</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                    {a.bib_number ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{a.last_name}, {a.first_name}</td>
                <td className="px-4 py-3 text-gray-600">{a.student_id}</td>
                <td className="px-4 py-3">{a.grade}</td>
                <td className="px-4 py-3">{a.gender}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => deleteAthlete(a.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No athletes found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
