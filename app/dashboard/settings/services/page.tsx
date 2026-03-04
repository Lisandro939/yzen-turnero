'use client';

import { useState, useEffect } from 'react';
import { Calendar, Lock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getPlanStatus } from '@/lib/plan-utils';
import { fetchServices, createService, updateService, deleteService } from '@/lib/api-client';
import type { Service } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toast } from '@/lib/toast';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
];

interface ServiceFormValues {
  name: string;
  description: string;
  slotDuration: 30 | 45 | 60;
  basePrice: number;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
}

function defaultValues(svc?: Service): ServiceFormValues {
  return {
    name: svc?.name ?? '',
    description: svc?.description ?? '',
    slotDuration: svc?.slotDuration ?? 30,
    basePrice: svc?.basePrice ?? 0,
    workingDays: svc?.workingDays ?? [1, 2, 3, 4, 5],
    workingHoursStart: svc?.workingHoursStart ?? '09:00',
    workingHoursEnd: svc?.workingHoursEnd ?? '18:00',
  };
}

function ServiceForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Service;
  onSave: (values: ServiceFormValues) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ServiceFormValues>(defaultValues(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormValues, string>>>({});

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day].sort((a, b) => a - b),
    }));
  }

  function validate() {
    const e: Partial<Record<keyof ServiceFormValues, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Mínimo 2 caracteres';
    if (form.basePrice <= 0) e.basePrice = 'El precio debe ser mayor a 0';
    if (form.workingDays.length === 0) e.workingDays = 'Seleccioná al menos un día';
    if (form.workingHoursStart >= form.workingHoursEnd) e.workingHoursEnd = 'El horario de fin debe ser posterior al inicio';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 border-t border-slate-100 mt-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Nombre del servicio"
          placeholder="Ej: Cancha 1"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Input
          label="Descripción (opcional)"
          placeholder="Ej: Fútbol 11, césped natural"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Select
          label="Duración de turno"
          options={DURATION_OPTIONS}
          value={String(form.slotDuration)}
          onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) as 30 | 45 | 60 })}
        />
        <Input
          label="Precio base ($)"
          type="text"
          inputMode="numeric"
          placeholder="5000"
          value={form.basePrice || ''}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setForm({ ...form, basePrice: raw ? parseInt(raw, 10) : 0 });
          }}
          error={errors.basePrice}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Días de atención</p>
        <div className="flex gap-2 flex-wrap">
          {DAY_LABELS.map((label, day) => {
            const active = form.workingDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                  active
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {errors.workingDays && <p className="text-xs text-rose-500 mt-1">{errors.workingDays}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Desde"
          type="time"
          value={form.workingHoursStart}
          onChange={(e) => setForm({ ...form, workingHoursStart: e.target.value })}
        />
        <Input
          label="Hasta"
          type="time"
          value={form.workingHoursEnd}
          onChange={(e) => setForm({ ...form, workingHoursEnd: e.target.value })}
          error={errors.workingHoursEnd}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" size="sm" loading={saving}>
          Guardar
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export default function ServicesSettingsPage() {
  const { user, businesses } = useAuth();
  const business = businesses.find((b) => b.id === user?.businessId);
  const planStatus = business ? getPlanStatus(business) : null;
  const isMax = planStatus?.plan === 'max' && !!planStatus.active;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!business?.id) return;
    fetchServices(business.id)
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [business?.id]);

  async function handleCreate(values: ServiceFormValues) {
    if (!business) return;
    setSaving(true);
    try {
      const svc = await toast.promise(
        createService({ ...values, businessId: business.id, name: values.name }),
        {
          loading: { title: 'Creando servicio...' },
          success: { title: 'Servicio creado' },
          error: { title: 'Error al crear el servicio' },
        },
      );
      setServices((prev) => [...prev, svc]);
      setShowAdd(false);
    } catch {
      // toast already shows error
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, values: ServiceFormValues) {
    setSaving(true);
    try {
      const svc = await toast.promise(
        updateService(id, values),
        {
          loading: { title: 'Guardando cambios...' },
          success: { title: 'Servicio actualizado' },
          error: { title: 'Error al guardar' },
        },
      );
      setServices((prev) => prev.map((s) => (s.id === id ? svc : s)));
      setEditingId(null);
    } catch {
      // toast already shows error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminás este servicio? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      await toast.promise(deleteService(id), {
        loading: { title: 'Eliminando servicio...' },
        success: { title: 'Servicio eliminado' },
        error: { title: 'Error al eliminar' },
      });
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // toast already shows error
    } finally {
      setDeletingId(null);
    }
  }

  if (!business) return <p className="text-slate-400">No se encontró tu negocio.</p>;

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Servicios</h1>
          <p className="text-slate-400 mt-1">Gestioná los servicios de {business.name}</p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} size="sm" className="whitespace-nowrap">
            + Agregar
          </Button>
        )}
      </div>

      {showAdd && (
        <Card className="p-6 mb-4">
          <h2 className="font-semibold text-slate-800">Nuevo servicio</h2>
          <ServiceForm
            onSave={handleCreate}
            onCancel={() => setShowAdd(false)}
            saving={saving}
          />
        </Card>
      )}

      {loading ? (
        <p className="text-slate-400">Cargando servicios...</p>
      ) : services.length === 0 && !showAdd ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400 mb-4">No tenés servicios creados todavía.</p>
          <Button onClick={() => setShowAdd(true)}>Crear primer servicio</Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map((svc) => (
            <Card key={svc.id} className="p-5">
              {editingId === svc.id ? (
                <>
                  <h3 className="font-semibold text-slate-800">{svc.name}</h3>
                  <ServiceForm
                    initial={svc}
                    onSave={(values) => handleUpdate(svc.id, values)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />

                  {/* Advanced schedule promo */}
                  <div className={`mt-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${isMax ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${isMax ? 'bg-violet-100' : 'bg-slate-100'}`}>
                      {isMax ? (
                        <Calendar className="w-4 h-4 text-violet-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-semibold ${isMax ? 'text-violet-700' : 'text-slate-500'}`}>
                          Horario avanzado
                        </p>
                        {!isMax && (
                          <span className="text-xs font-semibold text-violet-600 bg-violet-100 border border-violet-200 px-1.5 py-0.5 rounded-md">
                            Plan Max
                          </span>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${isMax ? 'text-violet-600' : 'text-slate-400'}`}>
                        Definí horarios distintos para cada día, bloqueá días específicos y configurá franjas personalizadas por día de la semana.
                      </p>
                      {isMax ? (
                        <Link
                          href={`/dashboard/settings/advanced?serviceId=${svc.id}`}
                          className="inline-block mt-2 text-xs font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2"
                        >
                          Configurar horario avanzado →
                        </Link>
                      ) : (
                        <Link
                          href="/plan"
                          className="inline-block mt-2 text-xs font-semibold text-indigo-500 hover:text-indigo-700 underline underline-offset-2"
                        >
                          Mejorar al Plan Max →
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 mb-1">{svc.name}</h3>
                    {svc.description && (
                      <p className="text-slate-500 text-sm mb-1">{svc.description}</p>
                    )}
                    <p className="text-slate-400 text-xs">
                      {svc.slotDuration} min · ${svc.basePrice.toLocaleString('es-AR')} · {svc.workingHoursStart}–{svc.workingHoursEnd}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isMax ? (
                      <Link
                        href={`/dashboard/settings/advanced?serviceId=${svc.id}`}
                        className="text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1.5 rounded-lg hover:bg-violet-100 transition-colors whitespace-nowrap"
                      >
                        Horario avanzado
                      </Link>
                    ) : (
                      <Link
                        href="/plan"
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                      >
                        <Lock className="w-3 h-3" />
                        Horario avanzado
                      </Link>
                    )}
                    <button
                      onClick={() => setEditingId(svc.id)}
                      className="text-sm text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(svc.id)}
                      disabled={deletingId === svc.id}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
