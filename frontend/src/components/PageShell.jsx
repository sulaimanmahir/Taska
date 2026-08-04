import { createElement } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { logoPropPresets } from './logoConfig.js';

const WIDTH_CLASSES = {
  default: 'page-shell-default',
  wide: 'page-shell-wide',
  auth: 'page-shell-auth',
  full: 'page-shell-full',
};

const GRID_CLASSES = {
  default: 'content-grid-default',
  split: 'content-grid-split',
  sidebar: 'content-grid-sidebar',
  cards: 'content-grid-cards',
};

const CARD_GRID_CLASSES = {
  default: 'responsive-card-grid-default',
  metrics: 'responsive-card-grid-metrics',
  cards: 'responsive-card-grid-cards',
};

export function PageShell({ as: Tag = 'div', width = 'default', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `page-shell ${WIDTH_CLASSES[width] || WIDTH_CLASSES.default} ${className}`.trim(),
    },
    children,
  );
}

export function DashboardShell({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <PageShell as={Tag} width="wide" className={`page-stack ${className}`.trim()} {...props}>
      {children}
    </PageShell>
  );
}

export function AppShell({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <PageShell as={Tag} width="wide" className={`page-stack ${className}`.trim()} {...props}>
      {children}
    </PageShell>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className = '',
  align = 'default',
}) {
  const alignmentClassName = align === 'center' ? 'page-header-center' : '';

  return (
    <section className={`page-header ${alignmentClassName} ${className}`.trim()}>
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="page-header-eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header-title">{title}</h1>
        {description ? <p className="page-header-description">{description}</p> : null}
      </div>
      {actions || aside ? (
        <div className="page-header-side">
          {actions ? <div className="page-header-actions">{actions}</div> : null}
          {aside ? <div className="page-header-aside">{aside}</div> : null}
        </div>
      ) : null}
    </section>
  );
}

export function SectionShell({ as: Tag = 'section', className = '', children, ...props }) {
  return createElement(
    Tag,
    { ...props, className: `section-shell ${className}`.trim() },
    children,
  );
}

export function SectionHeader(props) {
  return <PageHeader {...props} />;
}

export function BrandTopbar({
  as: Tag = 'div',
  brand,
  actions,
  className = '',
  ...props
}) {
  return createElement(
    Tag,
    {
      ...props,
      className: `flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between ${className}`.trim(),
    },
    <>
      {brand ? <div>{brand}</div> : null}
      {actions ? <div className="flex items-center gap-3 self-start">{actions}</div> : null}
    </>,
  );
}

export function BrandIntro({
  className = '',
  logoProps = logoPropPresets.marketingHero,
  contentClassName = 'mt-5',
  logoHref = '/',
  logoAriaLabel = 'Taska home',
  children,
}) {
  return (
    <div className={className}>
      <Link to={logoHref} aria-label={logoAriaLabel} className="inline-flex items-center">
        <Logo {...logoProps} />
      </Link>
      {children ? <div className={contentClassName}>{children}</div> : null}
    </div>
  );
}

export function ContentContainer({ width = 'default', className = '', children, ...props }) {
  return <PageShell width={width} className={className} {...props}>{children}</PageShell>;
}

export function ContentGrid({ as: Tag = 'div', columns = 'default', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `${GRID_CLASSES[columns] || GRID_CLASSES.default} ${className}`.trim(),
    },
    children,
  );
}

export function FormPanel({ as: Tag = 'section', className = '', children, ...props }) {
  return createElement(
    Tag,
    { ...props, className: `form-panel ${className}`.trim() },
    children,
  );
}

export function ResponsiveGrid(props) {
  return <ContentGrid {...props} />;
}

export function FormCard({ className = '', children, ...props }) {
  return <FormPanel className={className} {...props}>{children}</FormPanel>;
}

export function FeatureCard({ className = '', children, ...props }) {
  return <SectionShell className={`auth-feature-card ${className}`.trim()} {...props}>{children}</SectionShell>;
}

