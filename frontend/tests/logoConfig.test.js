import test from 'node:test';
import assert from 'node:assert/strict';

import {
  defaultLogoAlign,
  defaultLogoIconSize,
  defaultLogoLabel,
  defaultLogoPalette,
  defaultLogoSize,
  defaultLogoSignature,
  defaultLogoTheme,
  defaultLogoVariant,
  fallbackLogoVariant,
  logoAlignmentClasses,
  logoPropPresets,
  logoStylePresets,
  logoThemeClasses,
  logoUsagePresets,
  resolveLogoLabel,
  resolveLogoOptions,
  sizeMap,
  validAlignments,
  validSizes,
  validThemes,
  validVariants,
} from '../src/components/logoConfig.js';

test('logo config resolves supported props directly', () => {
  const resolved = resolveLogoOptions({
    variant: 'wordmark',
    theme: 'light',
    size: 'xl',
    showSignature: true,
    align: 'center',
    signatureText: 'Premium suite',
    companyName: 'by Result Seekers',
  });

  assert.equal(resolved.resolvedVariant, 'wordmark');
  assert.equal(resolved.resolvedTheme, 'light');
  assert.equal(resolved.resolvedSize, 'xl');
  assert.equal(resolved.resolvedAlign, 'center');
  assert.equal(resolved.resolvedShowSignature, true);
  assert.equal(resolved.shouldShowSignature, true);
  assert.equal(resolved.resolvedSignatureText, 'Premium suite');
  assert.equal(resolved.inverse, true);
  assert.equal(resolved.wordColor, 'text-white');
  assert.equal(resolved.signatureColor, 'text-violet-100/80');
  assert.equal(resolved.alignmentClass, 'items-center text-center');
  assert.deepEqual(resolved.palette, sizeMap.xl);
});

test('logo config falls back safely for unsupported props', () => {
  const resolved = resolveLogoOptions({
    variant: 'badge',
    theme: 'sunset',
    size: 'xxl',
    showSignature: false,
    align: 'end',
  });

  assert.equal(resolved.resolvedVariant, fallbackLogoVariant);
  assert.equal(resolved.resolvedTheme, 'dark');
  assert.equal(resolved.resolvedSize, 'md');
  assert.equal(resolved.resolvedAlign, 'start');
  assert.equal(resolved.resolvedShowSignature, false);
  assert.equal(resolved.shouldShowSignature, false);
  assert.equal(resolved.inverse, false);
  assert.equal(resolved.wordColor, 'text-slate-950');
  assert.equal(resolved.signatureColor, 'text-violet-700');
  assert.equal(resolved.alignmentClass, 'items-start text-left');
  assert.deepEqual(resolved.palette, sizeMap.md);
});

test('logo config uses company name when no signature override is provided', () => {
  const resolved = resolveLogoOptions({
    showSignature: true,
    companyName: 'Result Seekers Ltd',
  });

  assert.equal(resolved.resolvedSignatureText, 'Result Seekers Ltd');
  assert.equal(resolved.resolvedVariant, 'icon');
});

test('logo config trims visible signature copy before exposing it to the component', () => {
  const resolved = resolveLogoOptions({
    showSignature: true,
    signatureText: '  Result Seekers Premium  ',
  });

  assert.equal(resolved.resolvedSignatureText, 'Result Seekers Premium');
  assert.equal(resolved.hasSignatureText, true);
});

test('logo config falls back to the shared default signature copy', () => {
  const resolved = resolveLogoOptions();

  assert.equal(resolved.resolvedSignatureText, defaultLogoSignature);
  assert.equal(resolved.hasSignatureText, true);
});

test('logo config detects intentionally empty signature text', () => {
  const resolved = resolveLogoOptions({
    showSignature: true,
    signatureText: '   ',
  });

  assert.equal(resolved.resolvedShowSignature, true);
  assert.equal(resolved.hasSignatureText, false);
  assert.equal(resolved.shouldShowSignature, false);
});

test('logo config ignores non-text signature values instead of treating them as visible copy', () => {
  const resolved = resolveLogoOptions({
    showSignature: true,
    signatureText: { copy: 'Taska' },
  });

  assert.equal(resolved.resolvedSignatureText, '');
  assert.equal(resolved.hasSignatureText, false);
  assert.equal(resolved.shouldShowSignature, false);
});

