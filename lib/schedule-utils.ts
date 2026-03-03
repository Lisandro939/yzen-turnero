import type { Service, Slot, ScheduleRange } from '@/types';

/**
 * Generate a deterministic slot ID from its components.
 * Format: slot-{businessId}-{YYYY-MM-DD}-{HHMM}
 */
export function slotId(businessId: string, date: string, startTime: string): string {
  return `slot-${businessId}-${date}-${startTime.replace(':', '')}`;
}

/**
 * Parse a slot ID back into its components.
 * Suffix is "-YYYY-MM-DD-HHMM" = 16 chars (includes the dash separator before the date).
 * Example: "slot-svc-biz-1-2026-03-05-0900"
 *   withoutPrefix = "svc-biz-1-2026-03-05-0900"
 *   serviceId     = slice(0, -16) → "svc-biz-1"
 *   date          = slice(-15, -5) → "2026-03-05"
 *   rawTime       = slice(-4)      → "0900"
 */
export function parseSlotId(id: string): { serviceId: string; date: string; startTime: string } {
  const withoutPrefix = id.slice(5); // strip "slot-"
  const serviceId = withoutPrefix.slice(0, -16);
  const date = withoutPrefix.slice(-15, -5);
  const rawTime = withoutPrefix.slice(-4);
  const startTime = `${rawTime.slice(0, 2)}:${rawTime.slice(2)}`;
  return { serviceId, date, startTime };
}

/** Add `minutes` to a "HH:MM" string, returns "HH:MM" */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** "HH:MM" → total minutes from midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Compute all slots for a service on a given date.
 * bookedIds: Set of slot IDs with confirmed bookings.
 * blockedIds: Set of slot IDs blocked by the owner.
 * Returns empty array if the service is closed that day.
 */
export function computeSlots(
  service: Service,
  businessId: string,    // embedded in Slot.businessId for routing convenience
  date: string,          // 'YYYY-MM-DD'
  bookedIds: Set<string>,
  blockedIds: Set<string> = new Set(),
): Slot[] {
  const dayOfWeek = new Date(date + 'T12:00:00').getDay(); // 0=Sun…6=Sat

  // Check if it's a working day or has an advanced config entry
  const advancedRanges: ScheduleRange[] | undefined =
    service.scheduleConfig?.[String(dayOfWeek)];

  const hasAdvanced = advancedRanges && advancedRanges.length > 0;
  const isWorkingDay = service.workingDays.includes(dayOfWeek);

  if (!hasAdvanced && !isWorkingDay) return [];

  const duration = service.slotDuration;
  const slots: Slot[] = [];

  function slotStatus(id: string): Slot['status'] {
    if (blockedIds.has(id)) return 'blocked';
    if (bookedIds.has(id)) return 'booked';
    return 'open';
  }

  if (hasAdvanced) {
    // Advanced schedule: iterate each time range
    for (const range of advancedRanges!) {
      let current = range.start;
      while (toMinutes(current) + duration <= toMinutes(range.end)) {
        const end = addMinutes(current, duration);
        const id = slotId(service.id, date, current);
        slots.push({
          id,
          serviceId: service.id,
          businessId,
          date,
          startTime: current,
          endTime: end,
          price: range.price,
          status: slotStatus(id),
          service: service.name,
        });
        current = end;
      }
    }
  } else {
    // Standard schedule: single daily time range
    let current = service.workingHoursStart;
    while (toMinutes(current) + duration <= toMinutes(service.workingHoursEnd)) {
      const end = addMinutes(current, duration);
      const id = slotId(service.id, date, current);
      slots.push({
        id,
        serviceId: service.id,
        businessId,
        date,
        startTime: current,
        endTime: end,
        price: service.basePrice,
        status: slotStatus(id),
        service: service.name,
      });
      current = end;
    }
  }

  return slots;
}
