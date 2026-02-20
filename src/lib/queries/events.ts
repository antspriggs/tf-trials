import { getDb } from '../db';
import type { Event } from '../types';

export function getAllEvents(): Event[] {
  const db = getDb();
  return db.prepare('SELECT * FROM events ORDER BY sort_order').all() as Event[];
}

export function getEventById(id: number): Event | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
}

export function createEvent(event: Omit<Event, 'id'>): Event {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO events (name, type, unit, auto_qualify, prov_qualify, auto_qualify_m, prov_qualify_m, auto_qualify_f, prov_qualify_f, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(event.name, event.type, event.unit, event.auto_qualify, event.prov_qualify, event.auto_qualify_m, event.prov_qualify_m, event.auto_qualify_f, event.prov_qualify_f, event.sort_order);
  return { id: result.lastInsertRowid as number, ...event };
}

export function updateEvent(id: number, updates: Partial<Omit<Event, 'id'>>): Event | undefined {
  const db = getDb();
  const current = getEventById(id);
  if (!current) return undefined;

  const merged = { ...current, ...updates };
  db.prepare(
    'UPDATE events SET name = ?, type = ?, unit = ?, auto_qualify = ?, prov_qualify = ?, auto_qualify_m = ?, prov_qualify_m = ?, auto_qualify_f = ?, prov_qualify_f = ?, sort_order = ? WHERE id = ?'
  ).run(merged.name, merged.type, merged.unit, merged.auto_qualify, merged.prov_qualify, merged.auto_qualify_m, merged.prov_qualify_m, merged.auto_qualify_f, merged.prov_qualify_f, merged.sort_order, id);

  return { ...merged, id };
}

export function deleteEvent(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(id);
  return result.changes > 0;
}

export function seedDefaultEvents(events: Omit<Event, 'id'>[]): void {
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number }).count;
  if (count > 0) return;

  const insert = db.prepare(
    'INSERT INTO events (name, type, unit, auto_qualify, prov_qualify, auto_qualify_m, prov_qualify_m, auto_qualify_f, prov_qualify_f, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertAll = db.transaction((events: Omit<Event, 'id'>[]) => {
    for (const e of events) {
      insert.run(e.name, e.type, e.unit, e.auto_qualify ?? null, e.prov_qualify ?? null, e.auto_qualify_m ?? null, e.prov_qualify_m ?? null, e.auto_qualify_f ?? null, e.prov_qualify_f ?? null, e.sort_order);
    }
  });
  insertAll(events);
}
