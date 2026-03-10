import { createClient } from '@libsql/client';
import type { Business, Service, SlotBlock, Booking, BusinessCategory } from '@/types';

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
    slotDuration: Number(row.slot_duration) as 20 | 30 | 40 | 50 | 60 | 90 | 120,
    basePrice: Number(row.base_price),
    mpAccessToken: row.mp_access_token != null ? String(row.mp_access_token) : undefined,
    mpRefreshToken: row.mp_refresh_token != null ? String(row.mp_refresh_token) : undefined,
    mpUserId: row.mp_user_id != null ? String(row.mp_user_id) : undefined,
    plan: row.plan != null ? (String(row.plan) as 'pro' | 'max') : undefined,
    planExpiresAt: row.plan_expires_at != null ? String(row.plan_expires_at) : undefined,
    trialEndsAt: row.trial_ends_at != null ? String(row.trial_ends_at) : undefined,
    scheduleConfig: row.schedule_config != null ? JSON.parse(String(row.schedule_config)) : undefined,
    brandColor: row.brand_color != null ? String(row.brand_color) : undefined,
    whatsapp: row.whatsapp != null ? String(row.whatsapp) : undefined,
    instagram: row.instagram != null ? String(row.instagram) : undefined,
    facebook: row.facebook != null ? String(row.facebook) : undefined,
    twitter: row.twitter != null ? String(row.twitter) : undefined,
  };
}

export function rowToService(row: DbRow): Service {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    name: String(row.name),
    description: String(row.description ?? ''),
    slotDuration: Number(row.slot_duration) as 20 | 30 | 40 | 50 | 60 | 90 | 120,
    basePrice: Number(row.base_price),
    workingDays: JSON.parse(String(row.working_days ?? '[]')),
    workingHoursStart: String(row.working_hours_start),
    workingHoursEnd: String(row.working_hours_end),
    scheduleConfig: row.schedule_config != null ? JSON.parse(String(row.schedule_config)) : undefined,
    isActive: Number(row.is_active) !== 0,
    createdAt: String(row.created_at),
  };
}

export function rowToSlotBlock(row: DbRow): SlotBlock {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    serviceId: row.service_id != null ? String(row.service_id) : String(row.business_id),
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
  };
}

export function rowToBooking(row: DbRow): Booking {
  return {
    id: String(row.id),
    slotId: row.slot_id != null ? String(row.slot_id) : null,
    businessId: String(row.business_id),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone ?? ''),
    status: String(row.status) as Booking['status'],
    createdAt: String(row.created_at),
    mpPreferenceId: row.mp_preference_id != null ? String(row.mp_preference_id) : undefined,
    mpPaymentId: row.mp_payment_id != null ? String(row.mp_payment_id) : undefined,
    date: row.date != null ? String(row.date) : undefined,
    startTime: row.start_time != null ? String(row.start_time) : undefined,
    endTime: row.end_time != null ? String(row.end_time) : undefined,
    price: row.price != null ? Number(row.price) : undefined,
    service: row.service != null ? String(row.service) : undefined,
    serviceId: row.service_id != null ? String(row.service_id) : undefined,
  };
}
