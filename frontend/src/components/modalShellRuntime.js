export const MODAL_ROOT_ID = 'taska-modal-root';
export const MODAL_ROOT_OWNER = 'taska-modal-shell';
export const MODAL_STACK_CHANGE_EVENT = 'taska:modal-stack-change';

export function registerModalStackInstance(stack = [], instanceId) {
  return [...stack.filter((id) => id !== instanceId), instanceId];
}

export function unregisterModalStackInstance(stack = [], instanceId) {
  return stack.filter((id) => id !== instanceId);
}

export function isTopModalStackInstance(stack = [], instanceId) {
  return stack[stack.length - 1] === instanceId;
}

export function getModalBodyLockSnapshot(style = {}) {
  return {
    overflow: style.overflow,
    paddingRight: style.paddingRight,
  };
}

export function getModalBodyLockStyles({
  innerWidth = 0,
  clientWidth = 0,
}) {
  const scrollbarWidth = innerWidth - clientWidth;

  return {
    overflow: 'hidden',
    paddingRight: scrollbarWidth > 0 ? `${scrollbarWidth}px` : null,
  };
}

export function shouldScheduleModalRootCleanup(root, owner = MODAL_ROOT_OWNER) {
  return Boolean(root) && root.dataset?.owner === owner;
}

export function shouldCleanupModalRoot(root, owner = MODAL_ROOT_OWNER) {
  return shouldScheduleModalRootCleanup(root, owner)
    && root.isConnected
    && root.childElementCount === 0;
}

export function createModalStackChangeEvent(eventName = MODAL_STACK_CHANGE_EVENT) {
  if (typeof CustomEvent === 'function') {
    return new CustomEvent(eventName);
  }

  return { type: eventName };
}

export function createModalShellRuntime({
  windowRef = window,
  documentRef = document,
  rootId = MODAL_ROOT_ID,
  owner = MODAL_ROOT_OWNER,
  stackChangeEventName = MODAL_STACK_CHANGE_EVENT,
} = {}) {
  let activeModalCount = 0;
  let bodyLockSnapshot = null;
  let activeModalStack = [];

  const notifyModalStackChange = () => {
    windowRef.dispatchEvent(createModalStackChangeEvent(stackChangeEventName));
  };

  return {
    ensureModalRoot() {
      const existingRoot = documentRef.getElementById(rootId);

      if (existingRoot) {
        return existingRoot;
      }

      const root = documentRef.createElement('div');
      root.id = rootId;
      root.dataset.owner = owner;
      documentRef.body.append(root);
      return root;
    },
    scheduleModalRootCleanup(root) {
      if (!shouldScheduleModalRootCleanup(root, owner)) {
        return;
      }

      windowRef.requestAnimationFrame(() => {
        if (!shouldCleanupModalRoot(root, owner)) {
          return;
        }

        root.remove();
      });
    },
    lockBodyScroll() {
      if (activeModalCount === 0) {
        bodyLockSnapshot = getModalBodyLockSnapshot(documentRef.body.style);

        const nextBodyLockStyles = getModalBodyLockStyles({
          innerWidth: windowRef.innerWidth,
          clientWidth: documentRef.documentElement.clientWidth,
        });

        documentRef.body.style.overflow = nextBodyLockStyles.overflow;

        if (nextBodyLockStyles.paddingRight !== null) {
          documentRef.body.style.paddingRight = nextBodyLockStyles.paddingRight;
        }
      }

      activeModalCount += 1;
    },
    unlockBodyScroll() {
      activeModalCount = Math.max(0, activeModalCount - 1);

      if (activeModalCount === 0 && bodyLockSnapshot) {
        documentRef.body.style.overflow = bodyLockSnapshot.overflow;
        documentRef.body.style.paddingRight = bodyLockSnapshot.paddingRight;
        bodyLockSnapshot = null;
      }
    },
    registerModalInstance(instanceId) {
      activeModalStack = registerModalStackInstance(activeModalStack, instanceId);
      notifyModalStackChange();
    },
    unregisterModalInstance(instanceId) {
      activeModalStack = unregisterModalStackInstance(activeModalStack, instanceId);
      notifyModalStackChange();
    },
    isTopModalInstance(instanceId) {
      return isTopModalStackInstance(activeModalStack, instanceId);
    },
    hasActiveModals() {
      return activeModalStack.length > 0;
    },
  };
}

export const modalShellRuntime = typeof window !== 'undefined' && typeof document !== 'undefined'
  ? createModalShellRuntime()
  : null;
