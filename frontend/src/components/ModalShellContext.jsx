import { createContext, useContext } from 'react';

export const ModalShellContext = createContext(null);

export function useModalShell() {
  const context = useContext(ModalShellContext);

  if (!context) {
    throw new Error('useModalShell must be used within a ModalShell.');
  }

  return context;
}
