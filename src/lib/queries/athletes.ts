import { sql, getClient } from '../db';
import { assignNextBib, unassignBib } from './bibs';
import type { Athlete } from '../types';

export async function getAllAthletes(): Promise<Athlete[]> {
  const { rows } = await sql`SELECT * FROM athletes ORDER BY last_name, first_name`;
  return rows as Athlete[];
}

export async function getAthleteById(id: number): Promise<Athlete | undefined> {
  const { rows } = await sql`SELECT * FROM athletes WHERE id = ${id}`;
  return rows[0] as Athlete | undefined;
}

export async function getAthleteByStudentId(studentId: string): Promise<Athlete | undefined> {
  const { rows } = await sql`SELECT * FROM athletes WHERE student_id = ${studentId}`;
  return rows[0] as Athlete | undefined;
}

export async function getAthleteByBib(bibNumber: number): Promise<Athlete | undefined> {
  const { rows } = await sql`SELECT * FROM athletes WHERE bib_number = ${bibNumber}`;
  return rows[0] as Athlete | undefined;
}

export async function registerAthlete(data: {
  student_id: string;
  first_name: string;
  last_name: string;
  grade: number;
  gender: 'M' | 'F';
}): Promise<Athlete> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const insertResult = await client.query(
      'INSERT INTO athletes (student_id, first_name, last_name, grade, gender) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [data.student_id, data.first_name, data.last_name, data.grade, data.gender]
    );
    const athleteId = insertResult.rows[0].id;

    const bibNumber = await assignNextBib(athleteId, client);
    if (bibNumber !== null) {
      await client.query(
        'UPDATE athletes SET bib_number = $1 WHERE id = $2',
        [bibNumber, athleteId]
      );
    }

    const { rows } = await client.query('SELECT * FROM athletes WHERE id = $1', [athleteId]);
    await client.query('COMMIT');
    return rows[0] as Athlete;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateAthlete(id: number, updates: Partial<Omit<Athlete, 'id' | 'created_at'>>): Promise<Athlete | undefined> {
  const current = await getAthleteById(id);
  if (!current) return undefined;

  const merged = { ...current, ...updates };
  await sql`
    UPDATE athletes SET student_id = ${merged.student_id}, first_name = ${merged.first_name},
      last_name = ${merged.last_name}, grade = ${merged.grade}, gender = ${merged.gender},
      coaches_discretion = ${merged.coaches_discretion}
    WHERE id = ${id}
  `;

  return getAthleteById(id);
}

export async function deleteAthlete(id: number): Promise<boolean> {
  const athlete = await getAthleteById(id);
  if (!athlete) return false;

  if (athlete.bib_number) {
    await unassignBib(athlete.bib_number);
  }

  const result = await sql`DELETE FROM athletes WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

export async function getAthleteCount(): Promise<number> {
  const { rows } = await sql`SELECT COUNT(*) as count FROM athletes`;
  return Number(rows[0].count);
}

export async function searchAthletes(query: string): Promise<Athlete[]> {
  const like = `%${query}%`;
  const { rows } = await sql`
    SELECT * FROM athletes
    WHERE first_name ILIKE ${like} OR last_name ILIKE ${like} OR student_id ILIKE ${like} OR CAST(bib_number AS TEXT) ILIKE ${like}
    ORDER BY last_name, first_name
  `;
  return rows as Athlete[];
}
