import { Pool, type QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: process.env.VERCEL ? 1 : 10,
  ssl: process.env.POSTGRES_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

/**
 * Tagged template helper that mimics @vercel/postgres sql`...`
 * Usage: await sql`SELECT * FROM users WHERE id = ${id}`
 * Automatically parameterizes interpolated values as $1, $2, etc.
 */
export async function sql<T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) {
  const text = strings.reduce((prev, curr, i) => prev + '$' + i + curr);
  return pool.query<T>(text, values);
}

let schemaInitialized = false;

export async function initSchema() {
  if (schemaInitialized) return;

  // Create tables in correct order for FK dependencies
  // 1. events (no FK deps)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
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
    )
  `);

  // 2. bib_pool without assigned_to FK (athletes doesn't exist yet)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bib_pool (
      bib_number INTEGER PRIMARY KEY,
      is_assigned BOOLEAN NOT NULL DEFAULT FALSE,
      assigned_to INTEGER
    )
  `);

  // 3. athletes (references bib_pool)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS athletes (
      id SERIAL PRIMARY KEY,
      student_id TEXT NOT NULL UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK(gender IN ('M', 'F')),
      bib_number INTEGER REFERENCES bib_pool(bib_number),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 4. performances (references athletes and events)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS performances (
      id SERIAL PRIMARY KEY,
      athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      raw_value REAL NOT NULL,
      display_value TEXT NOT NULL,
      qual_status TEXT NOT NULL DEFAULT 'dnq' CHECK(qual_status IN ('automatic', 'provisional', 'dnq')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 5. Add FK from bib_pool.assigned_to -> athletes(id) if not already present
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bib_pool_assigned_to_fkey'
          AND table_name = 'bib_pool'
      ) THEN
        ALTER TABLE bib_pool
          ADD CONSTRAINT bib_pool_assigned_to_fkey
          FOREIGN KEY (assigned_to) REFERENCES athletes(id) ON DELETE SET NULL;
      END IF;
    END
    $$
  `);

  schemaInitialized = true;
}

export async function getClient() {
  await initSchema();
  return pool.connect();
}

export { pool };
export default initSchema;
