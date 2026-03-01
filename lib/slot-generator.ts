import type { Business, Slot } from '@/types';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function generateSlotsForBusiness(
  business: Business,
  daysAhead = 7,
): Omit<Slot, 'id'>[] {
  const result: Omit<Slot, 'id'>[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 0; day < daysAhead; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    if (!business.workingDays.includes(date.getDay())) continue;

    const dateStr = date.toISOString().split('T')[0];
    const [startH, startM] = business.workingHoursStart.split(':').map(Number);
    const [endH, endM] = business.workingHoursEnd.split(':').map(Number);

    let cur = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (cur + business.slotDuration <= end) {
      const startTime = `${pad(Math.floor(cur / 60))}:${pad(cur % 60)}`;
      cur += business.slotDuration;
      const endTime = `${pad(Math.floor(cur / 60))}:${pad(cur % 60)}`;
      result.push({
        businessId: business.id,
        date: dateStr,
        startTime,
        endTime,
        price: business.basePrice,
        status: 'open',
        service: business.name,
      });
    }
  }
  return result;
}

export function slotId(businessId: string, date: string, startTime: string) {
  return `slot-${businessId}-${date}-${startTime.replace(':', '')}`;
}
