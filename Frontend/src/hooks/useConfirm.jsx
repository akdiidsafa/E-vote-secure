import { useState } from 'react';

export const useConfirm = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    variant: 'default', // 'default' | 'destructive'
  });

  const confirm = (title, description, onConfirm, variant = 'default') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        description,
        onConfirm: () => {
          onConfirm?.();
          resolve(true);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        },
        variant,
      });
    });
  };

  const cancel = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return { dialogState, confirm, cancel };
};