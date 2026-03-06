"use client";
import { useState, useEffect, useCallback } from "react";
import API from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
}

let authState: AuthState = { user: null, loading: true };
let authListeners = new Set<() => void>();
let initialized = false;

function setAuthState(next: Partial<AuthState>) {
  authState = { ...authState, ...next };
  authListeners.forEach((fn) => fn());
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function initAuth() {
  if (initialized) return;
  initialized = true;

  if (typeof window === "undefined") {
    setAuthState({ loading: false });
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    setAuthState({ user: null, loading: false });
    return;
  }

  // Sync cookie from localStorage for middleware
  setCookie("token", token, 7);

  API.get("/auth/me")
    .then((res) => {
      setAuthState({ user: res.data.user, loading: false });
    })
    .catch(() => {
      localStorage.removeItem("token");
      clearCookie("token");
      setAuthState({ user: null, loading: false });
    });
}

export function useAuth() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    authListeners.add(listener);
    initAuth();
    return () => {
      authListeners.delete(listener);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await API.post("/auth/login", { email, password });
    const token = res.data.token;
    localStorage.setItem("token", token);
    setCookie("token", token, 7);
    setAuthState({ user: res.data.user, loading: false });
    return res.data;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await API.post("/auth/register", { name, email, password });
    const token = res.data.token;
    localStorage.setItem("token", token);
    setCookie("token", token, 7);
    setAuthState({ user: res.data.user, loading: false });
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    await API.get("/auth/logout").catch(() => {});
    localStorage.removeItem("token");
    clearCookie("token");
    initialized = false;
    setAuthState({ user: null, loading: false });
  }, []);

  const setUser = useCallback((user: User) => {
    setAuthState({ user, loading: false });
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    login,
    register,
    logout,
    setUser,
  };
}
