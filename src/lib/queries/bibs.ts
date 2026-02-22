import { sql, getClient } from '../db';
import type { Bib } from '../types';

export async function getAllBibs(): Promise<Bib[]> {
  const { rows } = await sql`SELECT * FROM bib_pool ORDER BY bib_number`;
  return rows as Bib[];
}

export async function getAvailableBibs(): Promise<Bib[]> {
  const { rows } = await sql`SELECT * FROM bib_pool WHERE is_assigned = FALSE ORDER BY bib_number`;
  return rows as Bib[];
}

export async function addBibRange(start: number, end: number): Promise<number> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    let count = 0;
    for (let i = start; i <= end; i++) {
      const result = await client.query(
        'INSERT INTO bib_pool (bib_number, is_assigned) VALUES ($1, FALSE) ON CONFLICT DO NOTHING',
        [i]
      );
      count += result.rowCount ?? 0;
    }
    await client.query('COMMIT');
    return count;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function addBibList(bibs: number[]): Promise<number> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    let count = 0;
    for (const bib of bibs) {
      const result = await client.query(
        'INSERT INTO bib_pool (bib_number, is_assigned) VALUES ($1, FALSE) ON CONFLICT DO NOTHING',
        [bib]
      );
      count += result.rowCount ?? 0;
    }
    await client.query('COMMIT');
    return count;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function assignNextBib(athleteId: number, client?: Awaited<ReturnType<typeof getClient>>): Promise<number | null> {
  const useClient = client ?? await getClient();
  try {
    if (!client) await useClient.query('BEGIN');

    const { rows } = await useClient.query(
      'SELECT bib_number FROM bib_pool WHERE is_assigned = FALSE ORDER BY bib_number LIMIT 1 FOR UPDATE'
    );

    if (rows.length === 0) {
      if (!client) await useClient.query('COMMIT');
      return null;
    }

    await useClient.query(
      'UPDATE bib_pool SET is_assigned = TRUE, assigned_to = $1 WHERE bib_number = $2',
      [athleteId, rows[0].bib_number]
    );

    if (!client) await useClient.query('COMMIT');
    return rows[0].bib_number;
  } catch (err) {
    if (!client) await useClient.query('ROLLBACK');
    throw err;
  } finally {
    if (!client) useClient.release();
  }
}

export async function unassignBib(bibNumber: number): Promise<void> {
  await sql`UPDATE bib_pool SET is_assigned = FALSE, assigned_to = NULL WHERE bib_number = ${bibNumber}`;
}

export async function deleteBib(bibNumber: number): Promise<boolean> {
  const result = await sql`DELETE FROM bib_pool WHERE bib_number = ${bibNumber} AND is_assigned = FALSE`;
  return (result.rowCount ?? 0) > 0;
}

export async function getBibStats(): Promise<{ total: number; assigned: number; available: number }> {
  const totalResult = await sql`SELECT COUNT(*) as count FROM bib_pool`;
  const assignedResult = await sql`SELECT COUNT(*) as count FROM bib_pool WHERE is_assigned = TRUE`;
  const total = Number(totalResult.rows[0].count);
  const assigned = Number(assignedResult.rows[0].count);
  return { total, assigned, available: total - assigned };
}
