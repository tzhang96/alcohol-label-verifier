'use client';

import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  showElapsedTime?: boolean;
}

export default function LoadingSpinner({
  message = 'Verifying label...',
  showElapsedTime = true,
}: LoadingSpinnerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!showElapsedTime) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [showElapsedTime]);

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12">
      {/* Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>

      {/* Message */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">{message}</p>
        {showElapsedTime && elapsedTime > 2000 && (
          <p className="text-sm text-gray-500">{formatTime(elapsedTime)}s elapsed</p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-100"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse delay-200"></div>
      </div>
    </div>
  );
}
