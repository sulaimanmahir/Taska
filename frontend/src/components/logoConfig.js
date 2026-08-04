export const defaultLogoLabel = 'Taska';
export const defaultLogoVariant = 'icon';
export const fallbackLogoVariant = 'full';
export const defaultLogoTheme = 'dark';
export const defaultLogoSize = 'md';
export const defaultLogoAlign = 'start';
export const defaultLogoSignature = 'by Result Seekers';
export const validVariants = Object.freeze(['icon', 'wordmark', 'full']);
export const validThemes = Object.freeze(['dark', 'light']);
export const validAlignments = Object.freeze(['start', 'center']);
const validVariantSet = new Set(validVariants);
const validThemeSet = new Set(validThemes);
const validAlignmentSet = new Set(validAlignments);
const premiumSignatureClassName = 'text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-700';
const standardSignatureClassName = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700';
const inverseSignatureClassName = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100/80';

function freezeRecord(record) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, Object.freeze(value)])
    )
  );
}

function composeLogoPropPresets(definitions, usagePresets, stylePresets) {
  return freezeRecord(
    Object.fromEntries(
      Object.entries(definitions).map(([key, definition]) => {
        if (!definition || typeof definition.usage !== 'string' || typeof definition.style !== 'string') {
          throw new Error(`Invalid logo prop preset definition for "${key}".`);
        }

        const usagePreset = usagePresets[definition.usage];
        const stylePreset = stylePresets[definition.style];

        if (!usagePreset) {
          throw new Error(`Unknown logo usage preset "${definition.usage}" for prop preset "${key}".`);
        }

        if (!stylePreset) {
          throw new Error(`Unknown logo style preset "${definition.style}" for prop preset "${key}".`);
        }

        return [
          key,
          {
            ...usagePreset,
            ...stylePreset,
          },
        ];
      })
    )
  );
}

export const logoStylePresets = freezeRecord({
  premium: {
    iconClassName: 'drop-shadow-[0_18px_38px_rgba(124,58,237,0.2)]',
    signatureClassName: premiumSignatureClassName,
  },
  landingNav: {
    iconClassName: 'drop-shadow-[0_14px_36px_rgba(124,58,237,0.18)]',
    signatureClassName: 'tracking-[0.18em] uppercase text-[10px] font-semibold',
  },
  landingHero: {
    iconClassName: 'drop-shadow-[0_18px_40px_rgba(124,58,237,0.24)]',
    wordmarkClassName: 'tracking-[-0.045em]',
    signatureClassName: 'mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-700',
  },
  showcase: {
    iconClassName: 'drop-shadow-[0_18px_34px_rgba(124,58,237,0.18)]',
    signatureClassName: premiumSignatureClassName,
  },
  authHeader: {
    iconClassName: 'drop-shadow-[0_14px_30px_rgba(124,58,237,0.18)]',
    signatureClassName: standardSignatureClassName,
  },
  previewCenter: {
    iconClassName: 'drop-shadow-[0_16px_30px_rgba(124,58,237,0.18)]',
    signatureClassName: standardSignatureClassName,
  },
  compactNav: {
    iconClassName: 'drop-shadow-[0_14px_30px_rgba(124,58,237,0.16)]',
  },
  lightFooter: {
    iconClassName: 'drop-shadow-[0_12px_26px_rgba(124,58,237,0.14)]',
    signatureClassName: standardSignatureClassName,
  },
  darkFooter: {
    iconClassName: 'drop-shadow-[0_12px_26px_rgba(124,58,237,0.18)]',
    signatureClassName: inverseSignatureClassName,
  },
  workspace: {
    iconClassName: 'drop-shadow-[0_14px_32px_rgba(124,58,237,0.16)]',
    signatureClassName: standardSignatureClassName,
  },
});

export const logoUsagePresets = freezeRecord({
  authHeader: {
    variant: 'full',
    size: 'sm',
    showSignature: true,
  },
  landingNav: {
    variant: 'full',
    size: 'md',
    showSignature: true,
  },
  landingHero: {
    variant: 'full',
    size: 'xl',
    showSignature: true,
    align: 'center',
    className: 'mt-5',
  },
  marketingHero: {
    variant: 'full',
    size: 'lg',
    showSignature: true,
  },
  showcaseCenter: {
    variant: 'full',
    size: 'md',
    showSignature: true,
    align: 'center',
    className: 'mt-5 justify-center',
  },
  previewCenter: {
    variant: 'full',
    size: 'sm',
    showSignature: true,
    align: 'center',
    className: 'justify-center',
  },
  demoNav: {
    variant: 'full',
    size: 'sm',
    showSignature: false,
  },
  demoLightFooter: {
    variant: 'full',
    size: 'xs',
    showSignature: true,
  },
  demoDarkFooter: {
    variant: 'full',
    size: 'xs',
    theme: 'light',
    showSignature: true,
  },
  workspaceExpanded: {
    variant: 'full',
    size: 'md',
    showSignature: true,
  },
  workspaceCollapsed: {
    variant: 'full',
    size: 'sm',
    showSignature: false,
  },
});

