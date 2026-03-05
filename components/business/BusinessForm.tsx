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

function defaults(init?: Partial<Business>): BusinessFormValues {
  return {
    name: init?.name ?? '',
    category: init?.category ?? 'Otro',
    description: init?.description ?? '',
    imageUrl: init?.imageUrl ?? '',
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

      <Button type="submit" size="lg" loading={loading} className="w-full">
        {submitLabel ?? (mode === 'create' ? 'Crear negocio' : 'Guardar cambios')}
      </Button>
    </form>
  );
}
