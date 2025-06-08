
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
  const ADMIN_EMAIL = 'daniflores6662@gmail.com'; // Actualizado al nuevo email

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
  }, [ADMIN_EMAIL]);

  const login = async (email, password) => {
    setLoading(true);
    const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      if (error.message === 'Email not confirmed') {
        toast({
          title: "Email no confirmado",
          description: "Por favor, confirma tu email para poder iniciar sesión. Si ya lo hiciste, o la confirmación está desactivada, espera unos momentos e intenta de nuevo.",
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

    // Asumimos que si "Enable email confirmations" está DESACTIVADO en Supabase,
    // email_confirmed_at se establecerá automáticamente al crear el usuario.
    // Esta verificación sigue siendo una buena práctica.
    if (!loginData.user.email_confirmed_at) {
        setLoading(false);
        await supabase.auth.signOut(); 
        setUser(null);
        toast({
          title: "Email no confirmado",
          description: "Tu email aún no ha sido confirmado. Verifica la configuración de tu cuenta en Supabase o contacta soporte si el problema persiste.",
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
    
    await supabase.auth.getSession(); 
    setLoading(false); 
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
