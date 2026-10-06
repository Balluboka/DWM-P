import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, show: true }]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, show: false } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => {
          let Icon = Info;
          let colorClass = 'border-blue-500 text-blue-500';
          if (toast.type === 'success') {
            Icon = CheckCircle;
            colorClass = 'border-green-500 text-green-500';
          } else if (toast.type === 'error') {
            Icon = XCircle;
            colorClass = 'border-red-500 text-red-500';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorClass = 'border-amber-500 text-amber-500';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 bg-surface-800 p-4 rounded-lg shadow-lg border-l-4 ${colorClass} transition-all duration-300 ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            >
              <Icon size={20} className={colorClass} />
              <p className="text-sm font-medium text-white">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="ml-auto text-surface-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
