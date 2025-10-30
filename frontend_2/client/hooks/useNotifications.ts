import { toast } from 'sonner';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export const useNotifications = () => {
  const showSuccess = (message: string, options?: NotificationOptions) => {
    toast.success(options?.title || 'Success', {
      description: options?.description || message,
      duration: options?.duration || 4000,
    });
  };

  const showError = (message: string, options?: NotificationOptions) => {
    toast.error(options?.title || 'Error', {
      description: options?.description || message,
      duration: options?.duration || 6000,
    });
  };

  const showWarning = (message: string, options?: NotificationOptions) => {
    toast.warning(options?.title || 'Warning', {
      description: options?.description || message,
      duration: options?.duration || 5000,
    });
  };

  const showInfo = (message: string, options?: NotificationOptions) => {
    toast.info(options?.title || 'Info', {
      description: options?.description || message,
      duration: options?.duration || 4000,
    });
  };

  const showLoading = (message: string, options?: NotificationOptions) => {
    return toast.loading(options?.title || 'Loading', {
      description: options?.description || message,
    });
  };

  const dismiss = (toastId: string | number) => {
    toast.dismiss(toastId);
  };

  // Convenience methods for common operations
  const showOperationSuccess = (operation: string, item?: string) => {
    const message = item 
      ? `${item} ${operation} successfully`
      : `${operation} completed successfully`;
    showSuccess(message);
  };

  const showOperationError = (operation: string, item?: string, error?: any) => {
    const message = item 
      ? `Failed to ${operation.toLowerCase()} ${item}`
      : `${operation} failed`;
    
    const description = error?.message || error?.response?.data?.message || 'Please try again';
    showError(message, { description });
  };

  const showValidationError = (message = 'Please check the form for errors') => {
    showError('Validation Error', { description: message });
  };

  const showNetworkError = () => {
    showError('Network Error', { 
      description: 'Please check your internet connection and try again' 
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismiss,
    showOperationSuccess,
    showOperationError,
    showValidationError,
    showNetworkError,
  };
};