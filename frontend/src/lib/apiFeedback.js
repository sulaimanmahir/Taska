export function getErrorMessage(error, fallback) {
  const responseData = error?.response?.data;

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.errors) {
    const firstError = Object.values(responseData.errors).find(Boolean);
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0];
    }

    if (typeof firstError === 'string' && firstError) {
      return firstError;
    }
  }

  return fallback;
}

export function getErrorDetails(error, fallback) {
  const responseData = error?.response?.data;

  if (responseData?.errors && typeof responseData.errors === 'object') {
    const firstError = Object.values(responseData.errors).find(Boolean);

    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError.join(' ');
    }

    if (typeof firstError === 'string' && firstError) {
      return firstError;
    }
  }

  return getErrorMessage(error, fallback);
}