test('logo config stringifies numeric signature values consistently', () => {
  const resolved = resolveLogoOptions({
    showSignature: true,
    signatureText: 2026,
  });

  assert.equal(resolved.resolvedSignatureText, '2026');
  assert.equal(resolved.hasSignatureText, true);
  assert.equal(resolved.shouldShowSignature, true);
});

test('logo style presets expose the shared branding treatments we depend on', () => {
  assert.deepEqual(validVariants, ['icon', 'wordmark', 'full']);
  assert.deepEqual(validThemes, ['dark', 'light']);
  assert.deepEqual(validAlignments, ['start', 'center']);
  assert.deepEqual(Object.keys(logoStylePresets), [
    'premium',
    'landingNav',
    'landingHero',
    'showcase',
    'authHeader',
    'previewCenter',
    'compactNav',
    'lightFooter',
    'darkFooter',
    'workspace',
  ]);
  assert.deepEqual(Object.keys(logoUsagePresets), [
    'authHeader',
    'landingNav',
    'landingHero',
    'marketingHero',
    'showcaseCenter',
    'previewCenter',
    'demoNav',
    'demoLightFooter',
    'demoDarkFooter',
    'workspaceExpanded',
    'workspaceCollapsed',
  ]);
  assert.deepEqual(Object.keys(logoPropPresets), [
    'authHeader',
    'landingNav',
    'landingHero',
    'marketingHero',
    'showcaseCenter',
    'previewCenter',
    'demoNav',
    'demoLightFooter',
    'demoDarkFooter',
    'workspaceExpanded',
    'workspaceCollapsed',
  ]);

  assert.equal(logoStylePresets.premium.signatureClassName.includes('tracking-[0.22em]'), true);
  assert.equal(logoStylePresets.landingNav.signatureClassName.includes('tracking-[0.18em]'), true);
  assert.equal(logoStylePresets.landingHero.wordmarkClassName.includes('tracking-[-0.045em]'), true);
  assert.equal(logoStylePresets.compactNav.iconClassName.includes('drop-shadow-['), true);
  assert.equal(logoStylePresets.darkFooter.signatureClassName.includes('text-violet-100/80'), true);
  assert.equal(logoUsagePresets.authHeader.size, 'sm');
  assert.equal(logoUsagePresets.landingNav.size, 'md');
  assert.equal(logoUsagePresets.landingHero.align, 'center');
  assert.equal(logoUsagePresets.marketingHero.size, 'lg');
  assert.equal(logoUsagePresets.showcaseCenter.align, 'center');
  assert.equal(logoUsagePresets.previewCenter.className, 'justify-center');
  assert.equal(logoUsagePresets.demoNav.showSignature, false);
  assert.equal(logoUsagePresets.demoDarkFooter.theme, 'light');
  assert.equal(logoUsagePresets.workspaceExpanded.size, 'md');
  assert.equal(logoUsagePresets.workspaceCollapsed.showSignature, false);
  assert.equal(logoPropPresets.authHeader.size, 'sm');
  assert.equal(logoPropPresets.landingNav.signatureClassName, logoStylePresets.landingNav.signatureClassName);
  assert.equal(logoPropPresets.landingHero.align, 'center');
  assert.equal(logoPropPresets.marketingHero.signatureClassName, logoStylePresets.premium.signatureClassName);
  assert.equal(logoPropPresets.showcaseCenter.align, 'center');
  assert.equal(logoPropPresets.previewCenter.className, 'justify-center');
  assert.equal(logoPropPresets.demoNav.showSignature, false);
  assert.equal(logoPropPresets.demoLightFooter.size, 'xs');
  assert.equal(logoPropPresets.demoDarkFooter.theme, 'light');
  assert.equal(logoPropPresets.workspaceExpanded.signatureClassName, logoStylePresets.workspace.signatureClassName);
  assert.equal(logoPropPresets.workspaceCollapsed.showSignature, false);
  assert.deepEqual(validSizes, ['xs', 'sm', 'md', 'lg', 'xl']);
});

test('logo nav-only presets avoid forcing signature text styles', () => {
  assert.equal('signatureClassName' in logoStylePresets.compactNav, false);
  assert.equal('signatureClassName' in logoStylePresets.workspace, true);
  assert.equal('signatureClassName' in logoStylePresets.authHeader, true);
});

