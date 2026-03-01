import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('Running migrations...');

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS businesses (
      id                  TEXT PRIMARY KEY,
      slug                TEXT UNIQUE NOT NULL,
      name                TEXT NOT NULL,
      description         TEXT NOT NULL DEFAULT '',
      owner_name          TEXT NOT NULL,
      owner_email         TEXT NOT NULL,
      category            TEXT NOT NULL,
      image_url           TEXT NOT NULL DEFAULT '',
      working_days        TEXT NOT NULL DEFAULT '[]',
      working_hours_start TEXT NOT NULL DEFAULT '09:00',
      working_hours_end   TEXT NOT NULL DEFAULT '18:00',
      slot_duration       INTEGER NOT NULL DEFAULT 60,
      base_price          REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS slots (
      id          TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id),
      date        TEXT NOT NULL,
      start_time  TEXT NOT NULL,
      end_time    TEXT NOT NULL,
      price       REAL NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'open',
      service     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id             TEXT PRIMARY KEY,
      slot_id        TEXT NOT NULL REFERENCES slots(id),
      business_id    TEXT NOT NULL REFERENCES businesses(id),
      customer_name  TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL DEFAULT '',
      status         TEXT NOT NULL DEFAULT 'confirmed',
      created_at     TEXT NOT NULL
    );
  `);

  console.log('✓ Tables created successfully');

  // Add MP columns (idempotent — silently skip if already exists)
  const alterStatements = [
    `ALTER TABLE businesses ADD COLUMN mp_access_token TEXT`,
    `ALTER TABLE businesses ADD COLUMN mp_refresh_token TEXT`,
    `ALTER TABLE businesses ADD COLUMN mp_user_id TEXT`,
    `ALTER TABLE bookings ADD COLUMN mp_preference_id TEXT`,
    `ALTER TABLE bookings ADD COLUMN mp_payment_id TEXT`,
  ];
  for (const sql of alterStatements) {
    try {
      await db.execute(sql);
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate column name')) continue;
      throw err;
    }
  }
  console.log('✓ MP columns added (or already existed)');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
