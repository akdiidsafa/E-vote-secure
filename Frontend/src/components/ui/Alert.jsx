import React from 'react';
import { CheckCheckIcon, TriangleAlertIcon, CircleAlertIcon, XCircleIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Alert = ({ className, children, ...props }) => {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-lg p-4 flex items-start space-x-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertTitle = ({ className, children, ...props }) => {
  return (
    <h5
      className={cn('font-semibold leading-none tracking-tight mb-1', className)}
      {...props}
    >
      {children}
    </h5>
  );
};

export const AlertDescription = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('text-sm leading-relaxed', className)}
      {...props}
    >
      {children}
    </div>
  );
};