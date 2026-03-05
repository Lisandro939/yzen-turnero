'use client';

import { useRef, useState } from 'react';
import { ImageIcon, X, Upload } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export function ImageUpload({ value, onChange, label = 'Imagen del negocio (opcional)' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten archivos PNG, JPG o JPEG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar los 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error al subir la imagen');
        return;
      }

      onChange(data.url);
    } catch {
      setError('Error de conexión al subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-600">{label}</label>

      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagen del negocio" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/90 text-slate-700 hover:bg-white transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Cambiar
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/90 text-rose-600 hover:bg-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-white cursor-pointer transition-colors group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-indigo-300 border-t-transparent animate-spin" />
              <p className="text-sm text-slate-400">Subiendo imagen...</p>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">
                  Hacé clic o arrastrá una imagen
                </p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG o JPEG · Máx. 5MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {uploading && value && (
        <p className="text-xs text-slate-400">Subiendo imagen...</p>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="hidden"
        onChange={handleInputChange}
        disabled={uploading}
      />
    </div>
  );
}
