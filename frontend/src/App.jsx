import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import AuthPage from "./Auth";
import Dashboard from "./Dashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Dashboard
      user={session.user}
      onSignOut={() => supabase.auth.signOut()}
    />
  );
}
