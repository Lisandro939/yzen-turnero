'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Business, BusinessCategory } from '@/types';
import type { PlanStatus } from '@/lib/plan-utils';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

export interface BusinessFormValues {
  name: string;
  category: BusinessCategory;
  description: string;
  imageUrl: string;
  slotDuration: 30 | 45 | 60;
  basePrice: number;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
}

interface BusinessFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Business>;
  onSubmit: (values: BusinessFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
  planStatus?: PlanStatus | null;
}

const CATEGORIES: BusinessCategory[] = [
  'Barbería', 'Medicina', 'Entrenamiento', 'Belleza',
  'Odontología', 'Psicología', 'Nutrición', 'Yoga', 'Otro',
];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
];

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

function defaults(init?: Partial<Business>): BusinessFormValues {
  return {
    name: init?.name ?? '',
    category: init?.category ?? 'Otro',
    description: init?.description ?? '',
    imageUrl: init?.imageUrl ?? '',
    slotDuration: init?.slotDuration ?? 30,
    basePrice: init?.basePrice ?? 0,
    workingDays: init?.workingDays ?? [1, 2, 3, 4, 5],
    workingHoursStart: init?.workingHoursStart ?? '09:00',
    workingHoursEnd: init?.workingHoursEnd ?? '18:00',
  };
}

export function BusinessForm({ mode, initialValues, onSubmit, loading, submitLabel, planStatus }: BusinessFormProps) {
  const [form, setForm] = useState<BusinessFormValues>(defaults(initialValues));
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessFormValues, string>>>({});

  const hasAdvancedConfig =
    planStatus !== undefined &&
    planStatus?.plan === 'max' &&
    !!planStatus.active &&
    Object.keys(initialValues?.scheduleConfig ?? {}).length > 0;

  function validate(): boolean {
    const e: Partial<Record<keyof BusinessFormValues, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = 'Mínimo 3 caracteres';
    if (!form.description.trim()) e.description = 'La descripción es requerida';
    if (!hasAdvancedConfig) {
      if (form.basePrice <= 0) e.basePrice = 'El precio debe ser mayor a 0';
      if (form.workingDays.length === 0) e.workingDays = 'Seleccioná al menos un día';
      if (form.workingHoursStart >= form.workingHoursEnd) e.workingHoursEnd = 'El horario de fin debe ser posterior al inicio';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter((d) => d !== day)
        : [...f.workingDays, day].sort((a, b) => a - b),
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">

      {/* ── Sección 1: Información ── */}
      <div>
        <h3 className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-500 text-xs flex items-center justify-center font-bold">1</span>
          Información del negocio
        </h3>
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre del negocio"
            placeholder="Ej: Barbería El Centro"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
          />
          <Select
            label="Categoría"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as BusinessCategory })}
          />
          <Textarea
            label="Descripción"
            placeholder="Contá brevemente qué servicios ofrecés..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={errors.description}
          />
          <Input
            label="URL de imagen (opcional)"
            placeholder="https://..."
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
      </div>

      {/* ── Sección 2: Turnos y horario ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
          <h3 className="text-slate-700 font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-500 text-xs flex items-center justify-center font-bold shrink-0">2</span>
            Turnos y horario de atención
          </h3>
          {planStatus !== undefined && (
            <Link
              href={planStatus?.plan === 'max' && planStatus.active ? '/dashboard/settings/advanced' : '/plan?upgrade=max'}
              className="self-start flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group"
            >
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 leading-none mb-0.5">Configuración avanzada</p>
                <p className="text-[10px] text-slate-400 leading-none">Franjas múltiples y precios por día</p>
              </div>
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">Plan Max</span>
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className={`grid grid-cols-1 gap-4 ${hasAdvancedConfig ? '' : 'sm:grid-cols-2'}`}>
            <Select
              label="Duración de turno"
              options={DURATION_OPTIONS}
              value={String(form.slotDuration)}
              onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) as 30 | 45 | 60 })}
            />
            {!hasAdvancedConfig && (
              <Input
                label="Precio base ($)"
                type="text"
                inputMode="numeric"
                placeholder="1500"
                value={form.basePrice || ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setForm({ ...form, basePrice: raw ? parseInt(raw, 10) : 0 });
                }}
                error={errors.basePrice}
              />
            )}
          </div>

          {hasAdvancedConfig ? (
            /* Advanced config active — días y horarios están en la config avanzada */
            <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-violet-200 bg-violet-50">
              <div>
                <p className="text-sm font-semibold text-violet-700 leading-none mb-1">Configuración avanzada activa</p>
                <p className="text-xs text-violet-500 leading-snug">
                  Los días, horarios y precios están controlados por tu configuración avanzada. Editá desde ahí para modificarlos.
                </p>
              </div>
              <Link
                href="/dashboard/settings/advanced"
                className="shrink-0 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-white border border-violet-200 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Editar →
              </Link>
            </div>
          ) : (
            <>
              {/* Days */}
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
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {errors.workingDays && <p className="text-xs text-rose-500 mt-1">{errors.workingDays}</p>}
              </div>

              {/* Hours */}
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
            </>
          )}
        </div>
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {submitLabel ?? (mode === 'create' ? 'Crear negocio' : 'Guardar cambios')}
      </Button>
    </form>
  );
}
