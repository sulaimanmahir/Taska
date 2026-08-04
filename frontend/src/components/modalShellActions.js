import {
  MODAL_ACTIONS_PRESETS,
  MODAL_TONE_CLASSES,
} from './modalShellConfig.js';

const MODAL_ACTIONS_BASE_CLASS_NAME = 'modal-actions-mobile sticky bottom-0 -mx-4.5 mt-1 flex flex-col gap-2.5 border-t px-4.5 pb-1 pt-3 sm:static sm:mx-0 sm:flex-row sm:border-t-0 sm:bg-transparent sm:px-0 sm:pb-0';

export function buildModalActionsViewModel({
  ariaLabel,
  className = '',
  preset = 'default',
  tone = 'default',
} = {}) {
  const toneClasses = MODAL_TONE_CLASSES[tone] || MODAL_TONE_CLASSES.default;
  const presetConfig = MODAL_ACTIONS_PRESETS[preset] || MODAL_ACTIONS_PRESETS.default;

  return {
    resolvedAriaLabel: ariaLabel || presetConfig.ariaLabel,
    className: [
      MODAL_ACTIONS_BASE_CLASS_NAME,
      toneClasses.actions,
      presetConfig.className,
      className,
    ].filter(Boolean).join(' '),
  };
}
