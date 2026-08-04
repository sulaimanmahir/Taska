import { getModalScrollState } from '../lib/modalShell.js';

export function observeModalScrollArea({
  scrollArea,
  setScrollState,
  windowRef = window,
  ResizeObserverRef = typeof ResizeObserver !== 'undefined' ? ResizeObserver : null,
  MutationObserverRef = typeof MutationObserver !== 'undefined' ? MutationObserver : null,
} = {}) {
  if (!scrollArea) {
    return () => {};
  }

  const updateScrollState = () => {
    const nextScrollState = getModalScrollState({
      scrollTop: scrollArea.scrollTop,
      clientHeight: scrollArea.clientHeight,
      scrollHeight: scrollArea.scrollHeight,
    });

    setScrollState((current) => (
      current.top === nextScrollState.top && current.bottom === nextScrollState.bottom
        ? current
        : nextScrollState
    ));
  };

  updateScrollState();
  scrollArea.addEventListener('scroll', updateScrollState, { passive: true });
  windowRef.addEventListener('resize', updateScrollState);

  const resizeObserver = ResizeObserverRef
    ? new ResizeObserverRef(() => {
      updateScrollState();
    })
    : null;
  const mutationObserver = MutationObserverRef
    ? new MutationObserverRef(() => {
      updateScrollState();
    })
    : null;

  if (resizeObserver) {
    resizeObserver.observe(scrollArea);

    if (scrollArea.firstElementChild) {
      resizeObserver.observe(scrollArea.firstElementChild);
    }
  }

  if (mutationObserver) {
    mutationObserver.observe(scrollArea, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden', 'inert'],
    });
  }

  return () => {
    scrollArea.removeEventListener('scroll', updateScrollState);
    windowRef.removeEventListener('resize', updateScrollState);
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
  };
}
