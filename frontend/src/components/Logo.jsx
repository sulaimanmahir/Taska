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

const wordmarkGradientClass = 'bg-[linear-gradient(135deg,#7C3AED_0%,#A855F7_52%,#E9D5FF_100%)] bg-clip-text text-transparent';
const iconShadowClass = 'shrink-0 drop-shadow-[0_10px_30px_rgba(124,58,237,0.28)]';
const brandNodes = [
  { x: 18, y: 20, r: 5 },
  { x: 49, y: 16, r: 4.5 },
  { x: 20, y: 44, r: 5 },
  { x: 48, y: 41, r: 6.5 },
  { x: 32, y: 32, r: 4.8 },
  { x: 31, y: 53, r: 4 },
];
const brandPaths = [
  {
    d: 'M18 20c6 2 12 6 18 12 5 5 12 8 21 9',
    strokeWidth: '2.5',
  },
  {
    d: 'M22 46c4-9 8-16 13-21 7-7 15-10 24-10',
    strokeWidth: '2.5',
    opacity: '0.9',
  },
  {
    d: 'M31 18l5 12M24 34l11-4M35 30l11 3M32 32l2 13',
    strokeWidth: '2.3',
  },
];

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
      <span className={wordmarkGradientClass}>
        T
      </span>
      aska
    </span>
  );
}

function BrandIcon({ size = defaultLogoIconSize, className = '', decorative = true, label = defaultLogoLabel }) {
  const gradientId = useId().replace(/:/g, '');
  const orbitId = `taska-orbit-${gradientId}`;
  const nodeId = `taska-node-${gradientId}`;
  const titleId = decorative ? undefined : `taska-title-${gradientId}`;
  const accessibleLabel = decorative ? undefined : resolveLogoLabel(label);

  return (
    <svg
      viewBox="0 0 64 64"
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
        <linearGradient id={orbitId} x1="14%" y1="14%" x2="86%" y2="86%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="55%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
        <radialGradient id={nodeId} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#F5D0FE" />
          <stop offset="40%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7C3AED" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="32" r="22" fill="none" stroke={`url(#${orbitId})`} strokeWidth="2.8" opacity="0.92" />
      {brandPaths.map((path) => (
        <path
          key={path.d}
          d={path.d}
          fill="none"
          stroke={`url(#${orbitId})`}
          strokeWidth={path.strokeWidth}
          strokeLinecap="round"
          opacity={path.opacity}
        />
      ))}

      {brandNodes.map((node) => (
        <circle key={`${node.x}-${node.y}`} cx={node.x} cy={node.y} r={node.r} fill={`url(#${nodeId})`} />
      ))}
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
