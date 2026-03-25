import { useToast } from '../../hooks/useToast';

export function Toast() {
  const { message, visible } = useToast();

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-4xl bg-sage-700 text-white font-medium shadow-lg transition-all duration-300 pointer-events-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {message}
    </div>
  );
}
