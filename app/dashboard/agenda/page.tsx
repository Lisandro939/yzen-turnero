'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchSlots, createSlot, updateSlotStatus } from '@/lib/api-client';
import type { Slot } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', service: '', price: '' });

  useEffect(() => {
    if (!user?.businessId) return;
    fetchSlots(user.businessId)
      .then(setSlots)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.businessId]);

  const bizSlots = slots
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const dates = [...new Set(bizSlots.map((s) => s.date))];

  async function addSlot() {
    if (!form.date || !form.startTime || !form.endTime || !user?.businessId) return;
    setSaving(true);
    try {
      const newSlot = await createSlot({
        businessId: user.businessId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        price: Number(form.price) || 0,
        status: 'open',
        service: form.service || undefined,
      });
      setSlots((prev) => [...prev, newSlot]);
      setForm({ date: '', startTime: '', endTime: '', service: '', price: '' });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function cancelSlot(slotId: string) {
    setCancellingId(slotId);
    try {
      await updateSlotStatus(slotId, 'cancelled');
      setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, status: 'cancelled' } : s));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Agenda</h1>
          <p className="text-slate-400 mt-1">Gestioná tus turnos disponibles</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Agregar turno'}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <h3 className="text-slate-700 font-semibold mb-4">Nuevo turno</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Input label="Servicio" placeholder="Ej: Corte de cabello" value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })} />
            <Input label="Hora inicio" type="time" value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="Hora fin" type="time" value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <Input label="Precio ($)" type="text" inputMode="numeric" placeholder="1500" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, '') })} />
          </div>
          <Button className="mt-4" loading={saving} onClick={addSlot}>Guardar turno</Button>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-6">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((j) => (
                  <Card key={j} className="p-4 flex items-center justify-between">
                    <div>
                      <Skeleton className="h-5 w-28 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : dates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No hay turnos cargados.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {dates.map((date) => (
            <div key={date}>
              <h3 className="text-slate-500 font-medium mb-3 capitalize">{formatDate(date)}</h3>
              <div className="flex flex-col gap-2">
                {bizSlots.filter((s) => s.date === date).map((slot) => (
                  <Card key={slot.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-slate-800 font-medium">{slot.startTime} – {slot.endTime}</p>
                      <p className="text-slate-500 text-sm">{slot.service ?? '—'} · ${slot.price.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge status={slot.status} />
                      {slot.status === 'open' && (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={cancellingId === slot.id}
                          onClick={() => cancelSlot(slot.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
