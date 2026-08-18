import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useBusinessType } from '../config/useBusinessType';
import {
  getFocusTrapWrapIndex,
  getInitialFocusTrapIndex,
  getInitialMenuItemIndex,
  getNextMenuItemIndex,
} from '../lib/layoutKeyboard';
import SyncIndicator from './SyncIndicator';
import Logo from './Logo';
import { logoPropPresets } from './logoConfig.js';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { business, businesses, logout, switchBusiness, user } = useAuthStore();
  const { navigation, edition } = useBusinessType();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const mobileSidebarTitleId = useId();
  const mobileSidebarDescriptionId = useId();
  const switcherRef = useRef(null);
  const switcherButtonRef = useRef(null);
  const switcherMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const sidebarRef = useRef(null);
  const mobileCloseButtonRef = useRef(null);
  const hadMobileOpenRef = useRef(false);
  const hadSwitcherOpenRef = useRef(false);

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }

    return location.pathname.startsWith(path);
  };

  const handleBusinessSwitch = async (businessId) => {
    setSwitcherOpen(false);
    await switchBusiness(businessId);
    navigate('/');
  };

  const getSwitcherItems = () => Array.from(
    switcherMenuRef.current?.querySelectorAll('[role="menuitemradio"]') ?? [],
  );

  useEffect(() => {
    if (!switcherOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!switcherRef.current?.contains(event.target)) {
        setSwitcherOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSwitcherOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [switcherOpen]);

  useEffect(() => {
    if (switcherOpen) {
      hadSwitcherOpenRef.current = true;
      const switcherItems = getSwitcherItems();
      const initialIndex = getInitialMenuItemIndex(
        switcherItems.map((item) => ({ checked: item.getAttribute('aria-checked') === 'true' })),
      );
      const initialItem = switcherItems[initialIndex] ?? switcherItems[0];

      if (initialItem instanceof HTMLElement) {
        initialItem.focus();
      }
      return;
    }

    if (hadSwitcherOpenRef.current) {
      switcherButtonRef.current?.focus();
      hadSwitcherOpenRef.current = false;
    }
  }, [switcherOpen]);

  useEffect(() => {
    if (!switcherOpen) {
      return undefined;
    }

    const handleMenuKeyDown = (event) => {
      const switcherItems = getSwitcherItems();

      if (switcherItems.length === 0) {
        return;
      }

      const currentIndex = switcherItems.findIndex((item) => item === document.activeElement);
      const nextIndex = getNextMenuItemIndex({
        key: event.key,
        itemCount: switcherItems.length,
        currentIndex,
      });

      if (nextIndex >= 0) {
        event.preventDefault();
        switcherItems[nextIndex]?.focus();
      }
    };

    const menuElement = switcherMenuRef.current;
    menuElement?.addEventListener('keydown', handleMenuKeyDown);

    return () => {
      menuElement?.removeEventListener('keydown', handleMenuKeyDown);
    };
  }, [switcherOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      hadMobileOpenRef.current = true;
      return;
    }

    if (hadMobileOpenRef.current) {
      mobileMenuButtonRef.current?.focus();
      hadMobileOpenRef.current = false;
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return undefined;
    }

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = Array.from(sidebarRef.current?.querySelectorAll(focusableSelector) ?? []).filter(
      (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
    );
    const preferredIndex = mobileCloseButtonRef.current
      ? focusableElements.findIndex((element) => element === mobileCloseButtonRef.current)
      : -1;
    const initialFocusIndex = getInitialFocusTrapIndex({
      itemCount: focusableElements.length,
      preferredIndex,
    });

    focusableElements[initialFocusIndex]?.focus();

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab' || focusableElements.length === 0) {
        return;
      }

      const activeIndex = focusableElements.findIndex((element) => element === document.activeElement);
      const wrapIndex = getFocusTrapWrapIndex({
        key: event.key,
        shiftKey: event.shiftKey,
        activeIndex,
        itemCount: focusableElements.length,
      });

      if (wrapIndex >= 0) {
        event.preventDefault();
        focusableElements[wrapIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="app-shell flex">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="app-sidebar"
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-labelledby={mobileOpen ? mobileSidebarTitleId : undefined}
        aria-describedby={mobileOpen ? mobileSidebarDescriptionId : undefined}
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-out lg:relative ${
          collapsed ? 'w-20' : 'w-[272px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {mobileOpen ? (
          <div className="sr-only">
            <h2 id={mobileSidebarTitleId}>Primary navigation menu</h2>
            <p id={mobileSidebarDescriptionId}>
              Navigate between workspace sections, review the current business, and close this menu to return to the main page.
            </p>
          </div>
        ) : null}
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
            <Link to="/" aria-label="Taska home" className="flex items-center gap-3">
              <Logo
                {...(collapsed ? logoPropPresets.workspaceCollapsed : logoPropPresets.workspaceExpanded)}
              />
            </Link>
          <button
            ref={mobileCloseButtonRef}
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2 text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition hover:border-[var(--color-border-strong)] hover:bg-white lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!collapsed ? (
          <div className="mx-4 mt-4 rounded-[16px] border border-violet-100 bg-violet-50/20 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand)]">{edition}</p>
            <div className="mt-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{business?.name ?? 'Business workspace'}</p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {business?.business_type_label ?? 'Industry-aware operating system'}
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand)] ring-1 ring-violet-200">
                Live
              </span>
            </div>
          </div>
        ) : null}

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group, groupIndex) => {
            const groupLabel = group.section || `Navigation ${groupIndex + 1}`;
            const groupId = `nav-group-${groupIndex}`;

            return (
              <section key={`${groupLabel}-${groupIndex}`} className="mb-5" aria-labelledby={!collapsed ? groupId : undefined}>
                {!collapsed ? (
                  <h3
                    id={groupId}
                    className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-faint)]"
                  >
                    {groupLabel}
                  </h3>
                ) : null}
                <ul className="space-y-1" aria-label={collapsed ? groupLabel : undefined}>
                  {group.items.map((item) => {
                    const active = isActive(item.path);

                    return (
                      <li key={`${groupLabel}-${item.path}`}>
                        <Link
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`nav-link flex h-[42px] items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                            active ? 'border border-violet-200 bg-violet-50/20 text-[var(--color-brand)]' : ''
                          }`}
                        >
                          <svg className={`h-5 w-5 flex-shrink-0 ${active ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-faint)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={item.icon} />
                          </svg>
                          {!collapsed ? <span>{item.label}</span> : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>

        <div className="border-t border-[var(--color-border)] p-4">
          <div className={`rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3.5 shadow-[var(--shadow-sm)] ${collapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand)]">
                {user?.name?.charAt(0) ?? 'U'}
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{user?.name ?? 'User'}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">{business?.role_name ?? user?.role ?? 'Business owner'}</p>
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="mt-3 hidden w-full items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] py-2 text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition hover:border-[var(--color-border-strong)] hover:bg-white lg:flex"
          >
            <svg className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        aria-hidden={mobileOpen}
        inert={mobileOpen ? '' : undefined}
      >
        <header className="app-header sticky top-0 z-30 flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="app-sidebar"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2.5 text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] transition hover:border-[var(--color-border-strong)] hover:bg-white lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden md:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Taska Workspace</p>
              <h1 className="text-base font-bold text-[var(--color-text)]">{business?.name ?? 'Business dashboard'}</h1>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center px-6 xl:flex">
            <div className="relative w-full max-w-lg">
              <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-faint)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search stock, customers, AI insights, or reports" className="app-search h-11 w-full rounded-2xl pl-11 pr-4 text-sm outline-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div ref={switcherRef} className="relative">
              <button
                ref={switcherButtonRef}
                type="button"
                onClick={() => setSwitcherOpen((value) => !value)}
                aria-expanded={switcherOpen}
                aria-haspopup="menu"
                aria-controls="business-switcher-menu"
                id="business-switcher-trigger"
                className="app-panel flex min-w-[205px] items-center justify-between rounded-[16px] px-3.5 py-2 text-left hover:border-violet-200"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Current business</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{business?.name ?? 'Select business'}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{business?.role_name ?? user?.role ?? 'User'}</p>
                </div>
                <svg className={`h-5 w-5 text-[var(--color-text-faint)] transition-transform ${switcherOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {switcherOpen ? (
                <div
                  id="business-switcher-menu"
                  ref={switcherMenuRef}
                  role="menu"
                  aria-labelledby="business-switcher-trigger"
                  className="app-panel absolute right-0 top-[calc(100%+10px)] z-50 w-[320px] rounded-[18px] p-3 shadow-[0_20px_48px_rgba(15,23,42,0.14)]"
                >
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Switch workspace</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">Dashboard, permissions, menus, and offline queue will reload for the selected business.</p>
                  </div>
                  <div className="space-y-2">
                    {businesses.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleBusinessSwitch(item.id)}
                        role="menuitemradio"
                        aria-checked={business?.id === item.id}
                        className={`flex w-full items-start justify-between rounded-2xl px-3 py-3 text-left ${
                          business?.id === item.id
                            ? 'border border-violet-200 bg-violet-50/20 shadow-[var(--shadow-sm)]'
                            : 'border border-transparent bg-[var(--color-surface-subtle)] shadow-[var(--shadow-sm)] hover:border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)]">{item.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{item.business_type_label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-[var(--color-text-soft)]">{item.role_name}</p>
                          <p className="text-[11px] text-[var(--color-text-faint)]">{item.subscription_status?.replace('_', ' ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-3">
                    {businesses.length > 1 ? (
                      <Link
                        to="/portfolio"
                        onClick={() => setSwitcherOpen(false)}
                        className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface-subtle)]"
                      >
                        <span>View portfolio</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    ) : null}
                    <Link
                      to="/businesses/new"
                      onClick={() => setSwitcherOpen(false)}
                      className="flex items-center justify-between rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-strong)]"
                    >
                      <span>Add another business</span>
                      <span aria-hidden="true">+</span>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              to="/progress"
              aria-label="Business progress"
              title="Business progress"
              className="app-panel rounded-2xl p-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-brand)]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14" />
              </svg>
            </Link>

            <button
              type="button"
              aria-label="Notifications"
              className="app-panel relative rounded-2xl p-2.5 text-[var(--color-text-muted)]"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 17h5l-1.405-1.405A2.03 2.03 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-200" />
            </button>

            <button type="button" onClick={logout} className="app-panel rounded-2xl p-2.5 text-[var(--color-text-muted)] hover:text-rose-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="app-main flex-1 overflow-y-auto">
          <div className="page-shell page-shell-wide">
            <Outlet />
          </div>
        </main>
        <SyncIndicator />
      </div>
    </div>
  );
}
