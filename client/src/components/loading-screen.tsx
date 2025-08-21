import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingScreen({ isVisible, message = "Analyzing repository..." }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated logo/icon */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Main title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            DocuMind AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            AI-Powered Documentation Generator
          </p>
        </div>

        {/* Loading message */}
        <div className="space-y-3">
          <p className="text-xl text-gray-700 dark:text-gray-200">
            {message}{dots}
          </p>
          
          {/* Progress bar */}
          <div className="w-64 mx-auto">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Author credit */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Made by <span className="text-blue-600 dark:text-blue-400 font-bold">Bharath</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Transforming code analysis with AI
          </p>
        </div>
      </div>
    </div>
  );
}