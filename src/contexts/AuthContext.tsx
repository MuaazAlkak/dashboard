import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, userService } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      // Verify user is still logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) {
        return; // User logged out
      }
      
      const role = await userService.getCurrentUserRole();
      
      // Double-check user is still logged in before setting state
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id === userId) {
        setUserRole(role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

