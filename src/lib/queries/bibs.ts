import { getDb } from '../db';
import type { Bib } from '../types';

export function getAllBibs(): Bib[] {
  const db = getDb();
  return db.prepare('SELECT * FROM bib_pool ORDER BY bib_number').all() as Bib[];
}

export function getAvailableBibs(): Bib[] {
  const db = getDb();
  return db.prepare('SELECT * FROM bib_pool WHERE is_assigned = 0 ORDER BY bib_number').all() as Bib[];
}

export function addBibRange(start: number, end: number): number {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO bib_pool (bib_number, is_assigned) VALUES (?, 0)'
  );
  const insertMany = db.transaction((start: number, end: number) => {
    let count = 0;
    for (let i = start; i <= end; i++) {
      const result = insert.run(i);
      count += result.changes;
    }
    return count;
  });
  return insertMany(start, end);
}

export function addBibList(bibs: number[]): number {
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO bib_pool (bib_number, is_assigned) VALUES (?, 0)'
  );
  const insertMany = db.transaction((bibs: number[]) => {
    let count = 0;
    for (const bib of bibs) {
      const result = insert.run(bib);
      count += result.changes;
    }
    return count;
  });
  return insertMany(bibs);
}

export function assignNextBib(athleteId: number): number | null {
  const db = getDb();
  const assign = db.transaction(() => {
    const bib = db.prepare(
      'SELECT bib_number FROM bib_pool WHERE is_assigned = 0 ORDER BY bib_number LIMIT 1'
    ).get() as { bib_number: number } | undefined;

    if (!bib) return null;

    db.prepare(
      'UPDATE bib_pool SET is_assigned = 1, assigned_to = ? WHERE bib_number = ?'
    ).run(athleteId, bib.bib_number);

    return bib.bib_number;
  });
  return assign();
}

export function unassignBib(bibNumber: number): void {
  const db = getDb();
  db.prepare(
    'UPDATE bib_pool SET is_assigned = 0, assigned_to = NULL WHERE bib_number = ?'
  ).run(bibNumber);
}

export function getBibStats(): { total: number; assigned: number; available: number } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM bib_pool').get() as { count: number }).count;
  const assigned = (db.prepare('SELECT COUNT(*) as count FROM bib_pool WHERE is_assigned = 1').get() as { count: number }).count;
  return { total, assigned, available: total - assigned };
}
