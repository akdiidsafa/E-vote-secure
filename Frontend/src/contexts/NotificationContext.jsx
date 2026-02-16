import React, { createContext, useContext, useState } from 'react';
import { CheckCheckIcon, TriangleAlertIcon, CircleAlertIcon, XCircleIcon, X } from 'lucide-react';
import { Alert , AlertTitle, AlertDescription  } from '../components/ui/Alert';


const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, title, description, duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, title, description }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const success = (title, description) => addNotification('success', title, description);
  const error = (title, description) => addNotification('error', title, description);
  const warning = (title, description) => addNotification('warning', title, description);
  const info = (title, description) => addNotification('info', title, description);

  return (
    <NotificationContext.Provider value={{ success, error, warning, info }}>
      {children}
      
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
        {notifications.map(({ id, type, title, description }) => {
          const config = {
            success: {
              className: 'border-none bg-green-600/10 text-green-600',
              icon: CheckCheckIcon,
              descClassName: 'text-green-600/80'
            },
            error: {
              className: 'border-none bg-red-600/10 text-red-600',
              icon: XCircleIcon,
              descClassName: 'text-red-600/80'
            },
            warning: {
              className: 'border-none bg-amber-600/10 text-amber-600',
              icon: TriangleAlertIcon,
              descClassName: 'text-amber-600/80'
            },
            info: {
              className: 'border-none bg-sky-600/10 text-sky-600',
              icon: CircleAlertIcon,
              descClassName: 'text-sky-600/80'
            }
          };

          const { className, icon: Icon, descClassName } = config[type];

          return (
            <Alert key={id} className={className}>
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertTitle>{title}</AlertTitle>
                {description && (
                  <AlertDescription className={descClassName}>
                    {description}
                  </AlertDescription>
                )}
              </div>
              <button
                onClick={() => removeNotification(id)}
                className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </Alert>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};