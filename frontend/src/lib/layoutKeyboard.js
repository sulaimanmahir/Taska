export function getCheckedMenuItemIndex(items = []) {
  return items.findIndex((item) => item?.checked);
}

export function getInitialMenuItemIndex(items = []) {
  const checkedIndex = getCheckedMenuItemIndex(items);
  return checkedIndex >= 0 ? checkedIndex : 0;
}

export function getNextMenuItemIndex({ key, itemCount, currentIndex }) {
  if (!itemCount || itemCount < 1) {
    return -1;
  }

  if (key === 'Home') {
    return 0;
  }

  if (key === 'End') {
    return itemCount - 1;
  }

  if (key !== 'ArrowDown' && key !== 'ArrowUp') {
    return -1;
  }

  const direction = key === 'ArrowDown' ? 1 : -1;
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  return (safeIndex + direction + itemCount) % itemCount;
}

export function getFocusTrapWrapIndex({
  key,
  shiftKey = false,
  activeIndex,
  itemCount,
}) {
  if (key !== 'Tab' || !itemCount || itemCount < 1) {
    return -1;
  }

  if (shiftKey) {
    return activeIndex === 0 ? itemCount - 1 : -1;
  }

  return activeIndex === itemCount - 1 ? 0 : -1;
}

export function getInitialFocusTrapIndex({
  itemCount,
  preferredIndex = 0,
}) {
  if (!itemCount || itemCount < 1) {
    return -1;
  }

  if (preferredIndex >= 0 && preferredIndex < itemCount) {
    return preferredIndex;
  }

  return 0;
}
