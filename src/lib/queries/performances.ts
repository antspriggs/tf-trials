import { sql, getClient } from '../db';
import { getEventById } from './events';
import { getAthleteById } from './athletes';
import { determineQualification } from '../utils/qualification';
import type { Performance, ResultRow } from '../types';

export async function getAllPerformances(): Promise<Performance[]> {
  const { rows } = await sql`SELECT * FROM performances ORDER BY created_at DESC`;
  return rows as Performance[];
}

export async function getPerformanceById(id: number): Promise<Performance | undefined> {
  const { rows } = await sql`SELECT * FROM performances WHERE id = ${id}`;
  return rows[0] as Performance | undefined;
}

export async function getPerformancesByAthlete(athleteId: number): Promise<Performance[]> {
  const { rows } = await sql`SELECT * FROM performances WHERE athlete_id = ${athleteId}`;
  return rows as Performance[];
}

export async function getPerformancesByEvent(eventId: number): Promise<Performance[]> {
  const { rows } = await sql`SELECT * FROM performances WHERE event_id = ${eventId}`;
  return rows as Performance[];
}

export async function createPerformance(data: {
  athlete_id: number;
  event_id: number;
  raw_value: number;
  display_value: string;
}): Promise<Performance> {
  const event = await getEventById(data.event_id);
  if (!event) throw new Error('Event not found');

  const athlete = await getAthleteById(data.athlete_id);
  const qualStatus = determineQualification(data.raw_value, event, athlete?.gender);

  const { rows } = await sql`
    INSERT INTO performances (athlete_id, event_id, raw_value, display_value, qual_status)
    VALUES (${data.athlete_id}, ${data.event_id}, ${data.raw_value}, ${data.display_value}, ${qualStatus})
    RETURNING *
  `;
  return rows[0] as Performance;
}

export async function updatePerformance(id: number, data: {
  raw_value: number;
  display_value: string;
}): Promise<Performance | undefined> {
  const current = await getPerformanceById(id);
  if (!current) return undefined;

  const event = await getEventById(current.event_id);
  if (!event) return undefined;

  const athlete = await getAthleteById(current.athlete_id);
  const qualStatus = determineQualification(data.raw_value, event, athlete?.gender);

  await sql`
    UPDATE performances SET raw_value = ${data.raw_value}, display_value = ${data.display_value}, qual_status = ${qualStatus}
    WHERE id = ${id}
  `;

  return getPerformanceById(id);
}

export async function deletePerformance(id: number): Promise<boolean> {
  const result = await sql`DELETE FROM performances WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

export async function getResults(): Promise<Record<string, ResultRow[]>> {
  const { rows } = await sql`
    SELECT
      p.id, p.athlete_id, p.event_id, p.raw_value, p.display_value, p.qual_status,
      a.first_name, a.last_name, a.bib_number, a.grade, a.gender, a.coaches_discretion,
      e.name as event_name, e.type as event_type, e.unit as event_unit
    FROM performances p
    JOIN athletes a ON p.athlete_id = a.id
    JOIN events e ON p.event_id = e.id
    ORDER BY e.sort_order,
      CASE WHEN e.type = 'time' THEN p.raw_value END ASC,
      CASE WHEN e.type != 'time' THEN p.raw_value END DESC
  `;

  const grouped: Record<string, ResultRow[]> = {};
  for (const row of rows as ResultRow[]) {
    if (!grouped[row.event_name]) {
      grouped[row.event_name] = [];
    }
    grouped[row.event_name].push(row);
  }
  return grouped;
}

export async function recalculateQualifications(eventId: number): Promise<void> {
  const event = await getEventById(eventId);
  if (!event) return;

  const performances = await getPerformancesByEvent(eventId);

  const client = await getClient();
  try {
    await client.query('BEGIN');
    for (const perf of performances) {
      const athlete = await getAthleteById(perf.athlete_id);
      const newStatus = determineQualification(perf.raw_value, event, athlete?.gender);
      await client.query(
        'UPDATE performances SET qual_status = $1 WHERE id = $2',
        [newStatus, perf.id]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getPerformanceCount(): Promise<number> {
  const { rows } = await sql`SELECT COUNT(*) as count FROM performances`;
  return Number(rows[0].count);
}

export async function getExportData() {
  const { rows } = await sql`
    SELECT
      a.first_name, a.last_name, a.student_id, a.grade, a.gender, a.bib_number, a.coaches_discretion,
      STRING_AGG(DISTINCT e.name, ', ') FILTER (WHERE p.qual_status = 'automatic') as auto_qualified_events,
      STRING_AGG(DISTINCT e.name, ', ') FILTER (WHERE p.qual_status = 'provisional') as prov_qualified_events
    FROM athletes a
    LEFT JOIN performances p ON p.athlete_id = a.id
    LEFT JOIN events e ON p.event_id = e.id
    GROUP BY a.id, a.first_name, a.last_name, a.student_id, a.grade, a.gender, a.bib_number, a.coaches_discretion
    ORDER BY a.last_name, a.first_name
  `;

  return rows.map(r => ({
    first_name: r.first_name,
    last_name: r.last_name,
    student_id: r.student_id,
    grade: r.grade,
    gender: r.gender,
    bib_number: r.bib_number,
    auto_qualified_events: r.auto_qualified_events || '',
    prov_qualified_events: r.prov_qualified_events || '',
    coaches_discretion: r.coaches_discretion || false,
  }));
}
