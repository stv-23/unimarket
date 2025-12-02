"use client";

import { useState } from 'react';
import { useNotifications } from '@/lib/useNotifications';

export default function NotificationPrompt() {
  const { permission, isSupported, isSubscribed, isLoading, requestPermission } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notificationPromptDismissed') === 'true';
    }
    return false;
  });

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      setIsDismissed(true);
      localStorage.setItem('notificationPromptDismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  // Don't show if:
  // - Not supported
  // - Already subscribed
  // - Permission already denied
  // - User dismissed the prompt
  if (!isSupported || isSubscribed || permission === 'denied' || isDismissed) {
    return null;
  }

  // Don't show if permission already granted (will auto-subscribe)
  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 shadow-lg border-b border-blue-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className="w-6 h-6 flex-shrink-0"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" 
            />
          </svg>
          <div>
            <p className="font-semibold text-sm">Activa las notificaciones</p>
            <p className="text-xs text-blue-100">Recibe alertas cuando lleguen nuevos mensajes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? 'Activando...' : 'Activar'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-100 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
