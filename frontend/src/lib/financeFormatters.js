export function formatCurrencyNGN(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

export function formatShortDate(value, fallback = 'Not set') {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTimeLocal(value, fallback = 'Not scheduled') {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
