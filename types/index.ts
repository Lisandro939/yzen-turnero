export type BusinessCategory =
  | 'Barbería'
  | 'Medicina'
  | 'Entrenamiento'
  | 'Belleza'
  | 'Odontología'
  | 'Psicología'
  | 'Nutrición'
  | 'Yoga'
  | 'Otro';

// Max plan: per-day time ranges with individual prices
export type ScheduleRange = { start: string; end: string; price: number }; // 'HH:MM'
// Key = day of week as string ('0'=Sun … '6'=Sat)
export type AdvancedScheduleConfig = Partial<Record<string, ScheduleRange[]>>;

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description: string;
  slotDuration: 20 | 30 | 40 | 50 | 60 | 90 | 120;
  basePrice: number;
  workingDays: number[]; // 0=Dom … 6=Sáb
  workingHoursStart: string; // HH:MM
  workingHoursEnd: string;   // HH:MM
  scheduleConfig?: AdvancedScheduleConfig; // Max plan: per-day ranges
  isActive: boolean;
  createdAt: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  description: string;
  ownerName: string;
  ownerEmail: string;
  category: BusinessCategory;
  imageUrl: string;
  // Scheduling config
  slotDuration: 20 | 30 | 40 | 50 | 60 | 90 | 120;
  basePrice: number;
  workingDays: number[]; // 0=Dom, 1=Lun, ..., 6=Sáb
  workingHoursStart: string; // HH:MM
  workingHoursEnd: string;   // HH:MM
  scheduleConfig?: AdvancedScheduleConfig; // Max plan: per-day ranges
  // Mercado Pago
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpUserId?: string;
  // Plan / subscription
  plan?: 'pro' | 'max';
  planExpiresAt?: string;
  trialEndsAt?: string;
  // Branding
  brandColor?: string;
  // Social links
  whatsapp?: string;   // phone number, e.g. +5491123456789
  instagram?: string;  // handle without @
  facebook?: string;   // page name / handle
  twitter?: string;    // handle without @
}

export interface Slot {
  id: string;
  serviceId: string;
  businessId: string; // kept for routing convenience
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  price: number;
  status: 'open' | 'booked' | 'blocked';
  service?: string; // service name for display
}

export interface SlotBlock {
  id: string;
  businessId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  slotId: string | null;
  businessId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled' | 'pending' | 'approved' | 'rejected';
  mpPreferenceId?: string;
  mpPaymentId?: string;
  // Denormalized slot data (slot-less architecture)
  date?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  service?: string;
  serviceId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'customer';
  businessId?: string;
}

export interface MyBooking {
  id: string;
  slotId: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  service?: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: Booking['status'];
  createdAt: string;
}
