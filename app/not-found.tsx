import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-black text-indigo-200 select-none leading-none mb-2">404</p>

      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-3">Página no encontrada</h1>
      <p className="text-slate-500 text-lg mb-8 max-w-sm">
        La página que buscás no existe o fue movida.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-indigo-300 text-white hover:bg-indigo-400 font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0 7-7m-7 7h18" />
        </svg>
        Volver al inicio
      </Link>
    </div>
  );
}
