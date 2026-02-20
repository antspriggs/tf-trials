import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'tryouts.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('time', 'distance', 'height')),
      unit TEXT NOT NULL DEFAULT 'seconds',
      auto_qualify REAL,
      prov_qualify REAL,
      auto_qualify_m REAL,
      prov_qualify_m REAL,
      auto_qualify_f REAL,
      prov_qualify_f REAL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bib_pool (
      bib_number INTEGER PRIMARY KEY,
      is_assigned INTEGER NOT NULL DEFAULT 0,
      assigned_to INTEGER REFERENCES athletes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS athletes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('M', 'F')),
      bib_number INTEGER REFERENCES bib_pool(bib_number),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS performances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      raw_value REAL NOT NULL,
      display_value TEXT NOT NULL,
      qual_status TEXT NOT NULL DEFAULT 'dnq' CHECK(qual_status IN ('automatic', 'provisional', 'dnq')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migration: add gender-specific qualification columns to existing databases
  migrateGenderQualColumns(db);
}

function migrateGenderQualColumns(db: Database.Database) {
  const columns = db.pragma('table_info(events)') as Array<{ name: string }>;
  const columnNames = columns.map(c => c.name);
  if (columnNames.includes('auto_qualify_m')) return; // already migrated

  db.exec('ALTER TABLE events ADD COLUMN auto_qualify_m REAL');
  db.exec('ALTER TABLE events ADD COLUMN prov_qualify_m REAL');
  db.exec('ALTER TABLE events ADD COLUMN auto_qualify_f REAL');
  db.exec('ALTER TABLE events ADD COLUMN prov_qualify_f REAL');

  // Copy existing gender-neutral standards to both M and F
  db.exec(`
    UPDATE events SET
      auto_qualify_m = auto_qualify,
      prov_qualify_m = prov_qualify,
      auto_qualify_f = auto_qualify,
      prov_qualify_f = prov_qualify
  `);
}

export default getDb;
