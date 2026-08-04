export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '')
    .trim();
};

export const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return sanitized;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[+]?[\d\s()-]{10,}$/;
  return re.test(phone.replace(/\s/g, ''));
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
};