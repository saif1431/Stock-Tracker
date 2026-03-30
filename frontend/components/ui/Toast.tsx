import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-destructive/10 border-destructive/20',
    info: 'bg-blue-500/10 border-blue-500/20',
  };

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-right-10 duration-300 z-50 ${colors[type]}`}>
      {icons[type]}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
};
