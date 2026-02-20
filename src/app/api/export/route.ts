import { NextResponse } from 'next/server';
import { getExportData } from '@/lib/queries/performances';

export function GET() {
  const data = getExportData();

  const headers = ['First Name', 'Last Name', 'Student ID', 'Grade', 'Gender', 'Bib Number', 'Auto-Qualified Events', 'Provisionally-Qualified Events'];
  const rows = data.map(d => [
    d.first_name,
    d.last_name,
    d.student_id,
    String(d.grade),
    d.gender,
    d.bib_number !== null ? String(d.bib_number) : '',
    d.auto_qualified_events,
    d.prov_qualified_events,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="tryouts-export.csv"',
    },
  });
}
