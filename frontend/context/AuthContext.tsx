"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, AuthResponse } from "@/types";
import { apiRequest } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Restore cached user profile if present
    const cachedUser = localStorage.getItem("zoom_clone_user");
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem("zoom_clone_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      data: { email, password },
    });
    setUser(res.user);
    localStorage.setItem("zoom_clone_user", JSON.stringify(res.user));
    router.push("/dashboard");
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await apiRequest<AuthResponse>("/api/auth/signup", {
      method: "POST",
      data: { name, email, password },
    });
    setUser(res.user);
    localStorage.setItem("zoom_clone_user", JSON.stringify(res.user));
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request error", e);
    } finally {
      setUser(null);
      localStorage.removeItem("zoom_clone_user");
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
