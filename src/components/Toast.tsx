import { useCallback, useEffect, useRef, useState } from 'react';

export interface ToastMessage {
  text: string;
  id: number;
}

export function useToast(duration = 2600) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback(
    (text: string) => {
      window.clearTimeout(timer.current);
      setToast({ text, id: Date.now() });
      timer.current = window.setTimeout(() => setToast(null), duration);
    },
    [duration],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return { toast, show };
}

export function Toast({ toast }: { toast: ToastMessage | null }) {
  return (
    <div className="toast-region" role="status" aria-live="assertive">
      {toast && (
        <div className="toast" key={toast.id}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
