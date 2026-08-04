import { createPortal } from 'react-dom';
import { useModalShellController } from './modalShellController';
import {
  ModalShellFrame,
} from './modalShellSections';

export default function ModalShell({ children, ...shellProps }) {
  const { frameProps, portalRoot } = useModalShellController(shellProps);

  if (!portalRoot) {
    return null;
  }

  return createPortal(
    <ModalShellFrame {...frameProps}>
      {children}
    </ModalShellFrame>,
    portalRoot,
  );
}

export { ModalActions } from './ModalActions';
