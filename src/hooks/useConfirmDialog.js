import { useState, useCallback } from 'react';

/**
 * Hook for promise-based confirmation dialogs.
 *
 * Usage:
 *   const { dialogProps, confirm } = useConfirmDialog();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Creator',
 *       description: 'This cannot be undone.',
 *       confirmLabel: 'Delete',
 *       variant: 'danger',
 *     });
 *     if (confirmed) { ... }
 *   };
 *
 *   return <><ConfirmDialog {...dialogProps} /><button onClick={handleDelete}>Delete</button></>;
 */
export default function useConfirmDialog() {
  const [state, setState] = useState({
    open: false,
    title: 'Confirm',
    description: 'Are you sure?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'danger',
    resolve: null,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title || 'Confirm',
        description: options.description || 'Are you sure?',
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        variant: options.variant || 'danger',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false }));
  }, [state.resolve]);

  const handleClose = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false }));
  }, [state.resolve]);

  const dialogProps = {
    open: state.open,
    onClose: handleClose,
    onConfirm: handleConfirm,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    variant: state.variant,
  };

  return { dialogProps, confirm };
}
