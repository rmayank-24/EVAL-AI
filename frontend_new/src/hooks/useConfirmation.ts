import { useContext } from 'react';
// Make sure the path to ConfirmationContext is correct
import { ConfirmationContext, ConfirmationContextType } from '../contexts/ConfirmationContext';

export const useConfirmation = (): ConfirmationContextType => {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
