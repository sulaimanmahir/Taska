export function buildFinanceFieldProps(fieldId, options = {}) {
  const { errorId, includeHint = true, inputProps: extraInputProps = {} } = options;
  const describedBy = [
    includeHint ? `${fieldId}-hint` : null,
    errorId || null,
  ].filter(Boolean).join(' ');

  return {
    fieldId,
    inputProps: {
      id: fieldId,
      ...(describedBy ? { 'aria-describedby': describedBy } : {}),
      ...extraInputProps,
    },
  };
}
