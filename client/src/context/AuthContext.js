import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as api from '../api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hackmatch_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on load. A dead token just means logged out.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api.setAuthToken(token);
    api
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        api.setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const adopt = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    api.setAuthToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback((email, password) => api.login({ email, password }).then(adopt), [adopt]);

  const register = useCallback(
    (body) => api.register(body).then(adopt),
    [adopt]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    api.setAuthToken(null);
    setUser(null);
  }, []);

  /** Merge fresh profile fields into the cached user after an edit. */
  const updateUser = useCallback((patch) => setUser((prev) => ({ ...prev, ...patch })), []);

  /** A profile is usable for matching only once these are filled in. */
  const profileComplete = Boolean(
    user && user.name && user.skills?.length && (user.collegeName || user.organizationName)
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser, profileComplete }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
