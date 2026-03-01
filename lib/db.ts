import { createClient } from '@libsql/client';
import type { Business, Slot, Booking, BusinessCategory } from '@/types';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

type DbRow = Record<string, unknown>;

export function rowToBusiness(row: DbRow): Business {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    ownerName: String(row.owner_name),
    ownerEmail: String(row.owner_email),
    category: String(row.category) as BusinessCategory,
    imageUrl: String(row.image_url ?? ''),
    workingDays: JSON.parse(String(row.working_days ?? '[]')),
    workingHoursStart: String(row.working_hours_start),
    workingHoursEnd: String(row.working_hours_end),
    slotDuration: Number(row.slot_duration) as 30 | 45 | 60,
    basePrice: Number(row.base_price),
    mpAccessToken: row.mp_access_token != null ? String(row.mp_access_token) : undefined,
    mpRefreshToken: row.mp_refresh_token != null ? String(row.mp_refresh_token) : undefined,
    mpUserId: row.mp_user_id != null ? String(row.mp_user_id) : undefined,
  };
}

export function rowToSlot(row: DbRow): Slot {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    price: Number(row.price),
    status: String(row.status) as Slot['status'],
    service: row.service != null ? String(row.service) : undefined,
  };
}

export function rowToBooking(row: DbRow): Booking {
  return {
    id: String(row.id),
    slotId: String(row.slot_id),
    businessId: String(row.business_id),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone ?? ''),
    status: String(row.status) as Booking['status'],
    createdAt: String(row.created_at),
    mpPreferenceId: row.mp_preference_id != null ? String(row.mp_preference_id) : undefined,
    mpPaymentId: row.mp_payment_id != null ? String(row.mp_payment_id) : undefined,
  };
}
