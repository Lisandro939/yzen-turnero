import type { Business, Slot, Booking } from '@/types';

// ── Businesses ──────────────────────────────────────────────────────────────

export async function fetchBusinesses(): Promise<Business[]> {
  const res = await fetch('/api/businesses');
  if (!res.ok) throw new Error('Failed to fetch businesses');
  const data = await res.json();
  return data.businesses;
}

export async function createBusiness(business: Business): Promise<Business> {
  const res = await fetch('/api/businesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(business),
  });
  if (!res.ok) throw new Error('Failed to create business');
  const data = await res.json();
  return data.business;
}

export async function updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
  const res = await fetch(`/api/businesses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update business');
  const result = await res.json();
  return result.business;
}

// ── Slots ────────────────────────────────────────────────────────────────────

export async function fetchSlots(businessId: string, date?: string): Promise<Slot[]> {
  const params = new URLSearchParams({ businessId });
  if (date) params.set('date', date);
  const res = await fetch(`/api/slots?${params}`);
  if (!res.ok) throw new Error('Failed to fetch slots');
  const data = await res.json();
  return data.slots;
}

export async function fetchSlot(id: string): Promise<Slot> {
  const res = await fetch(`/api/slots/${id}`);
  if (!res.ok) throw new Error('Slot not found');
  const data = await res.json();
  return data.slot;
}

export async function createSlot(slot: Omit<Slot, 'id'>): Promise<Slot> {
  const res = await fetch('/api/slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slot),
  });
  if (!res.ok) throw new Error('Failed to create slot');
  const data = await res.json();
  return data.slot;
}

export async function updateSlotStatus(id: string, status: Slot['status']): Promise<Slot> {
  const res = await fetch(`/api/slots/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update slot');
  const data = await res.json();
  return data.slot;
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchBookings(businessId: string): Promise<Booking[]> {
  const res = await fetch(`/api/bookings?businessId=${businessId}`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.bookings;
}

export async function createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error('Failed to create booking');
  const data = await res.json();
  return data.booking;
}
