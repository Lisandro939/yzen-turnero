'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap, useGSAP } from '@/lib/gsap';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ConfirmContentProps {
  title: string;
  subtitle: string;
  businessName: string;
  service: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  price: number;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-800 font-medium text-sm">{value}</span>
    </div>
  );
}

export function ConfirmContent({
  title, subtitle, businessName, service, date, time, name, email, phone, price,
}: ConfirmContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    // Circle scale in with overshoot
    tl.from(circleRef.current, {
      scale: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
    });

    // Checkmark draw
    if (checkRef.current) {
      const length = checkRef.current.getTotalLength();
      gsap.set(checkRef.current, { strokeDasharray: length, strokeDashoffset: length });
      tl.to(checkRef.current, {
        strokeDashoffset: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      }, '-=0.1');
    }

    // Title + subtitle
    tl.from(titleRef.current, { y: 20, opacity: 0, duration: 0.4 }, '-=0.1');
    tl.from(subtitleRef.current, { y: 20, opacity: 0, duration: 0.4 }, '-=0.2');

    // Card
    tl.from(cardRef.current, { y: 20, opacity: 0, duration: 0.5 }, '-=0.2');

    // Button
    tl.from(btnRef.current, { y: 12, opacity: 0, duration: 0.3 }, '-=0.2');
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="pt-24 max-w-lg mx-auto px-4 pb-24">
      <div className="text-center mb-8">
        <div
          ref={circleRef}
          className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4"
        >
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path ref={checkRef} strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 ref={titleRef} className="text-2xl font-bold text-slate-800">{title}</h1>
        <p ref={subtitleRef} className="text-slate-400 mt-2">{subtitle}</p>
      </div>

      <div ref={cardRef}>
        <Card className="p-6 flex flex-col gap-4">
          <Row label="Negocio" value={businessName} />
          <Row label="Servicio" value={service} />
          <Row label="Fecha" value={date} />
          <Row label="Horario" value={time} />
          <Row label="Cliente" value={name} />
          <Row label="Email" value={email} />
          <Row label="Teléfono" value={phone} />
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total pagado</span>
            <span className="text-emerald-600 font-bold text-lg">${price.toLocaleString('es-AR')}</span>
          </div>
        </Card>
      </div>

      <div ref={btnRef} className="mt-6 text-center">
        <Link href="/"><Button variant="secondary" size="lg">Volver al inicio</Button></Link>
      </div>
    </div>
  );
}
