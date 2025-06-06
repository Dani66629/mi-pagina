import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const ADMIN_EMAIL = 'tefita_2025@gmail.com';

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email === ADMIN_EMAIL) {
        setUser(session.user);
      } else if (session?.user && session.user.email !== ADMIN_EMAIL) {
        // If a non-admin user is somehow logged in, log them out from this context
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && session.user.email === ADMIN_EMAIL) {
          setUser(session.user);
        } else if (session?.user && session.user.email !== ADMIN_EMAIL) {
          await supabase.auth.signOut();
          setUser(null);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [ADMIN_EMAIL]);

  const login = async (email, password) => {
    setLoading(true);
    const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({
        title: "Error de autenticación",
        description: error.message || "Email o contraseña incorrectos",
        variant: "destructive",
      });
      return false;
    }

    if (loginData?.user?.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut(); 
        setUser(null);
        toast({
          title: "Acceso denegado",
          description: "Esta cuenta no tiene permisos de administrador.",
          variant: "destructive",
        });
        return false;
    }
    // setUser is handled by onAuthStateChange
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null); // Explicitly set user to null on logout
    setLoading(false);
  };
  
  const value = {
    user,
    isAuthenticated: !!user && user.email === ADMIN_EMAIL,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};