import { sql, getClient } from '../db';
import type { Event } from '../types';

export async function getAllEvents(): Promise<Event[]> {
  const { rows } = await sql`SELECT * FROM events ORDER BY sort_order`;
  return rows as Event[];
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const { rows } = await sql`SELECT * FROM events WHERE id = ${id}`;
  return rows[0] as Event | undefined;
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event> {
  const { rows } = await sql`
    INSERT INTO events (name, type, unit, auto_qualify, prov_qualify, auto_qualify_m, prov_qualify_m, auto_qualify_f, prov_qualify_f, sort_order)
    VALUES (${event.name}, ${event.type}, ${event.unit}, ${event.auto_qualify}, ${event.prov_qualify}, ${event.auto_qualify_m}, ${event.prov_qualify_m}, ${event.auto_qualify_f}, ${event.prov_qualify_f}, ${event.sort_order})
    RETURNING id
  `;
  return { id: rows[0].id, ...event };
}

export async function updateEvent(id: number, updates: Partial<Omit<Event, 'id'>>): Promise<Event | undefined> {
  const current = await getEventById(id);
  if (!current) return undefined;

  const merged = { ...current, ...updates };
  await sql`
    UPDATE events SET name = ${merged.name}, type = ${merged.type}, unit = ${merged.unit},
      auto_qualify = ${merged.auto_qualify}, prov_qualify = ${merged.prov_qualify},
      auto_qualify_m = ${merged.auto_qualify_m}, prov_qualify_m = ${merged.prov_qualify_m},
      auto_qualify_f = ${merged.auto_qualify_f}, prov_qualify_f = ${merged.prov_qualify_f},
      sort_order = ${merged.sort_order}
    WHERE id = ${id}
  `;

  return { ...merged, id };
}

export async function deleteEvent(id: number): Promise<boolean> {
  const result = await sql`DELETE FROM events WHERE id = ${id}`;
  return (result.rowCount ?? 0) > 0;
}

export async function seedDefaultEvents(events: Omit<Event, 'id'>[]): Promise<void> {
  const { rows } = await sql`SELECT COUNT(*) as count FROM events`;
  if (Number(rows[0].count) > 0) return;

  const client = await getClient();
  try {
    await client.query('BEGIN');
    for (const e of events) {
      await client.query(
        'INSERT INTO events (name, type, unit, auto_qualify, prov_qualify, auto_qualify_m, prov_qualify_m, auto_qualify_f, prov_qualify_f, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [e.name, e.type, e.unit, e.auto_qualify ?? null, e.prov_qualify ?? null, e.auto_qualify_m ?? null, e.prov_qualify_m ?? null, e.auto_qualify_f ?? null, e.prov_qualify_f ?? null, e.sort_order]
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
