import { useId } from 'react';
import {
  defaultLogoAlign,
  defaultLogoIconSize,
  defaultLogoLabel,
  defaultLogoSize,
  defaultLogoSignature,
  defaultLogoTheme,
  defaultLogoVariant,
  resolveLogoLabel,
  resolveLogoOptions,
} from './logoConfig.js';

// Official Taska mark (2026-08): a stylised ribbon "T" in a purple-to-blue
// gradient, plus an orange gradient reserved for the "ka" of the wordmark -
// matching the approved logo artwork. See docs/TASKA_DESIGN_CONSTITUTION.md.
const TASKA_T_PATH = 'M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z';
const tGradientClass = 'bg-[linear-gradient(160deg,#8B5CF6_0%,#6D28D9_45%,#2563EB_100%)] bg-clip-text text-transparent';
const kaGradientClass = 'bg-[linear-gradient(135deg,#F97316_0%,#EA580C_60%,#C2410C_100%)] bg-clip-text text-transparent';
const iconShadowClass = 'shrink-0 drop-shadow-[0_10px_30px_rgba(109,40,217,0.28)]';

function joinClasses(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

function getAccessibleLockupProps(decorative, label) {
  if (decorative) {
    return { 'aria-hidden': true };
  }

  return {
    role: 'img',
    'aria-label': resolveLogoLabel(label),
  };
}

function BrandWordmark({ palette, wordColor, className = '' }) {
  return (
    <span className={joinClasses('font-black tracking-tight leading-[0.92]', palette.text, wordColor, className)}>
      <span className={tGradientClass}>T</span>
      as
      <span className={kaGradientClass}>ka</span>
    </span>
  );
}

function BrandIcon({ size = defaultLogoIconSize, className = '', decorative = true, label = defaultLogoLabel }) {
  const gradientId = useId().replace(/:/g, '');
  const tId = `taska-t-${gradientId}`;
  const titleId = decorative ? undefined : `taska-title-${gradientId}`;
  const accessibleLabel = decorative ? undefined : resolveLogoLabel(label);

  return (
    <svg
      viewBox="0 0 48 46"
      width={size}
      height={size}
      className={className}
      focusable="false"
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative}
      aria-labelledby={decorative ? undefined : titleId}
    >
      {decorative ? null : <title id={titleId}>{accessibleLabel}</title>}
      <defs>
        <linearGradient id={tId} x1="8%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="45%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      <path d={TASKA_T_PATH} fill={`url(#${tId})`} />
    </svg>
  );
}

export default function Logo({
  variant = defaultLogoVariant,
  theme = defaultLogoTheme,
  size = defaultLogoSize,
  showSignature,
  decorative = false,
  label = defaultLogoLabel,
  companyName = defaultLogoSignature,
  signatureText,
  align = defaultLogoAlign,
  className = '',
  iconClassName = '',
  wordmarkClassName = '',
  signatureClassName = '',
}) {
  const {
    palette,
    resolvedVariant,
    resolvedSignatureText,
    shouldShowSignature,
    alignmentClass,
    wordColor,
    signatureColor,
  } = resolveLogoOptions({
    variant,
    theme,
    size,
    showSignature,
    companyName,
    signatureText,
    align,
  });
  const lockupClassName = joinClasses('inline-flex items-center', palette.gap, className);
  const iconOnlyClassName = joinClasses(className, iconClassName);
  const iconLockupClassName = joinClasses(iconShadowClass, iconClassName);
  const contentClassName = joinClasses('flex flex-col', alignmentClass);
  const signatureTextClassName = joinClasses(
    'mt-1 font-medium leading-[1.05]',
    palette.sub,
    signatureColor,
    signatureClassName
  );
  const accessibleLockupProps = getAccessibleLockupProps(decorative, label);

  if (resolvedVariant === 'icon') {
    return <BrandIcon size={palette.icon} className={iconOnlyClassName} decorative={decorative} label={label} />;
  }

  if (resolvedVariant === 'wordmark') {
    return (
      <span {...accessibleLockupProps}>
        <BrandWordmark palette={palette} wordColor={wordColor} className={joinClasses(wordmarkClassName, className)} />
      </span>
    );
  }

  return (
    <span className={lockupClassName} {...accessibleLockupProps}>
      <BrandIcon size={palette.icon} className={iconLockupClassName} />
      <span className={contentClassName}>
        <BrandWordmark palette={palette} wordColor={wordColor} className={wordmarkClassName} />
        {shouldShowSignature && (
          <span className={signatureTextClassName}>
            {resolvedSignatureText}
          </span>
        )}
      </span>
    </span>
  );
}
