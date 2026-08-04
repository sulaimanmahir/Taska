export function buildTextField({
  key,
  fieldProps,
  label,
  hint,
  value,
  onChange,
  placeholder,
  required = false,
  className,
}) {
  return {
    key,
    fieldProps,
    label,
    hint,
    type: 'text',
    value,
    onChange,
    placeholder,
    required,
    className,
  };
}

export function buildNumberField({
  key,
  fieldProps,
  label,
  hint,
  value,
  onChange,
  placeholder,
  required = false,
  className,
  min,
  max,
  step,
}) {
  return {
    key,
    fieldProps,
    label,
    hint,
    type: 'number',
    value,
    onChange,
    placeholder,
    required,
    className,
    min,
    max,
    step,
  };
}

export function buildDateField({
  key,
  fieldProps,
  label,
  hint,
  value,
  onChange,
  required = false,
  className,
}) {
  return {
    key,
    fieldProps,
    label,
    hint,
    type: 'date',
    value,
    onChange,
    required,
    className,
  };
}

export function buildTextareaField({
  key,
  fieldProps,
  label,
  hint,
  value,
  onChange,
  className,
  rows = 2,
}) {
  return {
    key,
    fieldProps,
    label,
    hint,
    element: 'textarea',
    value,
    onChange,
    className,
    rows,
  };
}

export function buildSelectField({
  key,
  fieldProps,
  label,
  hint,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  className,
}) {
  return {
    key,
    element: 'select',
    fieldProps,
    label,
    hint,
    value,
    onChange,
    options,
    required,
    disabled,
    className,
  };
}
