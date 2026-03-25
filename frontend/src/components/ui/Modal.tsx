import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function Modal({ open, title, placeholder, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-4xl p-6 shadow-xl w-full max-w-md mx-4">
        <h3 className="font-heading text-lg font-bold text-stone-800 mb-4">{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onConfirm(value.trim());
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-sage-300 mb-4"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={() => value.trim() && onConfirm(value.trim())}>
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
}
