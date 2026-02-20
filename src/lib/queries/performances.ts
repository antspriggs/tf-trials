import { getDb } from '../db';
import { getEventById } from './events';
import { getAthleteById } from './athletes';
import { determineQualification } from '../utils/qualification';
import type { Performance, ResultRow } from '../types';

export function getAllPerformances(): Performance[] {
  const db = getDb();
  return db.prepare('SELECT * FROM performances ORDER BY created_at DESC').all() as Performance[];
}

export function getPerformanceById(id: number): Performance | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM performances WHERE id = ?').get(id) as Performance | undefined;
}

export function getPerformancesByAthlete(athleteId: number): Performance[] {
  const db = getDb();
  return db.prepare('SELECT * FROM performances WHERE athlete_id = ?').all(athleteId) as Performance[];
}

export function getPerformancesByEvent(eventId: number): Performance[] {
  const db = getDb();
  return db.prepare('SELECT * FROM performances WHERE event_id = ?').all(eventId) as Performance[];
}

export function createPerformance(data: {
  athlete_id: number;
  event_id: number;
  raw_value: number;
  display_value: string;
}): Performance {
  const db = getDb();
  const event = getEventById(data.event_id);
  if (!event) throw new Error('Event not found');

  const athlete = getAthleteById(data.athlete_id);
  const qualStatus = determineQualification(data.raw_value, event, athlete?.gender);

  const result = db.prepare(
    'INSERT INTO performances (athlete_id, event_id, raw_value, display_value, qual_status) VALUES (?, ?, ?, ?, ?)'
  ).run(data.athlete_id, data.event_id, data.raw_value, data.display_value, qualStatus);

  return db.prepare('SELECT * FROM performances WHERE id = ?').get(result.lastInsertRowid) as Performance;
}

export function updatePerformance(id: number, data: {
  raw_value: number;
  display_value: string;
}): Performance | undefined {
  const db = getDb();
  const current = getPerformanceById(id);
  if (!current) return undefined;

  const event = getEventById(current.event_id);
  if (!event) return undefined;

  const athlete = getAthleteById(current.athlete_id);
  const qualStatus = determineQualification(data.raw_value, event, athlete?.gender);

  db.prepare(
    'UPDATE performances SET raw_value = ?, display_value = ?, qual_status = ? WHERE id = ?'
  ).run(data.raw_value, data.display_value, qualStatus, id);

  return getPerformanceById(id);
}

export function deletePerformance(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM performances WHERE id = ?').run(id);
  return result.changes > 0;
}

/**
 * Get results for all events with athlete info, sorted by ranking.
 * Time events: ascending. Distance/height: descending.
 */
export function getResults(): Record<string, ResultRow[]> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      p.id, p.athlete_id, p.event_id, p.raw_value, p.display_value, p.qual_status,
      a.first_name, a.last_name, a.bib_number, a.grade, a.gender,
      e.name as event_name, e.type as event_type, e.unit as event_unit
    FROM performances p
    JOIN athletes a ON p.athlete_id = a.id
    JOIN events e ON p.event_id = e.id
    ORDER BY e.sort_order,
      CASE WHEN e.type = 'time' THEN p.raw_value END ASC,
      CASE WHEN e.type != 'time' THEN p.raw_value END DESC
  `).all() as ResultRow[];

  const grouped: Record<string, ResultRow[]> = {};
  for (const row of rows) {
    if (!grouped[row.event_name]) {
      grouped[row.event_name] = [];
    }
    grouped[row.event_name].push(row);
  }
  return grouped;
}

/**
 * Recalculate qualification status for all performances of a given event.
 * Called when event standards are updated.
 */
export function recalculateQualifications(eventId: number): void {
  const db = getDb();
  const event = getEventById(eventId);
  if (!event) return;

  const performances = getPerformancesByEvent(eventId);
  const update = db.prepare(
    'UPDATE performances SET qual_status = ? WHERE id = ?'
  );

  const recalc = db.transaction(() => {
    for (const perf of performances) {
      const athlete = getAthleteById(perf.athlete_id);
      const newStatus = determineQualification(perf.raw_value, event, athlete?.gender);
      update.run(newStatus, perf.id);
    }
  });
  recalc();
}

export function getPerformanceCount(): number {
  const db = getDb();
  return (db.prepare('SELECT COUNT(*) as count FROM performances').get() as { count: number }).count;
}

/**
 * Get export data: athletes with their qualification results aggregated.
 */
export function getExportData() {
  const db = getDb();
  const athletes = db.prepare('SELECT * FROM athletes ORDER BY last_name, first_name').all() as Array<{
    id: number; student_id: string; first_name: string; last_name: string;
    grade: number; gender: string; bib_number: number | null;
  }>;

  return athletes.map(a => {
    const autoEvents = db.prepare(`
      SELECT DISTINCT e.name FROM performances p
      JOIN events e ON p.event_id = e.id
      WHERE p.athlete_id = ? AND p.qual_status = 'automatic'
      ORDER BY e.sort_order
    `).all(a.id) as Array<{ name: string }>;

    const provEvents = db.prepare(`
      SELECT DISTINCT e.name FROM performances p
      JOIN events e ON p.event_id = e.id
      WHERE p.athlete_id = ? AND p.qual_status = 'provisional'
      ORDER BY e.sort_order
    `).all(a.id) as Array<{ name: string }>;

    return {
      first_name: a.first_name,
      last_name: a.last_name,
      student_id: a.student_id,
      grade: a.grade,
      gender: a.gender,
      bib_number: a.bib_number,
      auto_qualified_events: autoEvents.map(e => e.name).join(', '),
      prov_qualified_events: provEvents.map(e => e.name).join(', '),
    };
  });
}
