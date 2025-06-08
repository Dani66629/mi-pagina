
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
    const getSessionAndSetUser = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user && session.user.email === ADMIN_EMAIL && session.user.email_confirmed_at) {
        setUser(session.user);
      } else if (session?.user) {
        // User exists but is not the admin or email not confirmed, sign them out
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSessionAndSetUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (session?.user && session.user.email === ADMIN_EMAIL && session.user.email_confirmed_at) {
          setUser(session.user);
        } else if (session?.user) {
          // If user is signed in but not admin or email not confirmed, ensure they are signed out from our app state and Supabase.
           // Check if current app user state is not null before signing out to prevent potential loops if already signed out.
          if (user !== null) { 
            await supabase.auth.signOut();
          }
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
  }, [ADMIN_EMAIL]); // Removed 'user' from dependency array to prevent re-runs based on its own state change

  const login = async (email, password) => {
    setLoading(true);
    const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      if (error.message === 'Email not confirmed') {
        toast({
          title: "Email no confirmado",
          description: "Por favor, confirma tu email para poder iniciar sesión. Si ya lo hiciste, espera unos momentos e intenta de nuevo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error de autenticación",
          description: error.message || "Email o contraseña incorrectos.",
          variant: "destructive",
        });
      }
      return false;
    }

    if (!loginData?.user) {
      setLoading(false);
      toast({
          title: "Error de autenticación",
          description: "No se pudo obtener la información del usuario.",
          variant: "destructive",
      });
      return false;
    }

    // Since you've confirmed email confirmation is off in Supabase settings,
    // users created should be auto-confirmed. If an old user still has this issue,
    // they'd need re-creation with confirmation off, or manual confirmation.
    // For new users, email_confirmed_at should be set.
    // We still check it here as a safeguard or if settings change.
    if (!loginData.user.email_confirmed_at) {
        setLoading(false);
        // It's better to sign out from Supabase if their email is not confirmed but login was technically successful
        await supabase.auth.signOut(); 
        setUser(null);
        toast({
          title: "Email no confirmado",
          description: "Tu email aún no ha sido confirmado. Por favor, verifica la configuración de tu cuenta o contacta soporte.",
          variant: "destructive",
        });
        return false;
    }
    
    if (loginData.user.email !== ADMIN_EMAIL) {
        setLoading(false);
        await supabase.auth.signOut(); 
        setUser(null);
        toast({
          title: "Acceso denegado",
          description: "Esta cuenta no tiene permisos de administrador.",
          variant: "destructive",
        });
        return false;
    }
    
    // setUser(loginData.user); // This will be handled by onAuthStateChange more reliably
    // Forcing a fetch of session after login to trigger onAuthStateChange consistently
    await supabase.auth.getSession(); 
    setLoading(false); // Ensure loading is false before returning
    return true;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error logging out:", error);
        toast({
            title: "Error",
            description: "No se pudo cerrar sesión. Intenta de nuevo.",
            variant: "destructive",
        });
    }
    setUser(null); 
    setLoading(false);
  };
  
  const value = {
    user,
    isAuthenticated: !!user && user.email === ADMIN_EMAIL && !!user.email_confirmed_at,
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
