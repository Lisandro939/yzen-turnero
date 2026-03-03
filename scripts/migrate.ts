import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('Running migrations...');

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      email       TEXT PRIMARY KEY,
      role_chosen INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

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
      slot_id        TEXT,
      business_id    TEXT NOT NULL REFERENCES businesses(id),
      customer_name  TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL DEFAULT '',
      status         TEXT NOT NULL DEFAULT 'confirmed',
      created_at     TEXT NOT NULL
    );
  `);

  console.log('✓ Tables created successfully');

  // Add all optional columns (idempotent — silently skip if already exists)
  const alterStatements = [
    `ALTER TABLE businesses ADD COLUMN mp_access_token TEXT`,
    `ALTER TABLE businesses ADD COLUMN mp_refresh_token TEXT`,
    `ALTER TABLE businesses ADD COLUMN mp_user_id TEXT`,
    `ALTER TABLE bookings ADD COLUMN mp_preference_id TEXT`,
    `ALTER TABLE bookings ADD COLUMN mp_payment_id TEXT`,
    `ALTER TABLE businesses ADD COLUMN plan TEXT DEFAULT 'pro'`,
    `ALTER TABLE businesses ADD COLUMN plan_expires_at TEXT`,
    `ALTER TABLE businesses ADD COLUMN trial_ends_at TEXT`,
    // Slot-less architecture: denormalize slot data into bookings
    `ALTER TABLE bookings ADD COLUMN date TEXT`,
    `ALTER TABLE bookings ADD COLUMN start_time TEXT`,
    `ALTER TABLE bookings ADD COLUMN end_time TEXT`,
    `ALTER TABLE bookings ADD COLUMN price REAL`,
    `ALTER TABLE bookings ADD COLUMN service TEXT`,
    // Advanced schedule config for Max plan
    `ALTER TABLE businesses ADD COLUMN schedule_config TEXT`,
    // Multi-service architecture
    `ALTER TABLE bookings ADD COLUMN service_id TEXT`,
    `ALTER TABLE slot_blocks ADD COLUMN service_id TEXT`,
  ];
  for (const sql of alterStatements) {
    try {
      await db.execute(sql);
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate column name')) continue;
      throw err;
    }
  }
  console.log('✓ All columns added (or already existed)');

  // Backfill bookings date/time/price/service from slots (only if slots table still exists)
  try {
    await db.execute(`
      UPDATE bookings SET
        date       = (SELECT date       FROM slots WHERE slots.id = bookings.slot_id),
        start_time = (SELECT start_time FROM slots WHERE slots.id = bookings.slot_id),
        end_time   = (SELECT end_time   FROM slots WHERE slots.id = bookings.slot_id),
        price      = (SELECT price      FROM slots WHERE slots.id = bookings.slot_id),
        service    = (SELECT service    FROM slots WHERE slots.id = bookings.slot_id)
      WHERE slot_id IS NOT NULL AND date IS NULL
    `);
    console.log('✓ Bookings backfilled from slots');
  } catch (err) {
    if (err instanceof Error && err.message.includes('no such table')) {
      console.log('✓ Bookings backfill skipped (slots already dropped)');
    } else {
      throw err;
    }
  }

  // Create slot_blocks table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS slot_blocks (
      id          TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      date        TEXT NOT NULL,
      start_time  TEXT NOT NULL,
      end_time    TEXT NOT NULL,
      service_id  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ slot_blocks table created (or already existed)');

  // Create services table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id                  TEXT PRIMARY KEY,
      business_id         TEXT NOT NULL,
      name                TEXT NOT NULL,
      description         TEXT NOT NULL DEFAULT '',
      slot_duration       INTEGER NOT NULL DEFAULT 30,
      base_price          REAL NOT NULL DEFAULT 0,
      working_days        TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
      working_hours_start TEXT NOT NULL DEFAULT '09:00',
      working_hours_end   TEXT NOT NULL DEFAULT '18:00',
      schedule_config     TEXT,
      is_active           INTEGER NOT NULL DEFAULT 1,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  console.log('✓ services table created (or already existed)');

  // Backfill: create a default service for each business that has none
  await db.execute(`
    INSERT OR IGNORE INTO services
      (id, business_id, name, description, slot_duration, base_price,
       working_days, working_hours_start, working_hours_end, schedule_config)
    SELECT
      'svc-' || id, id, 'Servicio principal', '',
      slot_duration, base_price, working_days,
      working_hours_start, working_hours_end, schedule_config
    FROM businesses
  `);
  console.log('✓ Default services created for existing businesses');

  // Backfill service_id on existing bookings and slot_blocks
  await db.execute(`
    UPDATE bookings SET service_id = 'svc-' || business_id WHERE service_id IS NULL
  `);
  await db.execute(`
    UPDATE slot_blocks SET service_id = 'svc-' || business_id WHERE service_id IS NULL
  `);
  console.log('✓ service_id backfilled on bookings and slot_blocks');

  // Give trial period to any existing business that has none
  await db.execute(`
    UPDATE businesses
    SET trial_ends_at = datetime('now', '+30 days')
    WHERE trial_ends_at IS NULL AND plan_expires_at IS NULL
  `);
  console.log('✓ Trial set for existing businesses without a plan');

  // Drop legacy slots table (disable FK enforcement to allow drop)
  await db.executeMultiple(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS slots;
    PRAGMA foreign_keys = ON;
  `);
  console.log('✓ Legacy slots table dropped');

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
