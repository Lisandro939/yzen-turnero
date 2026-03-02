'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getPlanStatus } from '@/lib/plan-utils';
import type { AdvancedScheduleConfig, ScheduleRange } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/lib/toast';

const DAY_LABELS: Record<string, string> = {
    '1': 'Lunes',
    '2': 'Martes',
    '3': 'Miércoles',
    '4': 'Jueves',
    '5': 'Viernes',
    '6': 'Sábado',
    '0': 'Domingo',
};
const DAY_ORDER = ['1', '2', '3', '4', '5', '6', '0'];

interface DayState {
    enabled: boolean;
    ranges: { start: string; end: string; price: string }[];
}

function stateFromConfig(config: AdvancedScheduleConfig | undefined): Record<string, DayState> {
    const state: Record<string, DayState> = {};
    for (const day of DAY_ORDER) {
        const ranges = config?.[day];
        state[day] = {
            enabled: !!ranges && ranges.length > 0,
            ranges: ranges
                ? ranges.map((r) => ({ start: r.start, end: r.end, price: String(r.price) }))
                : [{ start: '09:00', end: '18:00', price: '' }],
        };
    }
    return state;
}

function stateToConfig(state: Record<string, DayState>): AdvancedScheduleConfig {
    const config: AdvancedScheduleConfig = {};
    for (const day of DAY_ORDER) {
        if (!state[day].enabled) continue;
        const ranges: ScheduleRange[] = state[day].ranges
            .filter((r) => r.start && r.end)
            .map((r) => ({ start: r.start, end: r.end, price: Number(r.price) || 0 }));
        if (ranges.length > 0) config[day] = ranges;
    }
    return config;
}

export default function AdvancedSettingsPage() {
    const { user, businesses, updateBusiness } = useAuth();
    const router = useRouter();

    const business = businesses.find((b) => b.id === user?.businessId);
    const planStatus = business ? getPlanStatus(business) : null;

    const [dayState, setDayState] = useState<Record<string, DayState>>(() =>
        stateFromConfig(business?.scheduleConfig),
    );
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Redirect if not Max plan
        if (planStatus && (planStatus.plan !== 'max' || !planStatus.active)) {
            router.replace('/plan?upgrade=max');
        }
    }, [planStatus, router]);

    // Re-init when business loads
    useEffect(() => {
        if (business) {
            setDayState(stateFromConfig(business.scheduleConfig));
        }
    }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    function toggleDay(day: string) {
        setDayState((prev) => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled },
        }));
    }

    function updateRange(day: string, idx: number, field: keyof DayState['ranges'][0], value: string) {
        setDayState((prev) => {
            const ranges = [...prev[day].ranges];
            ranges[idx] = { ...ranges[idx], [field]: value };
            return { ...prev, [day]: { ...prev[day], ranges } };
        });
    }

    function addRange(day: string) {
        setDayState((prev) => {
            const lastEnd = prev[day].ranges.at(-1)?.end ?? '';
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    ranges: [...prev[day].ranges, { start: lastEnd, end: '', price: '' }],
                },
            };
        });
    }

    function removeRange(day: string, idx: number) {
        setDayState((prev) => {
            const ranges = prev[day].ranges.filter((_, i) => i !== idx);
            return {
                ...prev,
                [day]: {
                    ...prev[day],
                    ranges: ranges.length > 0 ? ranges : [{ start: '', end: '', price: '' }],
                },
            };
        });
    }

    function validateRanges(): boolean {
        for (const day of DAY_ORDER) {
            const ds = dayState[day];
            if (!ds.enabled) continue;
            const filled = ds.ranges.filter((r) => r.start && r.end);
            for (let i = 0; i < filled.length; i++) {
                if (filled[i].start >= filled[i].end) return false;
                if (i > 0 && filled[i - 1].end > filled[i].start) return false;
            }
        }
        return true;
    }

    async function handleSave() {
        if (!business) return;
        if (!validateRanges()) {
            toast.error({ title: 'Rangos inválidos', description: 'Revisá que los horarios no se superpongan y que cada franja tenga un inicio menor al fin.' });
            return;
        }
        setSaving(true);
        try {
            await toast.promise(
                updateBusiness(business.id, { scheduleConfig: stateToConfig(dayState) }),
                {
                    loading: { title: 'Guardando configuración...' },
                    success: { title: 'Configuración guardada' },
                    error: { title: 'Error al guardar' },
                },
            );
        } catch {
            // toast already shows error
        } finally {
            setSaving(false);
        }
    }

    if (!planStatus || planStatus.plan !== 'max' || !planStatus.active) {
        return null; // redirect in progress
    }

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Configuración avanzada</h1>
                <p className="text-slate-400 mt-1">Configurá los horarios y precios por día — Plan Max</p>
            </div>

            <div className="flex flex-col gap-4 mb-6">
                {DAY_ORDER.map((day) => {
                    const ds = dayState[day];
                    return (
                        <Card key={day} className="p-5">
                            {/* Day header */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-slate-800">{DAY_LABELS[day]}</span>
                                <button
                                    onClick={() => toggleDay(day)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        ds.enabled ? 'bg-indigo-400' : 'bg-slate-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            ds.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {ds.enabled && (
                                <div className="flex flex-col gap-3">
                                    {ds.ranges.map((range, idx) => (
                                        <div key={idx} className="flex items-end gap-2 flex-wrap">
                                            <div className="flex-1 min-w-[90px]">
                                                <Input
                                                    label="Desde"
                                                    type="time"
                                                    value={range.start}
                                                    min={ds.ranges[idx - 1]?.end || undefined}
                                                    onChange={(e) => updateRange(day, idx, 'start', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[90px]">
                                                <Input
                                                    label="Hasta"
                                                    type="time"
                                                    value={range.end}
                                                    min={range.start || undefined}
                                                    max={ds.ranges[idx + 1]?.start || undefined}
                                                    onChange={(e) => updateRange(day, idx, 'end', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-[90px]">
                                                <Input
                                                    label="Precio ($)"
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="5000"
                                                    value={range.price}
                                                    onChange={(e) =>
                                                        updateRange(day, idx, 'price', e.target.value.replace(/[^0-9]/g, ''))
                                                    }
                                                />
                                            </div>
                                            {ds.ranges.length > 1 && (
                                                <button
                                                    onClick={() => removeRange(day, idx)}
                                                    className="mb-0.5 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Eliminar rango"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => addRange(day)}
                                        className="self-start text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                                    >
                                        + Agregar rango
                                    </button>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            <Button size="lg" loading={saving} onClick={handleSave}>
                Guardar configuración
            </Button>
        </div>
    );
}
