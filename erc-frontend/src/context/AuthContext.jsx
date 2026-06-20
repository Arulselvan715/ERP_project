import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const registerUser = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    registerUser,
    checkRole,
    isAdmin: (user?.role || '').toLowerCase().replace(/[\s_-]+/g, '') === 'admin',
    isSales: ['salesuser', 'admin', 'businessowner', 'inventorymanager'].includes((user?.role || '').toLowerCase().replace(/[\s_-]+/g, '')),
    isPurchase: ['purchaseuser', 'admin', 'businessowner', 'inventorymanager'].includes((user?.role || '').toLowerCase().replace(/[\s_-]+/g, '')),
    isManufacturing: ['manufacturinguser', 'admin', 'businessowner', 'inventorymanager'].includes((user?.role || '').toLowerCase().replace(/[\s_-]+/g, '')),
    isInventory: ['inventorymanager', 'admin', 'businessowner'].includes((user?.role || '').toLowerCase().replace(/[\s_-]+/g, '')),
    isOwner: ['businessowner'].includes((user?.role || '').toLowerCase().replace(/[\s_-]+/g, '')),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
