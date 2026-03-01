import 'dotenv/config';
import { createClient } from '@libsql/client';
import { businesses, slots, bookings } from '../lib/mock-data';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function seed() {
  console.log('Seeding database...');

  // Businesses
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

  // Slots
  for (const slot of slots) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO slots
              (id, business_id, date, start_time, end_time, price, status, service)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [
        slot.id, slot.businessId, slot.date, slot.startTime,
        slot.endTime, slot.price, slot.status, slot.service ?? null,
      ],
    });
  }
  console.log(`✓ ${slots.length} slots inserted`);

  // Bookings
  for (const booking of bookings) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO bookings
              (id, slot_id, business_id, customer_name, customer_email,
               customer_phone, status, created_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [
        booking.id, booking.slotId, booking.businessId,
        booking.customerName, booking.customerEmail, booking.customerPhone,
        booking.status, booking.createdAt,
      ],
    });
  }
  console.log(`✓ ${bookings.length} bookings inserted`);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
