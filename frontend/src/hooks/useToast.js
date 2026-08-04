import { useEffect, useState } from 'react';

export function useToast(duration = 2800) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, toast]);

  return { toast, setToast, clearToast: () => setToast(null) };
}
