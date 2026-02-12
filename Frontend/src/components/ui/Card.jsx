import React from 'react';
import { cn } from '@/utils/cn';

export const Card = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;