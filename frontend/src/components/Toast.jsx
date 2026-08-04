import { useId } from 'react';

export default function Toast({
  tone = 'success',
  message,
  actionLabel,
  onAction,
  groupAriaLabel = 'Toast notification',
}) {
  const messageId = useId();

  if (!message) {
    return null;
  }

  return (
    <div
      className={`toast ${tone === 'error' ? 'toast-error' : 'toast-success'}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-center gap-3" role="group" aria-label={groupAriaLabel}>
        <p id={messageId} className="text-sm font-semibold">{message}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            aria-describedby={messageId}
            className="text-xs font-semibold uppercase tracking-wide underline underline-offset-2 transition hover:opacity-80"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