export function AuthShell({ className = '', stageClassName = '', contentClassName = '', children }) {
  return (
    <div className={`auth-shell relative px-4 py-5 sm:px-5 lg:px-6 lg:py-7 ${className}`.trim()}>
      <div className={`auth-stage auth-stage-wide ${stageClassName}`.trim()}>
        <div className={`auth-stack w-full ${contentClassName}`.trim()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PublicShell({ className = '', children, ...props }) {
  return (
    <div className={`public-shell relative overflow-hidden ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function PublicStage({ as: Tag = 'div', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `public-stage public-section ${className}`.trim(),
    },
    children,
  );
}

export function PublicFeaturePanel({ as: Tag = 'div', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `public-card-strong rounded-[1.8rem] p-6 sm:p-7 lg:p-8 ${className}`.trim(),
    },
    children,
  );
}

export function PublicCard({ as: Tag = 'div', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `public-card ${className}`.trim(),
    },
    children,
  );
}

export function PublicInsetPanel({ as: Tag = 'div', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `border border-[var(--color-border)] bg-[var(--color-bg-subtle)] ${className}`.trim(),
    },
    children,
  );
}

export function PublicValuePill({ as: Tag = 'p', className = '', mono = false, children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `bg-[var(--color-bg-subtle)] text-[var(--color-text)] ${mono ? 'font-mono' : ''} ${className}`.trim(),
    },
    children,
  );
}

export function PublicMetricChip({ as: Tag = 'div', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `metric-chip ${className}`.trim(),
    },
    children,
  );
}

export function PublicBulletList({
  items,
  className = 'space-y-3',
  itemClassName = 'flex items-start gap-3',
  markerClassName = 'mt-1 h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_0_6px_rgba(124,58,237,0.1)]',
  markerContent = null,
  textClassName = 'text-sm leading-6 text-[var(--color-text-soft)]',
  renderText,
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={`${typeof item === 'string' ? item : 'item'}-${index}`} className={itemClassName}>
          <span className={markerClassName}>{markerContent}</span>
          {renderText ? renderText(item, index) : <p className={textClassName}>{item}</p>}
        </div>
      ))}
    </div>
  );
}

export function DemoNav({
  brandHref = '/',
  secondaryTo = '/demo',
  secondaryLabel = 'All Demos',
  primaryTo = '/register',
  primaryLabel = 'Start Free',
}) {
  return (
    <nav className="public-nav sticky top-0 z-50">
      <PublicStage className="py-3.5">
        <div className="flex items-center justify-between">
          <Link to={brandHref} aria-label="Taska home" className="flex items-center gap-3">
            <Logo {...logoPropPresets.demoNav} />
          </Link>
          <div className="flex items-center gap-3">
            <Link to={secondaryTo} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              {secondaryLabel}
            </Link>
            <Link
              to={primaryTo}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--color-brand)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>
      </PublicStage>
    </nav>
  );
}

export function DemoHeroSection({
  className = '',
  stageClassName = 'relative',
  gridClassName = 'grid items-center gap-12 lg:grid-cols-2',
  glowClassName = 'absolute left-10 top-20 h-72 w-72 rounded-full bg-[#6D28D9]/5 blur-3xl',
  children,
}) {
  return (
    <section className={`relative overflow-hidden pb-14 pt-20 ${className}`.trim()}>
      <div className={glowClassName} />
      <PublicStage className={stageClassName}>
        <div className={gridClassName}>
          {children}
        </div>
      </PublicStage>
    </section>
  );
}

export function DemoLightFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <PublicStage className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Link to="/" aria-label="Taska home" className="inline-flex items-center">
          <Logo {...logoPropPresets.demoLightFooter} />
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <Link to="/pricing" className="hover:text-slate-800">Pricing</Link>
          <Link to="/demo" className="hover:text-slate-800">Demos</Link>
          <a href="https://result-seekers.com" className="hover:text-slate-800">Contact</a>
        </div>
      </PublicStage>
    </footer>
  );
}

export function DemoDarkFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-8 text-white">
      <PublicStage className="flex items-center justify-between">
        <Link to="/" aria-label="Taska home" className="inline-flex items-center">
          <Logo {...logoPropPresets.demoDarkFooter} />
        </Link>
        <p className="text-sm text-slate-400">&copy; 2026 All rights reserved</p>
      </PublicStage>
    </footer>
  );
}

export function DemoIndustryIntro({
  color,
  badgeIcon,
  badgeLabel,
  title,
  description,
  ctaLink,
  primaryLabel = 'Start Free',
  className = '',
}) {
  return (
    <div className={className}>
      <Link to="/demo" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#6D28D9]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Industry Demos
      </Link>

      <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium" style={{ backgroundColor: `${color}15`, color }}>
        {badgeIcon ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={badgeIcon} />
          </svg>
        ) : null}
        {badgeLabel}
      </div>

      <h1 className="mb-5 text-[clamp(2.05rem,1.15vw+1.5rem,2.75rem)] font-extrabold text-slate-900">
        {title}
      </h1>

      <p className="mb-7 text-base leading-7 text-slate-600">
        {description}
      </p>

      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <Link
          to={ctaLink}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-brand)] px-6 text-sm font-semibold text-white shadow-xl shadow-[#6D28D9]/20 hover:bg-[var(--color-brand-strong)]"
        >
          {primaryLabel}
        </Link>
        <a
          href="https://wa.me/2341234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Book Demo
        </a>
      </div>
    </div>
  );
}

export function DemoSocialProof({
  color,
  heading,
  labels,
  stats = ['500+', '10M+', '99.9%'],
}) {
  return (
    <section className="bg-slate-900 py-16">
      <PublicStage>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-2xl font-bold text-white">{heading}</h2>
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={`${stat}-${labels[index] ?? index}`}>
                <p className="text-3xl font-bold" style={{ color }}>
                  {stat}
                </p>
                <p className="text-sm text-slate-400">{labels[index] ?? ''}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicStage>
    </section>
  );
}

export function DemoSectionIntro({
  title,
  description,
  action,
  className = '',
}) {
  const hasAction = Boolean(action);

  return (
    <div className={`mb-10 ${hasAction ? 'flex flex-col gap-3 md:flex-row md:items-end md:justify-between' : ''} ${className}`.trim()}>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function DemoClosingCta({
  title,
  description,
  primaryTo,
  primaryLabel = 'Start Free Today',
  secondaryTo,
  secondaryHref = 'https://wa.me/2341234567890',
  secondaryLabel = 'Chat on WhatsApp',
  contained = false,
}) {
  const sectionClassName = contained ? 'py-16' : 'bg-slate-900 py-16';
  const contentClassName = contained
    ? 'mx-auto max-w-4xl rounded-3xl bg-slate-900 px-8 py-12 text-center'
    : 'mx-auto max-w-3xl text-center';

  return (
    <section className={sectionClassName}>
      <PublicStage>
        <div className={contentClassName}>
          <h2 className="mb-6 text-3xl font-bold text-white">{title}</h2>
          <p className="mb-8 text-lg text-slate-300">{description}</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to={primaryTo}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-[var(--color-brand)] hover:bg-slate-100"
            >
              {primaryLabel}
            </Link>
            {secondaryTo ? (
              <Link
                to={secondaryTo}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                {secondaryLabel}
              </Link>
            ) : (
              <a
                href={secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                {secondaryLabel}
              </a>
            )}
          </div>
        </div>
      </PublicStage>
    </section>
  );
}

export function DemoFeatureShowcase({
  color,
  features,
  title,
  panelTitle,
  panelDescription,
  itemTone = 'Built for daily workflows',
}) {
  return (
    <section className="py-16">
      <PublicStage>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-[clamp(1.95rem,1vw+1.45rem,2.45rem)] font-extrabold text-slate-900">{title}</h2>
            <DemoCheckList items={features} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="mb-6 text-xl font-bold text-slate-800">{panelTitle}</h3>
            {panelDescription ? <p className="mb-6 text-sm leading-6 text-slate-500">{panelDescription}</p> : null}
            <div className="space-y-4">
              {features.slice(0, 4).map((feature, index) => (
                <div key={`${feature}-panel-${index}`} className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
                    <svg className="h-5 w-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{feature}</p>
                    <p className="text-sm text-slate-500">{itemTone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PublicStage>
    </section>
  );
}

export function DemoPreviewWindow({
  color,
  stats,
  listTitle,
  items,
  renderItem,
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-slate-50 via-transparent to-transparent" />
      <div className="public-card-strong overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 bg-slate-800 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <div className="bg-slate-50 p-6">
          <div className="mb-6 grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={`${stat.label}-${index}`} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-lg font-bold" style={{ color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">{listTitle}</h4>
            {items.map((item, index) => renderItem(item, index, color))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DemoMetricTiles({
  items,
  columnsClassName = 'grid-cols-2',
  gridClassName = '',
  tileClassName = 'rounded-xl bg-slate-50 p-4',
  labelClassName = 'text-xs text-slate-500',
  valueClassName = 'font-bold',
  valueStyle,
}) {
  return (
    <div className={`grid gap-4 ${columnsClassName} ${gridClassName}`.trim()}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className={tileClassName}>
          <p className={labelClassName}>{item.label}</p>
          <p className={valueClassName} style={valueStyle ? valueStyle(item, index) : undefined}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DemoCheckList({
  items,
  className = 'space-y-4',
  itemClassName = 'flex items-center gap-4',
  iconContainerClassName = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100',
  iconClassName = 'h-5 w-5 text-emerald-600',
  labelClassName = 'text-slate-700',
  iconStrokeWidth = 2,
  iconStyle,
}) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className={itemClassName}>
          <div className={iconContainerClassName}>
            <svg className={iconClassName} style={iconStyle ? iconStyle(item, index) : undefined} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={iconStrokeWidth} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className={labelClassName}>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function DemoPainPointsSection({
  title,
  description,
  painPoints,
  columnsClassName = 'md:grid-cols-2 lg:grid-cols-4',
}) {
  return (
    <section className="bg-white py-16">
      <PublicStage>
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-[clamp(1.95rem,1vw+1.45rem,2.45rem)] font-extrabold text-slate-900">{title}</h2>
          {description ? <p className="text-lg text-slate-600">{description}</p> : null}
        </div>
        <div className={`grid gap-6 ${columnsClassName}`.trim()}>
          {painPoints.map((point, index) => (
            <div key={`${point.title}-${index}`} className="rounded-2xl bg-slate-50 p-6">
              {point.icon ? (
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={point.icon} />
                  </svg>
                </div>
              ) : null}
              <h3 className="mb-2 font-semibold text-slate-800">{point.title}</h3>
              <p className="text-sm text-slate-600">{point.desc}</p>
            </div>
          ))}
        </div>
      </PublicStage>
    </section>
  );
}

export function ResponsiveCardGrid({ as: Tag = 'div', variant = 'default', className = '', children, ...props }) {
  return createElement(
    Tag,
    {
      ...props,
      className: `${CARD_GRID_CLASSES[variant] || CARD_GRID_CLASSES.default} ${className}`.trim(),
    },
    children,
  );
}
