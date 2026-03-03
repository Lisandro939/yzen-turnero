import type { Business, Service, Slot, Booking } from '@/types';

// ── Businesses ──────────────────────────────────────────────────────────────

export async function fetchBusinesses(): Promise<Business[]> {
  const res = await fetch('/api/businesses');
  if (!res.ok) throw new Error('Failed to fetch businesses');
  const data = await res.json();
  return data.businesses;
}

export async function fetchMyBusiness(): Promise<Business | null> {
  const res = await fetch('/api/businesses/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.business ?? null;
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

export async function fetchBusiness(idOrSlug: string): Promise<Business | null> {
  const res = await fetch(`/api/businesses/${idOrSlug}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.business ?? null;
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

// ── Services ─────────────────────────────────────────────────────────────────

export async function fetchServices(businessId: string): Promise<Service[]> {
  const res = await fetch(`/api/services?businessId=${businessId}`);
  if (!res.ok) throw new Error('Failed to fetch services');
  const data = await res.json();
  return data.services;
}

export async function fetchService(id: string): Promise<Service | null> {
  const res = await fetch(`/api/services/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.service ?? null;
}

export async function createService(data: Partial<Service> & { businessId: string; name: string }): Promise<Service> {
  const res = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create service');
  const result = await res.json();
  return result.service;
}

export async function updateService(id: string, data: Partial<Service>): Promise<Service> {
  const res = await fetch(`/api/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update service');
  const result = await res.json();
  return result.service;
}

export async function deleteService(id: string): Promise<void> {
  const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete service');
}

// ── Slots ────────────────────────────────────────────────────────────────────

export async function fetchSlots(
  serviceId: string,
  opts?: { date?: string; dateFrom?: string; dateTo?: string },
): Promise<Slot[]> {
  const params = new URLSearchParams({ serviceId });
  if (opts?.date) params.set('date', opts.date);
  if (opts?.dateFrom) params.set('dateFrom', opts.dateFrom);
  if (opts?.dateTo) params.set('dateTo', opts.dateTo);
  const res = await fetch(`/api/slots?${params}`);
  if (!res.ok) throw new Error('Failed to fetch slots');
  const data = await res.json();
  return data.slots;
}

export async function fetchSlot(id: string): Promise<Slot> {
  const res = await fetch(`/api/slots/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Slot not found');
  const data = await res.json();
  return data.slot;
}

export async function blockSlot(id: string, endTime: string): Promise<void> {
  const res = await fetch(`/api/slots/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'blocked', endTime }),
  });
  if (!res.ok) throw new Error('Failed to block slot');
}

export async function unblockSlot(id: string): Promise<void> {
  const res = await fetch(`/api/slot-blocks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unblock slot');
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export async function fetchBookings(businessId: string): Promise<Booking[]> {
  const res = await fetch(`/api/bookings?businessId=${businessId}`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.bookings;
}

export async function createBooking(
  booking: Omit<Booking, 'id' | 'createdAt'> & {
    date: string; startTime: string; endTime: string; price: number; service?: string; serviceId?: string;
  },
): Promise<Booking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error('Failed to create booking');
  const data = await res.json();
  return data.booking;
}

// ── My Bookings (customer) ────────────────────────────────────────────────────

export async function fetchMyBookings(): Promise<import('@/types').MyBooking[]> {
  const res = await fetch('/api/my-bookings');
  if (!res.ok) throw new Error('Failed to fetch bookings');
  const data = await res.json();
  return data.bookings;
}

export async function markRoleChosen(): Promise<void> {
  const res = await fetch('/api/user/setup', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to mark role as chosen');
}
