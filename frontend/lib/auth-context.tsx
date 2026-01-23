"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken, removeToken, storeToken, LoginResponse, API_BASE_URL } from "./api";

interface User {
  id: number;
  username: string;
  role: "admin" | "trieur" | "chauffeur";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Vérifier le token au chargement
    const token = getToken();
    if (token) {
      // Décoder le token pour récupérer les infos user
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.sub,
          username: payload.username || payload.sub,
          role: payload.role as User["role"],
        });
      } catch {
        removeToken();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (response: LoginResponse) => {
    storeToken(response.access_token);
    setUser({
      id: response.id,
      username: response.username,
      role: response.role as User["role"],
    });
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// HOC pour protéger les routes par rôle
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: User["role"][]
) {
  return function ProtectedRoute(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push("/login");
        } else if (!allowedRoles.includes(user.role)) {
          // Rediriger vers la bonne interface selon le rôle
          if (user.role === "chauffeur") router.push("/driver/route");
          else if (user.role === "trieur") router.push("/sorter");
          else router.push("/admin");
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
        </div>
      );
    }

    if (!user || !allowedRoles.includes(user.role)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
