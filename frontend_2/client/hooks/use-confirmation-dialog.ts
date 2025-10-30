import { useState, useCallback } from 'react';

export interface ConfirmationConfig {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export interface ConfirmationState extends ConfirmationConfig {
  isOpen: boolean;
  onConfirm: () => void;
}

export const useConfirmationDialog = () => {
  const [state, setState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
    onConfirm: () => {},
  });

  const showConfirmation = useCallback((
    config: ConfirmationConfig,
    onConfirm: () => void
  ) => {
    setState({
      ...config,
      isOpen: true,
      onConfirm,
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      variant: config.variant || 'default',
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    hideConfirmation();
  }, [state.onConfirm, hideConfirmation]);

  // Predefined confirmation dialogs for common actions
  const confirmDelete = useCallback((
    itemName: string,
    itemType: string,
    onConfirm: () => void
  ) => {
    showConfirmation({
      title: `Delete ${itemType}`,
      description: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    }, onConfirm);
  }, [showConfirmation]);

  const confirmBulkDelete = useCallback((
    count: number,
    itemType: string,
    onConfirm: () => void
  ) => {
    showConfirmation({
      title: `Delete ${count} ${itemType}${count > 1 ? 's' : ''}`,
      description: `Are you sure you want to delete ${count} ${itemType}${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmLabel: `Delete ${count} item${count > 1 ? 's' : ''}`,
      cancelLabel: 'Cancel',
      variant: 'destructive',
    }, onConfirm);
  }, [showConfirmation]);

  const confirmAction = useCallback((
    title: string,
    description: string,
    onConfirm: () => void,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: 'default' | 'destructive';
    }
  ) => {
    showConfirmation({
      title,
      description,
      confirmLabel: options?.confirmLabel || 'Confirm',
      cancelLabel: options?.cancelLabel || 'Cancel',
      variant: options?.variant || 'default',
    }, onConfirm);
  }, [showConfirmation]);

  return {
    // State
    isOpen: state.isOpen,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    variant: state.variant,
    
    // Actions
    showConfirmation,
    hideConfirmation,
    handleConfirm,
    
    // Predefined confirmations
    confirmDelete,
    confirmBulkDelete,
    confirmAction,
  };
};

export default useConfirmationDialog;