test('logo prop presets stay aligned with their shared usage and style sources', () => {
  assert.deepEqual(logoPropPresets.authHeader, {
    ...logoUsagePresets.authHeader,
    ...logoStylePresets.authHeader,
  });
  assert.deepEqual(logoPropPresets.landingHero, {
    ...logoUsagePresets.landingHero,
    ...logoStylePresets.landingHero,
  });
  assert.deepEqual(logoPropPresets.marketingHero, {
    ...logoUsagePresets.marketingHero,
    ...logoStylePresets.premium,
  });
  assert.deepEqual(logoPropPresets.demoDarkFooter, {
    ...logoUsagePresets.demoDarkFooter,
    ...logoStylePresets.darkFooter,
  });
  assert.deepEqual(logoPropPresets.workspaceCollapsed, {
    ...logoUsagePresets.workspaceCollapsed,
    ...logoStylePresets.workspace,
  });
});

test('logo shared config maps stay frozen for safe reuse', () => {
  assert.equal(Object.isFrozen(validVariants), true);
  assert.equal(Object.isFrozen(validThemes), true);
  assert.equal(Object.isFrozen(validAlignments), true);
  assert.equal(Object.isFrozen(logoStylePresets), true);
  assert.equal(Object.isFrozen(logoStylePresets.premium), true);
  assert.equal(Object.isFrozen(logoUsagePresets), true);
  assert.equal(Object.isFrozen(logoUsagePresets.landingHero), true);
  assert.equal(Object.isFrozen(logoUsagePresets.showcaseCenter), true);
  assert.equal(Object.isFrozen(logoUsagePresets.marketingHero), true);
  assert.equal(Object.isFrozen(logoUsagePresets.demoLightFooter), true);
  assert.equal(Object.isFrozen(logoUsagePresets.workspaceExpanded), true);
  assert.equal(Object.isFrozen(logoPropPresets), true);
  assert.equal(Object.isFrozen(logoPropPresets.authHeader), true);
  assert.equal(Object.isFrozen(logoPropPresets.marketingHero), true);
  assert.equal(Object.isFrozen(logoPropPresets.demoDarkFooter), true);
  assert.equal(Object.isFrozen(logoPropPresets.workspaceExpanded), true);
  assert.equal(Object.isFrozen(sizeMap), true);
  assert.equal(Object.isFrozen(sizeMap.md), true);
  assert.equal(Object.isFrozen(defaultLogoPalette), true);
  assert.equal(Object.isFrozen(validSizes), true);
  assert.equal(Object.isFrozen(logoThemeClasses), true);
  assert.equal(Object.isFrozen(logoThemeClasses.dark), true);
  assert.equal(Object.isFrozen(logoAlignmentClasses), true);
  assert.throws(() => {
    logoStylePresets.premium.iconClassName = 'changed';
  }, TypeError);
});

test('logo label resolver trims valid labels and falls back safely', () => {
  assert.equal(resolveLogoLabel(' Taska Workspace '), 'Taska Workspace');
  assert.equal(resolveLogoLabel('   '), defaultLogoLabel);
  assert.equal(resolveLogoLabel(null), defaultLogoLabel);
});

test('logo defaults expose the shared brand copy we reuse across the component', () => {
  assert.equal(defaultLogoLabel, 'Taska');
  assert.equal(defaultLogoVariant, 'icon');
  assert.equal(fallbackLogoVariant, 'full');
  assert.equal(defaultLogoTheme, 'dark');
  assert.equal(defaultLogoSize, 'md');
  assert.deepEqual(defaultLogoPalette, sizeMap[defaultLogoSize]);
  assert.equal(defaultLogoIconSize, 36);
  assert.equal(defaultLogoIconSize, sizeMap[defaultLogoSize].icon);
  assert.deepEqual(logoThemeClasses[defaultLogoTheme], {
    wordColor: 'text-slate-950',
    signatureColor: 'text-violet-700',
  });
  assert.equal(defaultLogoAlign, 'start');
  assert.equal(logoAlignmentClasses[defaultLogoAlign], 'items-start text-left');
  assert.equal(defaultLogoSignature, 'by Result Seekers');
});
