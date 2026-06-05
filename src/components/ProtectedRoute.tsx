import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(!!session);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>กำลังโหลด...</div>;
  }

  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }

  return children;
}