import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("vc_token"));

  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem("vc_token");
    if (!storedToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("vc_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem("vc_token", newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post("/auth/register", formData);
    const { token: newToken, user: userData, wallet } = res.data;
    localStorage.setItem("vc_token", newToken);
    setToken(newToken);
    setUser(userData);
    return { user: userData, wallet };
  };

  const logout = () => {
    localStorage.removeItem("vc_token");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isAuthenticated, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
