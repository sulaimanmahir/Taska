import {
  getFocusTrapWrapIndex,
  getInitialFocusTrapIndex,
} from './layoutKeyboard.js';

const MODAL_DISMISSAL_CLOSE_SOURCES = new Set(['backdrop', 'escape', 'close-button']);
const MODAL_SCROLL_OVERFLOW_THRESHOLD = 4;
const MODAL_SCROLL_EDGE_THRESHOLD = 8;

export function normalizeModalCloseRequestSource(source) {
  return typeof source === 'string' && source.length > 0 ? source : 'action';
}

export function shouldRestoreFocusForModalCloseSource(source) {
  return !MODAL_DISMISSAL_CLOSE_SOURCES.has(normalizeModalCloseRequestSource(source));
}

export function getModalScrollState({
  scrollTop = 0,
  clientHeight = 0,
  scrollHeight = 0,
}) {
  const hasScrollableOverflow = scrollHeight - clientHeight > MODAL_SCROLL_OVERFLOW_THRESHOLD;

  if (!hasScrollableOverflow) {
    return { top: false, bottom: false };
  }

  return {
    top: scrollTop > MODAL_SCROLL_EDGE_THRESHOLD,
    bottom: scrollTop + clientHeight < scrollHeight - MODAL_SCROLL_EDGE_THRESHOLD,
  };
}

export function getModalFocusTrapRedirectIndex({
  key,
  shiftKey = false,
  activeIndex = -1,
  itemCount = 0,
  containsActiveElement = true,
}) {
  if (key !== 'Tab' || !itemCount || itemCount < 1) {
    return -1;
  }

  if (!containsActiveElement) {
    return getInitialFocusTrapIndex({
      itemCount,
      preferredIndex: shiftKey ? itemCount - 1 : 0,
    });
  }

  return getFocusTrapWrapIndex({
    key,
    shiftKey,
    activeIndex,
    itemCount,
  });
}
