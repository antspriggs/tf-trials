'use client';

import { useEffect, useState } from 'react';

interface ExportRow {
  first_name: string;
  last_name: string;
  student_id: string;
  grade: number;
  gender: string;
  bib_number: number | null;
  auto_qualified_events: string;
  prov_qualified_events: string;
}

export default function ExportPage() {
  const [data, setData] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/export')
      .then(r => r.text())
      .then(csv => {
        const lines = csv.split('\n').slice(1); // skip header
        const rows = lines.filter(l => l.trim()).map(line => {
          const cols: string[] = [];
          let i = 0;
          while (i < line.length) {
            if (line[i] === '"') {
              let j = i + 1;
              while (j < line.length) {
                if (line[j] === '"') {
                  if (line[j + 1] === '"') { j += 2; }
                  else { break; }
                } else { j++; }
              }
              cols.push(line.slice(i + 1, j).replace(/""/g, '"'));
              i = j + 2;
            } else {
              const next = line.indexOf(',', i);
              if (next === -1) { cols.push(line.slice(i)); break; }
              cols.push(line.slice(i, next));
              i = next + 1;
            }
          }
          return {
            first_name: cols[0] || '',
            last_name: cols[1] || '',
            student_id: cols[2] || '',
            grade: parseInt(cols[3]) || 0,
            gender: cols[4] || '',
            bib_number: cols[5] ? parseInt(cols[5]) : null,
            auto_qualified_events: cols[6] || '',
            prov_qualified_events: cols[7] || '',
          };
        });
        setData(rows);
        setLoading(false);
      });
  }, []);

  const downloadCSV = () => {
    window.open('/api/export', '_blank');
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Export Data</h1>
        <button onClick={downloadCSV} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Download CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Student ID</th>
              <th className="text-left px-4 py-3 font-medium">Grade</th>
              <th className="text-left px-4 py-3 font-medium">Gender</th>
              <th className="text-left px-4 py-3 font-medium">Bib</th>
              <th className="text-left px-4 py-3 font-medium">Auto-Qualified</th>
              <th className="text-left px-4 py-3 font-medium">Provisional</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{row.last_name}, {row.first_name}</td>
                <td className="px-4 py-2 text-gray-600">{row.student_id}</td>
                <td className="px-4 py-2">{row.grade}</td>
                <td className="px-4 py-2">{row.gender}</td>
                <td className="px-4 py-2 font-mono">{row.bib_number ?? '—'}</td>
                <td className="px-4 py-2">
                  {row.auto_qualified_events ? (
                    <span className="text-green-700">{row.auto_qualified_events}</span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-2">
                  {row.prov_qualified_events ? (
                    <span className="text-yellow-700">{row.prov_qualified_events}</span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No athletes to export</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
