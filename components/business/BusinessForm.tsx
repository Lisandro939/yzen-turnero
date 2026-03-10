'use client';

import { useState } from 'react';
import type { Business, BusinessCategory } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';

export interface BusinessFormValues {
  name: string;
  category: BusinessCategory;
  description: string;
  imageUrl: string;
  brandColor: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  twitter: string;
}

interface BusinessFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Business>;
  onSubmit: (values: BusinessFormValues) => void;
  loading?: boolean;
  submitLabel?: string;
}

const CATEGORIES: BusinessCategory[] = [
  'Barbería', 'Medicina', 'Entrenamiento', 'Belleza',
  'Odontología', 'Psicología', 'Nutrición', 'Yoga', 'Otro',
];

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

const PRESET_COLORS = [
  '#818cf8', // indigo
  '#60a5fa', // blue
  '#34d399', // emerald
  '#f472b6', // pink
  '#fb923c', // orange
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#facc15', // yellow
];

function defaults(init?: Partial<Business>): BusinessFormValues {
  return {
    name: init?.name ?? '',
    category: init?.category ?? 'Otro',
    description: init?.description ?? '',
    imageUrl: init?.imageUrl ?? '',
    brandColor: init?.brandColor ?? '#818cf8',
    whatsapp: init?.whatsapp ?? '',
    instagram: init?.instagram ?? '',
    facebook: init?.facebook ?? '',
    twitter: init?.twitter ?? '',
  };
}

export function BusinessForm({ mode, initialValues, onSubmit, loading, submitLabel }: BusinessFormProps) {
  const [form, setForm] = useState<BusinessFormValues>(defaults(initialValues));
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessFormValues, string>>>({});

  function validate(): boolean {
    const e: Partial<Record<keyof BusinessFormValues, string>> = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = 'Mínimo 3 caracteres';
    if (!form.description.trim()) e.description = 'La descripción es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
      <ImageUpload
        value={form.imageUrl}
        onChange={(url) => setForm({ ...form, imageUrl: url })}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700">Color principal de la página</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, brandColor: color })}
              className="w-8 h-8 rounded-full border-2 transition-all shrink-0"
              style={{
                backgroundColor: color,
                borderColor: form.brandColor === color ? '#1e293b' : 'transparent',
                outline: form.brandColor === color ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
              }}
              title={color}
            />
          ))}
          <label
            className="w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden cursor-pointer shrink-0 flex items-center justify-center"
            title="Color personalizado"
            style={{ backgroundColor: PRESET_COLORS.includes(form.brandColor) ? undefined : form.brandColor }}
          >
            <input
              type="color"
              value={form.brandColor}
              onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
              className="opacity-0 absolute w-1 h-1"
            />
            {PRESET_COLORS.includes(form.brandColor) && (
              <span className="text-slate-400 text-lg leading-none select-none">+</span>
            )}
          </label>
        </div>
        <p className="text-xs text-slate-400">Se usa en tu página pública de reservas</p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700">Redes sociales</label>
        <p className="text-xs text-slate-400 -mt-1">Solo se muestran los que completes</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-24 shrink-0">WhatsApp</span>
          <Input
            placeholder="+5491123456789"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-24 shrink-0">Instagram</span>
          <Input
            placeholder="usuario (sin @)"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-24 shrink-0">Facebook</span>
          <Input
            placeholder="usuario o página"
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 w-24 shrink-0">Twitter / X</span>
          <Input
            placeholder="usuario (sin @)"
            value={form.twitter}
            onChange={(e) => setForm({ ...form, twitter: e.target.value })}
          />
        </div>
      </div>

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {submitLabel ?? (mode === 'create' ? 'Crear negocio' : 'Guardar cambios')}
      </Button>
    </form>
  );
}
