import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  const login = async (credentials) => {
    const { data } = await api.post('/api/auth/login', credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const logout = async () => {
    try {
      await api.get('/api/auth/logout');
    } catch (e) {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.user);
      } catch (e) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}
