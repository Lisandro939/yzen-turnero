import type { Business, Slot, Booking } from '@/types';

export const businesses: Business[] = [
  {
    id: 'biz-1',
    slug: 'estilo-barbershop',
    name: 'Estilo Barbershop',
    description: 'Cortes modernos y clásicos. Barbería de confianza en el centro.',
    ownerName: 'Carlos Mendez',
    ownerEmail: 'owner@yzen.com',
    category: 'Barbería',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    slotDuration: 30,
    basePrice: 1500,
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHoursStart: '09:00',
    workingHoursEnd: '19:00',
  },
  {
    id: 'biz-2',
    slug: 'clinica-salud-plus',
    name: 'Clínica Salud Plus',
    description: 'Consultas médicas generales y especializadas. Turnos disponibles.',
    ownerName: 'Dra. Ana Rodriguez',
    ownerEmail: 'doctor@salud.com',
    category: 'Medicina',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
    slotDuration: 30,
    basePrice: 3000,
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
  },
  {
    id: 'biz-3',
    slug: 'fit-trainer-pro',
    name: 'Fit Trainer Pro',
    description: 'Entrenamiento personalizado. Sesiones individuales y grupales.',
    ownerName: 'Marcos Vega',
    ownerEmail: 'trainer@fit.com',
    category: 'Entrenamiento',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
    slotDuration: 60,
    basePrice: 2500,
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHoursStart: '07:00',
    workingHoursEnd: '21:00',
  },
];

function addDays(baseDate: Date, days: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const today = new Date();
today.setHours(0, 0, 0, 0);

function makeSlots(businessId: string, timeSlots: { start: string; end: string; service: string }[], price: number): Slot[] {
  const slots: Slot[] = [];
  let idx = 0;
  for (let day = 0; day < 7; day++) {
    const date = addDays(today, day);
    for (const ts of timeSlots) {
      idx++;
      const slotId = `slot-${businessId}-${day}-${idx}`;
      const isBooked = idx % 4 === 0;
      slots.push({
        id: slotId,
        serviceId: `svc-${businessId}`,
        businessId,
        date,
        startTime: ts.start,
        endTime: ts.end,
        price,
        status: isBooked ? 'booked' : 'open',
        service: ts.service,
      });
    }
  }
  return slots;
}

const barberSlots = makeSlots(
  'biz-1',
  [
    { start: '09:00', end: '09:30', service: 'Corte de cabello' },
    { start: '10:00', end: '10:30', service: 'Corte y barba' },
    { start: '11:00', end: '11:30', service: 'Corte de cabello' },
  ],
  1500
);

const doctorSlots = makeSlots(
  'biz-2',
  [
    { start: '08:00', end: '08:30', service: 'Consulta general' },
    { start: '09:00', end: '09:30', service: 'Consulta general' },
    { start: '10:00', end: '10:30', service: 'Pediatría' },
  ],
  3000
);

const trainerSlots = makeSlots(
  'biz-3',
  [
    { start: '07:00', end: '08:00', service: 'Sesión individual' },
    { start: '18:00', end: '19:00', service: 'Sesión individual' },
    { start: '19:30', end: '20:30', service: 'Clase grupal' },
  ],
  2500
);

export const slots: Slot[] = [...barberSlots, ...doctorSlots, ...trainerSlots];

const bookedSlots = slots.filter((s) => s.status === 'booked');

export const bookings: Booking[] = bookedSlots.slice(0, 8).map((slot, i) => ({
  id: `booking-${i + 1}`,
  slotId: slot.id,
  businessId: slot.businessId,
  customerName: ['Laura Gomez', 'Santiago Perez', 'Valentina Lopez', 'Diego Fernandez', 'Camila Torres', 'Mateo Ruiz', 'Lucia Martinez', 'Andres Silva'][i] ?? 'Cliente',
  customerEmail: `cliente${i + 1}@mail.com`,
  customerPhone: `+54 9 11 ${5000 + i * 1111}-${1000 + i * 333}`,
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  status: 'confirmed',
}));
