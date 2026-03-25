import { createContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface ToastCtx {
  message: string;
  visible: boolean;
  show: (msg: string) => void;
}

export const ToastContext = createContext<ToastCtx>({
  message: '',
  visible: false,
  show: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setMessage(msg);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ message, visible, show }}>
      {children}
    </ToastContext.Provider>
  );
}
