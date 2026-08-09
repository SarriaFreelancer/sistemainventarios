'use client';

import { useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';

interface SessionMonitorProps {
  sessionToken: string;
}

export default function SessionMonitor({ sessionToken }: SessionMonitorProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (document.hidden) return;

      try {
        const response = await fetch(`/api/session/check?sessionToken=${encodeURIComponent(sessionToken)}`);
        if (!response.ok) return;

        const data = await response.json();
        
        if (data.valid === false) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          const Swal = (await import('sweetalert2')).default;
          
          let text = 'Tu sesión ya no es válida.';
          if (data.reason === 'TERMINATED_BY_ADMIN') {
            text = 'Tu sesión fue finalizada por un administrador del sistema.';
          } else if (data.reason === 'EXPIRED') {
            text = 'Tu sesión ha expirado por inactividad.';
          }

          await Swal.fire({
            icon: 'warning',
            title: 'Sesión Finalizada',
            text,
            confirmButtonText: 'Ir al Login',
            confirmButtonColor: '#dc2626',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          signOut({ callbackUrl: '/auth/login?reason=admin_disconnect' });
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(checkSession, 10000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        checkSession();
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check and start
    checkSession();
    startPolling();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionToken]);

  return null;
}
