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
  slotDuration: 30 | 45 | 60;
  basePrice: number;
  workingDays: number[]; // 0=Dom, 1=Lun, ..., 6=Sáb
  workingHoursStart: string; // HH:MM
  workingHoursEnd: string;   // HH:MM
  // Mercado Pago
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpUserId?: string;
}

export interface Slot {
  id: string;
  businessId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  price: number;
  status: 'open' | 'booked' | 'cancelled';
  service?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  businessId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled' | 'pending' | 'approved' | 'rejected';
  mpPreferenceId?: string;
  mpPaymentId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'customer';
  businessId?: string;
}
