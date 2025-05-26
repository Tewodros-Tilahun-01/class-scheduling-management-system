// src/lib/AuthContext.jsx
import { getMe, loginUser, logoutUser } from "@/services/authService";
import React, { createContext, useState, useEffect, useContext } from "react";
import { redirect, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Holds user data
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res);
      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Sign in function
  const signIn = async (credentials) => {
    const res = await loginUser(credentials);
    setUser(res.user);
    setLoading(false);
    navigate("/");
  };

  // Logout
  const signOut = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, loading, setLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easy usage
export const useAuth = () => useContext(AuthContext);