const logoPropPresetDefinitions = Object.freeze({
  authHeader: { usage: 'authHeader', style: 'authHeader' },
  landingNav: { usage: 'landingNav', style: 'landingNav' },
  landingHero: { usage: 'landingHero', style: 'landingHero' },
  marketingHero: { usage: 'marketingHero', style: 'premium' },
  showcaseCenter: { usage: 'showcaseCenter', style: 'showcase' },
  previewCenter: { usage: 'previewCenter', style: 'previewCenter' },
  demoNav: { usage: 'demoNav', style: 'compactNav' },
  demoLightFooter: { usage: 'demoLightFooter', style: 'lightFooter' },
  demoDarkFooter: { usage: 'demoDarkFooter', style: 'darkFooter' },
  workspaceExpanded: { usage: 'workspaceExpanded', style: 'workspace' },
  workspaceCollapsed: { usage: 'workspaceCollapsed', style: 'workspace' },
});

export const logoPropPresets = composeLogoPropPresets(
  logoPropPresetDefinitions,
  logoUsagePresets,
  logoStylePresets,
);

export const sizeMap = freezeRecord({
  xs: { icon: 22, gap: 'gap-2.5', text: 'text-lg', sub: 'text-[10px]' },
  sm: { icon: 28, gap: 'gap-3', text: 'text-xl', sub: 'text-[11px]' },
  md: { icon: 36, gap: 'gap-3', text: 'text-2xl', sub: 'text-xs' },
  lg: { icon: 48, gap: 'gap-3.5', text: 'text-3xl', sub: 'text-sm' },
  xl: { icon: 64, gap: 'gap-4', text: 'text-5xl', sub: 'text-base' },
});
export const defaultLogoPalette = sizeMap[defaultLogoSize];
export const defaultLogoIconSize = defaultLogoPalette.icon;
export const validSizes = Object.freeze(Object.keys(sizeMap));
const validSizeSet = new Set(validSizes);

export const logoThemeClasses = freezeRecord({
  dark: {
    wordColor: 'text-slate-950',
    signatureColor: 'text-violet-700',
  },
  light: {
    wordColor: 'text-white',
    signatureColor: 'text-violet-100/80',
  },
});

export const logoAlignmentClasses = Object.freeze({
  start: 'items-start text-left',
  center: 'items-center text-center',
});

export function resolveLogoLabel(label) {
  return typeof label === 'string' && label.trim() ? label.trim() : defaultLogoLabel;
}

function normalizeLogoCopy(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

export function resolveLogoOptions({
  variant = defaultLogoVariant,
  theme = defaultLogoTheme,
  size = defaultLogoSize,
  showSignature,
  companyName = defaultLogoSignature,
  signatureText,
  align = defaultLogoAlign,
} = {}) {
  const resolvedSize = validSizeSet.has(size) ? size : defaultLogoSize;
  const palette = sizeMap[resolvedSize];
  const resolvedTheme = validThemeSet.has(theme) ? theme : defaultLogoTheme;
  const resolvedAlign = validAlignmentSet.has(align) ? align : defaultLogoAlign;
  const resolvedShowSignature = showSignature === true;
  const resolvedSignatureText = normalizeLogoCopy(signatureText ?? companyName);
  const hasSignatureText = resolvedSignatureText.length > 0;
  const presentation = logoThemeClasses[resolvedTheme];

  return {
    palette,
    resolvedVariant: validVariantSet.has(variant) ? variant : fallbackLogoVariant,
    resolvedTheme,
    resolvedSize,
    resolvedAlign,
    resolvedShowSignature,
    resolvedSignatureText,
    hasSignatureText,
    shouldShowSignature: resolvedShowSignature && hasSignatureText,
    wordColor: presentation.wordColor,
    signatureColor: presentation.signatureColor,
    alignmentClass: logoAlignmentClasses[resolvedAlign],
    inverse: resolvedTheme === 'light',
  };
}
