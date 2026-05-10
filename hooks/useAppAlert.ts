import { useState, useCallback } from 'react';
import type { AppAlertButton } from '../components/AppAlert';

type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
};

export function useAppAlert() {
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setConfig({ title, message, buttons });
  }, []);

  const dismiss = useCallback(() => setConfig(null), []);

  return {
    showAlert,
    alertProps: {
      visible: config !== null,
      title: config?.title ?? '',
      message: config?.message,
      buttons: config?.buttons,
      onDismiss: dismiss,
    },
  };
}
