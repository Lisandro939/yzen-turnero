import 'dotenv/config';
import { createClient } from '@libsql/client';
import { businesses } from '../lib/mock-data';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function seed() {
  console.log('Seeding database...');

  // Businesses only — slots are computed on-the-fly from schedule config
  for (const biz of businesses) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO businesses
              (id, slug, name, description, owner_name, owner_email, category,
               image_url, working_days, working_hours_start, working_hours_end,
               slot_duration, base_price)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        biz.id, biz.slug, biz.name, biz.description,
        biz.ownerName, biz.ownerEmail, biz.category,
        biz.imageUrl ?? '',
        JSON.stringify(biz.workingDays),
        biz.workingHoursStart, biz.workingHoursEnd,
        biz.slotDuration, biz.basePrice,
      ],
    });
  }
  console.log(`✓ ${businesses.length} businesses inserted`);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
