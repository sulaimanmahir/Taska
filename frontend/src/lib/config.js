const CURRENCY_BY_CODE = {
  NGN: { locale: 'en-NG', symbol: '₦', name: 'Nigerian Naira' },
  USD: { locale: 'en-US', symbol: '$', name: 'US Dollar' },
  GBP: { locale: 'en-GB', symbol: '£', name: 'British Pound' },
  EUR: { locale: 'en-IE', symbol: '€', name: 'Euro' },
};

const LEGACY_SYMBOL_FIXES = {
  'ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¦': '₦',
  'Ã¢â€šÂ¦': '₦',
  'â‚¦': '₦',
  'Ãƒâ€šÃ‚Â£': '£',
  'Ã‚Â£': '£',
  'Â£': '£',
  'ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬': '€',
  'Ã¢â€šÂ¬': '€',
  'â‚¬': '€',
};

function sanitizeCurrencySymbol(symbol, code = 'NGN') {
  if (!symbol) {
    return CURRENCY_BY_CODE[code]?.symbol || CURRENCY_BY_CODE.NGN.symbol;
  }

  return LEGACY_SYMBOL_FIXES[symbol] || symbol;
}

function resolveCurrencyConfig() {
  const storedCode = localStorage.getItem('currency_code') || 'NGN';
  const fallback = CURRENCY_BY_CODE[storedCode] || CURRENCY_BY_CODE.NGN;
  const storedLocale = localStorage.getItem('currency_locale') || fallback.locale;
  const storedSymbol = sanitizeCurrencySymbol(localStorage.getItem('currency_symbol'), storedCode);

  if (localStorage.getItem('currency_symbol') !== storedSymbol) {
    localStorage.setItem('currency_symbol', storedSymbol);
  }

  if (!localStorage.getItem('currency_locale')) {
    localStorage.setItem('currency_locale', storedLocale);
  }

  if (!localStorage.getItem('currency_code')) {
    localStorage.setItem('currency_code', storedCode);
  }

  return {
    locale: storedLocale,
    code: storedCode,
    symbol: storedSymbol,
    minFractionDigits: 0,
  };
}

export const config = {
  currency: resolveCurrencyConfig(),
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat(config.currency.locale, {
    style: 'currency',
    currency: config.currency.code,
    minimumFractionDigits: config.currency.minFractionDigits,
  }).format(amount || 0);
};

export const setCurrency = (locale, code, symbol) => {
  const normalizedSymbol = sanitizeCurrencySymbol(symbol, code);
  localStorage.setItem('currency_locale', locale);
  localStorage.setItem('currency_code', code);
  localStorage.setItem('currency_symbol', normalizedSymbol);
  window.location.reload();
};

export const availableCurrencies = Object.entries(CURRENCY_BY_CODE).map(([code, currency]) => ({
  locale: currency.locale,
  code,
  symbol: currency.symbol,
  name: currency.name,
}));
