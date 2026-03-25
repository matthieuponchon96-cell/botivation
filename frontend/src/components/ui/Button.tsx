import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'amber' | 'small' | 'ghost';
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<string, string> = {
  primary:
    'bg-sage-500 hover:bg-sage-600 text-white px-6 py-3 rounded-4xl shadow-md hover:shadow-lg',
  secondary:
    'bg-white hover:bg-stone-50 text-stone-600 border border-stone-200 px-6 py-3 rounded-4xl',
  danger:
    'bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-sm',
  amber:
    'bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-4xl shadow-md hover:shadow-lg',
  small:
    'bg-sage-500 hover:bg-sage-600 text-white px-4 py-2 rounded-2xl text-sm',
  ghost:
    'bg-transparent hover:bg-stone-100 text-stone-500 px-3 py-1.5 rounded-xl text-sm',
};

export function Button({
  variant = 'primary',
  loading,
  loadingText,
  children,
  className = '',
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <>
          <span className="spinner" />
          {loadingText || 'Chargement...'}
        </>
      ) : (
        children
      )}
    </button>
  );
}
