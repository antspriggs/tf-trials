import { getDb } from '../db';
import { assignNextBib, unassignBib } from './bibs';
import type { Athlete } from '../types';

export function getAllAthletes(): Athlete[] {
  const db = getDb();
  return db.prepare('SELECT * FROM athletes ORDER BY last_name, first_name').all() as Athlete[];
}

export function getAthleteById(id: number): Athlete | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM athletes WHERE id = ?').get(id) as Athlete | undefined;
}

export function getAthleteByStudentId(studentId: string): Athlete | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM athletes WHERE student_id = ?').get(studentId) as Athlete | undefined;
}

export function getAthleteByBib(bibNumber: number): Athlete | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM athletes WHERE bib_number = ?').get(bibNumber) as Athlete | undefined;
}

/**
 * Register an athlete and atomically assign the next available bib number.
 * Returns the created athlete with bib, or throws if no bibs available.
 */
export function registerAthlete(data: {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: number;
  gender: 'M' | 'F';
}): Athlete {
  const db = getDb();

  const register = db.transaction(() => {
    // Insert athlete without bib first
    const result = db.prepare(
      'INSERT INTO athletes (student_id, first_name, last_name, grade, gender) VALUES (?, ?, ?, ?, ?)'
    ).run(data.student_id, data.first_name, data.last_name, data.grade, data.gender);

    const athleteId = result.lastInsertRowid as number;

    // Assign next available bib
    const bibNumber = assignNextBib(athleteId);
    if (bibNumber !== null) {
      db.prepare('UPDATE athletes SET bib_number = ? WHERE id = ?').run(bibNumber, athleteId);
    }

    return db.prepare('SELECT * FROM athletes WHERE id = ?').get(athleteId) as Athlete;
  });

  return register();
}

export function updateAthlete(id: number, updates: Partial<Omit<Athlete, 'id' | 'created_at'>>): Athlete | undefined {
  const db = getDb();
  const current = getAthleteById(id);
  if (!current) return undefined;

  const merged = { ...current, ...updates };
  db.prepare(
    'UPDATE athletes SET student_id = ?, first_name = ?, last_name = ?, grade = ?, gender = ? WHERE id = ?'
  ).run(merged.student_id, merged.first_name, merged.last_name, merged.grade, merged.gender, id);

  return getAthleteById(id);
}

export function deleteAthlete(id: number): boolean {
  const db = getDb();
  const athlete = getAthleteById(id);
  if (!athlete) return false;

  if (athlete.bib_number) {
    unassignBib(athlete.bib_number);
  }

  const result = db.prepare('DELETE FROM athletes WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getAthleteCount(): number {
  const db = getDb();
  return (db.prepare('SELECT COUNT(*) as count FROM athletes').get() as { count: number }).count;
}

export function searchAthletes(query: string): Athlete[] {
  const db = getDb();
  const like = `%${query}%`;
  return db.prepare(
    `SELECT * FROM athletes
     WHERE first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ? OR CAST(bib_number AS TEXT) LIKE ?
     ORDER BY last_name, first_name`
  ).all(like, like, like, like) as Athlete[];
}
