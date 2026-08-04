import { buildModalActionsViewModel } from './modalShellActions.js';

export function ModalActions({
  children,
  className = '',
  ariaLabel,
  tone = 'default',
  preset = 'default',
}) {
  const viewModel = buildModalActionsViewModel({
    ariaLabel,
    className,
    preset,
    tone,
  });

  return (
    <div
      role="group"
      aria-label={viewModel.resolvedAriaLabel}
      className={viewModel.className}
    >
      {children}
    </div>
  );
}

export default ModalActions;
