import { z } from 'zod';

const optionalTextField = (label, max) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`);

const optionalEmailField = (label) =>
  z.string().trim().refine(
    (value) => value === '' || z.email().safeParse(value).success,
    `Enter a valid ${label}.`
  );

export const profileSettingsSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required.').max(255, 'Full name must be 255 characters or fewer.'),
  email: z.string().trim().min(1, 'Email address is required.').email('Enter a valid email address.').max(255, 'Email address must be 255 characters or fewer.'),
  phone: optionalTextField('Phone number', 50),
});

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required.').max(255, 'Business name must be 255 characters or fewer.'),
  email: optionalEmailField('business email address'),
  phone: optionalTextField('Business phone number', 50),
  address: optionalTextField('Address', 255),
  city: optionalTextField('City', 100),
  state: optionalTextField('State', 100),
  country: optionalTextField('Country', 100),
});

export function buildProfileSettingsDefaults(user = {}) {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  };
}

export function buildBusinessSettingsDefaults(business = {}) {
  return {
    name: business?.name ?? '',
    email: business?.email ?? '',
    phone: business?.phone ?? '',
    address: business?.address ?? '',
    city: business?.city ?? '',
    state: business?.state ?? '',
    country: business?.country ?? '',
  };
}

export function getSettingsSubmitError(error, fallback) {
  const validationErrors = error?.response?.data?.errors;

  if (validationErrors && typeof validationErrors === 'object') {
    const firstValidationMessage = Object.values(validationErrors)
      .flat()
      .find((message) => typeof message === 'string' && message.length > 0);

    if (firstValidationMessage) {
      return firstValidationMessage;
    }
  }

  return error?.response?.data?.message || fallback;
}
