import { FinanceFieldLabel } from './FinanceFormFeedback';

export default function FinanceInputField({ field, value, onChange }) {
  const baseClassName = field.className || 'input';
  const invalidClassName =
    field.invalidClassName || 'border-amber-200 bg-amber-50/20 text-amber-900 ring-2 ring-amber-100 shadow-[var(--shadow-sm)]';
  const className = field.invalid ? `${baseClassName} ${invalidClassName}` : baseClassName;

  return (
    <div className="space-y-2">
      <FinanceFieldLabel fieldId={field.fieldProps.fieldId} label={field.label} hint={field.hint} />
      {field.element === 'textarea' ? (
        <textarea
          {...field.fieldProps.inputProps}
          aria-invalid={field.invalid ? 'true' : undefined}
          value={value}
          onChange={onChange}
          className={className}
          disabled={field.disabled}
          rows={field.rows ?? 2}
        />
      ) : field.element === 'select' ? (
        <select
          {...field.fieldProps.inputProps}
          aria-invalid={field.invalid ? 'true' : undefined}
          required={field.required}
          value={value}
          onChange={onChange}
          className={className}
          disabled={field.disabled}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          {...field.fieldProps.inputProps}
          aria-invalid={field.invalid ? 'true' : undefined}
          type={field.type}
          min={field.min}
          max={field.max}
          step={field.step}
          required={field.required}
          value={value}
          onChange={onChange}
          className={className}
          placeholder={field.placeholder}
          disabled={field.disabled}
        />
      )}
    </div>
  );
}
