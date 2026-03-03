'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createService } from '@/lib/api-client';
import type { Business, BusinessCategory } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const CATEGORIES: BusinessCategory[] = [
  'Barbería', 'Medicina', 'Entrenamiento', 'Belleza',
  'Odontología', 'Psicología', 'Nutrición', 'Yoga', 'Otro',
];
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
];
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm mt-6">
      <div className="flex items-center gap-1.5 text-slate-400">
        <span className="w-6 h-6 rounded-full border border-slate-200 text-xs flex items-center justify-center">1</span>
        Cuenta creada
      </div>
      <div className="w-8 h-px bg-slate-200" />
      <div className={`flex items-center gap-1.5 font-medium ${step === 1 ? 'text-indigo-500' : 'text-slate-400'}`}>
        <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center border ${step === 1 ? 'bg-indigo-50 border-indigo-200' : 'border-slate-200'}`}>2</span>
        Tu negocio
      </div>
      <div className="w-8 h-px bg-slate-200" />
      <div className={`flex items-center gap-1.5 font-medium ${step === 2 ? 'text-indigo-500' : 'text-slate-400'}`}>
        <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center border ${step === 2 ? 'bg-indigo-50 border-indigo-200' : 'border-slate-200'}`}>3</span>
        Primer servicio
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { user, upgradeToOwner } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState<BusinessCategory>('Otro');
  const [bizDescription, setBizDescription] = useState('');
  const [bizImageUrl, setBizImageUrl] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // Step 2 state
  const [svcName, setSvcName] = useState('');
  const [svcDescription, setSvcDescription] = useState('');
  const [svcDuration, setSvcDuration] = useState<30 | 45 | 60>(30);
  const [svcPrice, setSvcPrice] = useState(0);
  const [svcDays, setSvcDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [svcStart, setSvcStart] = useState('09:00');
  const [svcEnd, setSvcEnd] = useState('18:00');
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user === null) router.replace('/auth/login');
    else if (user.role === 'owner') router.replace('/dashboard');
  }, [user, router]);

  if (!user || user.role === 'owner') return null;

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!bizName.trim() || bizName.trim().length < 3) e.name = 'Mínimo 3 caracteres';
    if (!bizDescription.trim()) e.description = 'La descripción es requerida';
    setStep1Errors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!svcName.trim() || svcName.trim().length < 2) e.name = 'Mínimo 2 caracteres';
    if (svcPrice <= 0) e.price = 'El precio debe ser mayor a 0';
    if (svcDays.length === 0) e.days = 'Seleccioná al menos un día';
    if (svcStart >= svcEnd) e.end = 'El horario de fin debe ser posterior al inicio';
    setStep2Errors(e);
    return Object.keys(e).length === 0;
  }

  function toggleDay(day: number) {
    setSvcDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError(null);

    const businessId = `biz-${Date.now()}`;
    const business: Business = {
      id: businessId,
      slug: slugify(bizName),
      ownerName: user!.name,
      ownerEmail: user!.email,
      name: bizName,
      category: bizCategory,
      description: bizDescription,
      imageUrl: bizImageUrl,
      // Use service values as business-level defaults (legacy columns)
      slotDuration: svcDuration,
      basePrice: svcPrice,
      workingDays: svcDays,
      workingHoursStart: svcStart,
      workingHoursEnd: svcEnd,
    };

    try {
      await upgradeToOwner(business);
      await createService({
        businessId,
        name: svcName,
        description: svcDescription,
        slotDuration: svcDuration,
        basePrice: svcPrice,
        workingDays: svcDays,
        workingHoursStart: svcStart,
        workingHoursEnd: svcEnd,
      });
      router.push('/dashboard');
    } catch {
      setError('Ya existe un negocio con ese nombre. Probá con un nombre diferente.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-800 tracking-tight">
            turnero<span className="text-indigo-400">.</span>
          </Link>
          <StepIndicator step={step} />
          <h1 className="mt-6 text-2xl font-bold text-slate-800">
            {step === 1 ? `¡Hola, ${user.name.split(' ')[0]}!` : 'Primer servicio'}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {step === 1
              ? 'Completá los datos de tu negocio.'
              : 'Configurá el primer servicio que ofrecés. Podés agregar más desde el dashboard.'}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {error && (
            <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5">
              {error}
            </p>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="flex flex-col gap-5">
              <Input
                label="Nombre del negocio"
                placeholder="Ej: Barbería El Centro"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                error={step1Errors.name}
              />
              <Select
                label="Categoría"
                options={CATEGORY_OPTIONS}
                value={bizCategory}
                onChange={(e) => setBizCategory(e.target.value as BusinessCategory)}
              />
              <Textarea
                label="Descripción"
                placeholder="Contá brevemente qué servicios ofrecés..."
                value={bizDescription}
                onChange={(e) => setBizDescription(e.target.value)}
                error={step1Errors.description}
              />
              <Input
                label="URL de imagen (opcional)"
                placeholder="https://..."
                value={bizImageUrl}
                onChange={(e) => setBizImageUrl(e.target.value)}
              />
              <Button type="submit" size="lg" className="w-full">
                Siguiente →
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="flex flex-col gap-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre del servicio"
                  placeholder="Ej: Corte de pelo"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                  error={step2Errors.name}
                />
                <Input
                  label="Descripción (opcional)"
                  placeholder="Ej: Corte y peinado"
                  value={svcDescription}
                  onChange={(e) => setSvcDescription(e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Duración de turno"
                  options={DURATION_OPTIONS}
                  value={String(svcDuration)}
                  onChange={(e) => setSvcDuration(Number(e.target.value) as 30 | 45 | 60)}
                />
                <Input
                  label="Precio ($)"
                  type="text"
                  inputMode="numeric"
                  placeholder="1500"
                  value={svcPrice || ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setSvcPrice(raw ? parseInt(raw, 10) : 0);
                  }}
                  error={step2Errors.price}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Días de atención</p>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((label, day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                        svcDays.includes(day)
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {step2Errors.days && <p className="text-xs text-rose-500 mt-1">{step2Errors.days}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Desde"
                  type="time"
                  value={svcStart}
                  onChange={(e) => setSvcStart(e.target.value)}
                />
                <Input
                  label="Hasta"
                  type="time"
                  value={svcEnd}
                  onChange={(e) => setSvcEnd(e.target.value)}
                  error={step2Errors.end}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  ← Atrás
                </Button>
                <Button type="submit" size="lg" loading={loading} className="flex-1">
                  Crear mi negocio
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
