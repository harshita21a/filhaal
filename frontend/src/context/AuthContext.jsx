import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(null); // null = checking

  useEffect(() => {
    const token = localStorage.getItem("filhaal_token");
    if (!token) { setAuthed(false); return; }
    api.get("/admin/verify")
      .then(() => setAuthed(true))
      .catch(() => { localStorage.removeItem("filhaal_token"); setAuthed(false); });
  }, []);

  const login = (token) => { localStorage.setItem("filhaal_token", token); setAuthed(true); };
  const logout = () => { localStorage.removeItem("filhaal_token"); setAuthed(false); };

  return (
    <AuthContext.Provider value={{ authed, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
