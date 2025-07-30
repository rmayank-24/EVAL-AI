import React from 'react';
import { Loader2 } from 'lucide-react';

// 1. Define a specific type for the allowed sizes.
// This tells TypeScript that 'size' can only be one of these three strings.
type SpinnerSize = 'small' | 'default' | 'large';

// 2. Define the props for the component using the new type.
interface LoadingSpinnerProps {
  size?: SpinnerSize;
  text?: string;
}

const LoadingSpinner = ({ size = 'default', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  // 3. The error is now gone because TypeScript knows that 'size' will always
  // be a valid key of the 'sizeClasses' object.
  const spinnerSizeClass = sizeClasses[size];

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${spinnerSizeClass} animate-spin text-blue-600`} />
      {text && <span className="text-gray-400 font-mono">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;