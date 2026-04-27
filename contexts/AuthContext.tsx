import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;
  username: string | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isLoggedIn: false,
  username: null,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const fetchUsername = async (userId: string, session?: any) => {
    const { data } = await supabase.from('users').select('username').eq('user_id', userId).single();
    if (data?.username) {
      setUsername(data.username);
    } else {
      const meta = session?.user?.user_metadata;
      setUsername(meta?.username ?? null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUsername(session.user.id, session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUsername(session.user.id, session);
      else setUsername(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      isLoggedIn: !!session,
      username,
      signOut: () => supabase.auth.signOut(),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
