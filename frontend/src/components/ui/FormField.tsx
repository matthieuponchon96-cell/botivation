import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-stone-600">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full px-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 transition-all';

export const textareaClass = `${inputClass} resize-y`;

export const selectClass = `${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2378716c' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]`;
